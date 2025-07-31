// hireai-backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

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

        const userMessage = new Message({ chatId, sender: 'user', content: prompt, ipAddress: userIpAddress });
        await userMessage.save();
        
        const n8nWebhookUrl = 'https://shivanshu-nsut.app.n8n.cloud/webhook/HRBOT';
        
        console.log(`Sending data to n8n webhook for Chat ID: ${chatId}`);

        // --- START: THE KEY CHANGE IS HERE ---
        // The n8n AI Agent and Memory nodes expect a specific history format.
        // We will format our simple message history into what n8n needs.
        const formattedHistory = history.map(msg => {
            return {
                type: msg.sender === 'user' ? 'human' : 'ai',
                data: {
                    content: msg.text
                }
            };
        });
        // --- END: THE KEY CHANGE ---

        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                chatId: chatId,
                userId: userId,
                // Send the newly formatted history
                history: formattedHistory,
                ipAddress: userIpAddress
            })
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n webhook failed with status: ${n8nResponse.status} ${await n8nResponse.text()}`);
        }

        const n8nData = await n8nResponse.json();
        const aiResponseText = n8nData.reply;

        if (!aiResponseText) {
            throw new Error("Invalid response format from n8n webhook. Expected a 'reply' key.");
        }

        const botMessage = new Message({ chatId, sender: 'bot', content: aiResponseText });
        await botMessage.save();
        
        res.json({
            reply: aiResponseText,
            ...(isNewChat && { newChatId: chatId })
        });

    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).json({ error: 'Failed to process chat request.' });
    }
});


// --- History and Session Endpoints ---
app.get('/history', async (req, res) => {
    try {
        const { userId } = req.cookies;
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated." });
        }
        const userChats = await Chat.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(userChats);
    } catch (error) {
        console.error("Error in /history endpoint:", error);
        res.status(500).json({ error: 'Failed to fetch chat history.' });
    }
});

app.get('/chat/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error(`Error fetching messages for chat ${req.params.chatId}:`, error);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

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