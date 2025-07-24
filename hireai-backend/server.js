// hireai-backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// --- Express App & Middleware Setup ---
const app = express();
const port = 3001;
app.set('trust proxy', 1);
const corsOptions = { origin: 'http://localhost:5173', credentials: true };
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to local MongoDB!'))
    .catch(err => console.error('Error connecting to local MongoDB:', err));

// --- Database Schemas & Models ---
const MessageSchema = new mongoose.Schema({
    chatId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    content: { type: String, required: true },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const ChatSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);
const Chat = mongoose.model('Chat', ChatSchema);

// --- Your System Prompt ---
const HIREAI_SYSTEM_PROMPT = `
You are the user-facing chatbot agent of an HR app which tries to understand the requirements of the user by engaging in a conversation with the user and then finds them the best possible workforce for their projects. You are supposed to ask intelligent questions to gather as much data as possible from the user about the tasks or project they're trying to work on, timeline, budget, constraints, company culture, and other basic information which you feel is important, but do not ask the user for the skills they want in the candidate as they won’t be aware of the skills that will be required in the project. 

In case if user does not says anything about the budget then just give them a rough idea that for these type of projects this much budget is needed and this time should be invested. Then if the user says anything about the budget then only move further otherwise just stop conversation over there. But if user reveals the budget and timeline at one go then continue the conversation but do not ask directly since people mostly cannot answer well when under direct questions, so easily and intelligently try to extract info about the user and company culture. 

There are some guidelines for you that needs to be followed up while extracting information from user:
- Don’t be affirmative
- Stay concise as user has to read a lot for answering which may irritate them

Once you end up with asking questions, send the user a structured plan for their project, where you will be providing them a proper plan according to their project which comprises Technical & Soft skills, Budget (in INR), Timeline (in months) and specific constraints that the user is talking about. And the plan needs to be shared in the same schema in which I have told you.

- Technical & soft skills required for the project, where you have to specify why you need these skills and secondly also specify how many candidates should be recruited. Since we are hiring freshers we can not source employees with prior experience or job which requires an experienced person. Hence, specify only those roles which can be hired directly from colleges.
- Now it is on Budget (in INR). Then we need to specify where the budget should be allocated and where each penny of that budget will spend. If the user has specified then clearly say according to your budget, do not give your own numbers as this is not your job. Now once you have specified the budget to be allocated for the tools, miscellaneous expenses and human resource, now we have to specify the salary that is to be paid to each individual (if 3 individuals are to be hired, then you need need to specify salary or pay of each employee, based on the work done by each individual, if a developer is needed whose task is to handle complex task and the other 2 employees are just for handling day-to-day tasks then we have to allocate their salaries accordingly).
- Lastly is related to Timeline (in months). Then we have to specify how much time will get invested in the project, with specifying where each minute of this timeline will be spent during this project. If the user has specified a timeline then just stick to that otherwise do not give your own numbers as this is not your job.

I want you to give the output in the preferred format as this is the most suitable schema according to me. And since we are asking about constraints from the user so formulate the plan in accordance to that.

This can be a repetitive task as the plan is decided by the user. So, once you have shared the plan ask them about the plan, ‘Did they like the plan or not ?’. If the user ends up getting satisfied then just reply with ‘thanks for confirmation, the further process will be started.’ but if they are not satisfied with the plan then ask ‘are there any changes that need to be made or do we just reformulate the plan?’. Showcasing a structured plan is a repetitive task until and unless the user gets satisfied.
`;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define safety settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// --- THIS IS THE CORRECTED MODEL CONFIGURATION ---
// We are using the 'flash' model because it's faster and has a more generous free tier for chatbots.
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest",
    systemInstruction: HIREAI_SYSTEM_PROMPT,
    safetySettings,
});

// --- Helper function to clean IP address ---
const getCleanIpAddress = (req) => {
  let ip = req.ip;
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
};

// --- Main Chat Endpoint ---
app.post('/chat', async (req, res) => {
    try {
        let { prompt, chatId, history } = req.body;
        let userId = req.cookies.userId;
        const userIpAddress = getCleanIpAddress(req);

        if (!userId) {
            userId = `guest-${uuidv4()}`;
            res.cookie('userId', userId, { maxAge: 31536000000, httpOnly: true });
        }
        
        const isNewChat = !chatId;
        if (isNewChat) {
            chatId = uuidv4();
            const newChat = new Chat({ chatId, userId });
            await newChat.save();
        }

        const userMessage = new Message({
            chatId: chatId, sender: 'user', content: prompt, ipAddress: userIpAddress
        });
        await userMessage.save();
        
        const chatSession = model.startChat({
            history: history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            })),
        });

        const result = await chatSession.sendMessage(prompt);
        const aiResponseText = result.response.text();

        const botMessage = new Message({
            chatId: chatId, sender: 'bot', content: aiResponseText
        });
        await botMessage.save();

        console.log(`Saved interaction to local DB for Chat ID: ${chatId}`);
        
        res.json({
            reply: aiResponseText,
            ...(isNewChat && { newChatId: chatId })
        });

    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).json({ error: 'Failed to process chat request.' });
    }
});

// --- Session Restoration Endpoint ---
app.get('/session', async (req, res) => {
    try {
        const { userId } = req.cookies;
        if (!userId) { return res.status(200).json({ message: "No active session found." }); }
        const latestChat = await Chat.findOne({ userId: userId }).sort({ createdAt: -1 });
        if (!latestChat) { return res.status(200).json({ userId, message: "User exists but has no chats." }); }
        const chatHistory = await Message.find({ chatId: latestChat.chatId }).sort({ createdAt: 1 });
        res.status(200).json({ userId: userId, chatId: latestChat.chatId, messages: chatHistory });
    } catch (error) {
        console.error("Error in /session endpoint:", error);
        res.status(500).json({ error: 'Failed to restore session.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});