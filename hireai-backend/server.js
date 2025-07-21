// hireai-backend/server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001;

const corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// API Endpoint for chat
app.post('/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // --- THE FIX IS HERE ---
        // Use a current, available model name. "flash" is great for chatbots.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        
        const fullPrompt = `You are HireAI, a helpful assistant for recruiters. A user is asking: "${prompt}". Please provide a concise and helpful response.`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        // This will now log more specific errors if something else goes wrong
        console.error("Error communicating with Google AI:", error);
        res.status(500).json({ error: 'Failed to get a response from the AI service.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Accepting requests from http://localhost:5173');
});