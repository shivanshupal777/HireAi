import { useState, useEffect } from 'react'; // <-- Import the necessary hooks
import AnimatedLogo from './AnimatedLogo';

const Navbar = () => {
  // 1. Create a state variable that will act as our changing key.
  const [logoKey, setLogoKey] = useState(0);

  // 2. Use the useEffect hook to set up a recurring timer.
  useEffect(() => {
    // 5 minutes in milliseconds (5 * 60 seconds * 1000 milliseconds)
    const fiveMinutesInMs = 300000;

    const interval = setInterval(() => {
      // Every 5 minutes, update the key. This can be as simple as incrementing a number.
      // The new value forces React to re-render the component associated with the key.
      setLogoKey(prevKey => prevKey + 1);
    }, fiveMinutesInMs);

    // 3. IMPORTANT: Clean up the interval when the component unmounts.
    // This prevents memory leaks and errors if you navigate away from the page.
    return () => {
      clearInterval(interval);
    };
  }, []); // The empty dependency array [] ensures this effect runs only ONCE when the component first mounts.

  return (
    <nav className="bg-gray-900 text-white flex items-center justify-center h-16 shadow-lg relative shrink-0">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {/* 4. Pass the logoKey state as the 'key' prop to the AnimatedLogo. */}
            <AnimatedLogo key={logoKey} />
        </div>
      <h1 className="text-2xl font-bold tracking-wider">HireAI</h1>
    </nav>
  );
};

export default Navbar;