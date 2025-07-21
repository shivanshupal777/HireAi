// src/components/ChatPanel.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import StyledBotMessage from './StyledBotMessage'; 
import { Send, Cpu, User } from 'lucide-react';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

const TypingIndicator = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-1 p-3 bg-gray-600 rounded-lg">
      <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}/>
      <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}/>
      <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}/>
    </motion.div>
);

const ExamplePrompt = ({ text, promptText, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={() => onClick(promptText)}
      className="bg-gray-800/80 p-4 rounded-lg text-left text-sm hover:bg-gray-900 transition-colors"
    >
      <p className="font-semibold text-gray-200">{text}</p>
      <p className="text-gray-400">{promptText}</p>
    </motion.button>
);


const ChatPanel = ({ messages, setMessages }) => {
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef(null);
  const userName = "Alex";
  const hasStartedChat = messages.length > 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const sendMessage = async (promptText) => {
    const textToSend = typeof promptText === 'string' ? promptText : input;
    if (!textToSend.trim()) return;
    setMessages(prev => [...prev, { text: textToSend, sender: 'user' }]);
    setInput("");
    setIsBotTyping(true);

    try {
        const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: textToSend }),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
    } catch (error) {
        console.error("Fetch API call failed:", error);
        setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting.", sender: 'bot' }]);
    } finally {
        setIsBotTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const inputArea = (
    <div className="relative w-full">
      <TextareaAutosize
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask HireAI anything... (Ctrl+Enter to send)"
        className="w-full bg-gray-800 text-white rounded-lg p-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none"
        rows={1} maxRows={5}
      />
      <button
        onClick={() => sendMessage()} disabled={!input.trim()}
        className="absolute right-3 bottom-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors p-2 rounded-full"
      >
        <Send size={18} />
      </button>
    </div>
  );

  return (
    <div className="flex-grow flex flex-col bg-gray-700 h-full relative overflow-hidden">
      {!hasStartedChat ? (
        <div className="flex-grow flex flex-col items-center justify-center text-white text-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                {getGreeting()}, {userName}
            </h1>
            <p className="text-lg text-gray-300 mt-2 mb-12">How can I help you today?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <ExamplePrompt onClick={sendMessage} text="Find candidates for..." promptText="a senior Python developer with machine learning experience." />
              <ExamplePrompt onClick={sendMessage} text="Help me with..." promptText="a UI/UX designer proficient in Figma and user research." />
            </div>
            {inputArea}
          </motion.div>
        </div>
      ) : (
        <>
          <div className="flex-grow p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800/50 hover:scrollbar-thumb-blue-500">
            {/* --- THIS IS THE FULLY CORRECTED BLOCK --- */}
            <AnimatePresence>
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-800'}`}>
                            {msg.sender === 'user' ? <User size={18} color="white" /> : <Cpu size={18} color="#3b82f6" />}
                        </div>
                        <div className={`rounded-xl p-4 max-w-lg shadow-md text-white/90 ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-600 rounded-bl-none'}`}>
                            {msg.sender === 'bot' ? <StyledBotMessage content={msg.text} /> : <p>{msg.text}</p>}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {isBotTyping && (
                <motion.div className="flex items-end gap-3 flex-row w-fit">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800">
                        <Cpu size={18} color="#3b82f6" />
                    </div>
                    <TypingIndicator />
                </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="bg-gray-700 px-6 pb-4 pt-2 border-t border-gray-600/50">
            {inputArea}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPanel;