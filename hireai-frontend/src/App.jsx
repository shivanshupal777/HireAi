import { useState ,useEffect } from 'react'; // Import useState
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import ChatPanel from './components/ChatPanel';
import RightSidebar from './components/RightSidebar';

function App() {
  // 1. Manage the messages state here
  const [messages, setMessages] = useState([]);

  const [chatId, setChatId] = useState(null);
   const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/session', {
            method: 'GET',
            credentials: 'include', // VERY IMPORTANT: Sends the user's cookie
        });

        if (!response.ok) throw new Error("Failed to fetch session");

        const data = await response.json();

        // If the session has a history, populate our state
        if (data && data.messages && data.messages.length > 0) {
          setUserId(data.userId);
          setChatId(data.chatId);
          // The messages from the DB have a different structure, so we map them
          const formattedMessages = data.messages.map(msg => ({
              text: msg.content,
              sender: msg.sender
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Could not restore session:", error);
      } finally {
        // Whether it succeeds or fails, we're done loading
        setIsLoading(false);
      }
    };

     loadSession();
  }, []); // The empty array ensures this runs only once

  // 2. Create the function that starts a new chat
  const handleNewChat = () => {
    setMessages([]); 
    setChatId(null); // Simply clear the chat ID
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 font-sans">
      <Navbar />
      <div className="flex flex-grow overflow-hidden">
        {/* 3. Pass the function to the LeftSidebar */}
        <LeftSidebar onNewChat={handleNewChat} userId={userId}/>

        {/* 4. Pass the state and the setter function to the ChatPanel */}
        <ChatPanel messages={messages} 
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