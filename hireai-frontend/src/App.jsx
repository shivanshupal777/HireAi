import { useState } from 'react'; // Import useState
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import ChatPanel from './components/ChatPanel';
import RightSidebar from './components/RightSidebar';

function App() {
  // 1. Manage the messages state here
  const [messages, setMessages] = useState([]);

  // 2. Create the function that starts a new chat
  const handleNewChat = () => {
    setMessages([]); // Simply clear the messages array
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 font-sans">
      <Navbar />
      <div className="flex flex-grow overflow-hidden">
        {/* 3. Pass the function to the LeftSidebar */}
        <LeftSidebar onNewChat={handleNewChat} />

        {/* 4. Pass the state and the setter function to the ChatPanel */}
        <ChatPanel messages={messages} setMessages={setMessages} />
        
        <RightSidebar />
      </div>
    </div>
  );
}

export default App;