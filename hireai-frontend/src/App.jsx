// src/App.jsx

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import ChatPanel from './components/ChatPanel';
import RightSidebar from './components/RightSidebar';

function App() {
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // This is a helper function to format messages from the DB to what the UI expects
  const formatMessages = (dbMessages) => {
    return dbMessages.map(msg => ({
        text: msg.content,
        sender: msg.sender
    }));
  };

  // This effect runs only ONCE when the app first loads to get the LATEST session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/session', {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) throw new Error("Failed to fetch session");
        const data = await response.json();

        if (data && data.messages && data.messages.length > 0) {
          setUserId(data.userId);
          setChatId(data.chatId);
          setMessages(formatMessages(data.messages));
        } else if (data && data.userId) {
          // Set userId even if there are no chats, so history can be fetched
          setUserId(data.userId);
        }
      } catch (error) {
        console.error("Could not restore session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  // --- START: NEW FUNCTION TO LOAD A SPECIFIC CHAT ---
  // This function will be passed to the LeftSidebar and called when a history item is clicked.
  const loadSpecificChat = async (chatIdToLoad) => {
    // Don't do anything if the user clicks the chat that is already active
    if (chatIdToLoad === chatId) return; 
    
    setIsLoading(true); // Show the loading spinner
    try {
        const response = await fetch(`http://localhost:3001/chat/${chatIdToLoad}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) throw new Error("Failed to fetch specific chat");
        
        const dbMessages = await response.json();
        
        // Update the state with the data of the selected chat
        setChatId(chatIdToLoad);
        setMessages(formatMessages(dbMessages));

    } catch (error) {
        console.error("Could not load specific chat:", error);
        // Optionally, you could set an error message in the UI here
    } finally {
        setIsLoading(false); // Hide the loading spinner
    }
  };
  // --- END: NEW FUNCTION ---

  // This function clears the state to start a fresh chat
  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 font-sans">
      <Navbar />
      <div className="flex flex-grow overflow-hidden">
        <LeftSidebar 
            onNewChat={handleNewChat} 
            userId={userId} 
            onChatSelect={loadSpecificChat} // <-- Pass the new function as a prop
            currentChatId={chatId} // <-- Pass the current chatId to highlight the active item
        />
        <ChatPanel 
          messages={messages} 
          setMessages={setMessages}
          chatId={chatId}
          setChatId={setChatId}
          isLoading={isLoading}
        />
        <RightSidebar />
      </div>
    </div>
  );
}

export default App;