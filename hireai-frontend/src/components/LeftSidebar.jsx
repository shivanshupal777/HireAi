// src/components/LeftSidebar.jsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, User, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Accept the new props: onChatSelect and currentChatId
const LeftSidebar = ({ onNewChat, userId, onChatSelect, currentChatId }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(280);
  // State to hold the list of past chats fetched from the backend
  const [history, setHistory] = useState([]);

  // This effect runs whenever the userId is available or changes.
  useEffect(() => {
    // Only fetch history if we have a valid userId
    if (userId) {
      const fetchHistory = async () => {
        try {
          const response = await fetch('http://localhost:3001/history', {
            credentials: 'include' // Sends the user's cookie
          });
          if (!response.ok) throw new Error("Failed to fetch history");
          const data = await response.json();
          setHistory(data); // Store the list of chats in our state
        } catch (error) {
          console.error("Error fetching history:", error);
          setHistory([]); // Clear history on error
        }
      };
      fetchHistory();
    }
  }, [userId]); // The dependency array ensures this runs when userId is first set

  const handleMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const newWidth = e.clientX;
    if (newWidth > 240 && newWidth < 500) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : width }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="bg-gray-800 text-white flex flex-col h-full relative shrink-0"
    >
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-blue-600 p-1 rounded-full z-20 text-white">
        {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>

      <div className="p-4 flex-grow overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <button onClick={onNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center mb-6 transition-colors">
          <Plus size={20} className={!isCollapsed ? "mr-2" : ""} />
          {!isCollapsed && 'New Chat'}
        </button>

        <h2 className={`text-lg font-semibold mb-2 px-2 ${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed ? 'History' : '...'}
        </h2>
        
        {/* --- DYNAMIC HISTORY LIST --- */}
        <ul className="space-y-1">
          {history.map((chat) => (
            <li
              key={chat.chatId}
              // Call the function from App.jsx with the specific chatId
              onClick={() => onChatSelect(chat.chatId)}
              className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                // Highlight the currently active chat
                currentChatId === chat.chatId
                  ? 'bg-blue-600/50' 
                  : 'hover:bg-gray-700'
              }`}
            >
              <MessageSquare size={20} className="shrink-0" />
              {!isCollapsed && (
                <span className="ml-3 truncate text-sm">
                  {/* Format the date for display. You can use a library like date-fns for more advanced formatting */}
                  Chat from {new Date(chat.createdAt).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <User size={30} className="rounded-full bg-gray-600 p-1 shrink-0" />
          {!isCollapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="font-semibold truncate">Recruiter</p>
              <p className="text-xs text-gray-400 truncate">
                {userId || 'guest-id-loading...'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
         <div onMouseDown={handleMouseDown} className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-gray-600 opacity-0 hover:opacity-100 transition-opacity z-10"/>
      )}
    </motion.div>
  );
};

export default LeftSidebar;