// src/components/ui/PlaceholdersAndVanishInput.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils"; // Make sure this path is correct

export const PlaceholdersAndVanishInput = ({
  placeholders,
  onChange,
  onSubmit,
}) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // --- THIS IS THE FIX ---
  // This state is ESSENTIAL for the input field to be interactive.
  const [value, setValue] = useState("");

  // This function updates the internal state so you can see what you type.
  const handleChange = (e) => {
    setValue(e.target.value);
    // This calls the function passed from the parent (ChatPanel) to update its state.
    onChange && onChange(e);
  };
  // --- END OF FIX ---

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit(e);
    setValue(""); // Clear the input visually after submitting
  };

  return (
    <form
      className={cn(
        "w-full relative max-w-xl mx-auto bg-white dark:bg-zinc-800 h-12 rounded-full overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200",
        value && "bg-gray-50"
      )}
      onSubmit={handleSubmit}
    >
      <div className="h-full relative z-50">
        <AnimatePresence>
          {!value && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full absolute"
            >
              <span className="dark:text-zinc-500 text-zinc-500 text-sm px-4 h-full flex items-center">
                {placeholders[currentPlaceholder]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input
        // The two most important props for making the input work:
        onChange={handleChange}
        value={value}
        type="text"
        className="w-full relative z-50 h-full bg-transparent text-black dark:text-white caret-blue-500 pl-4"
      />
    </form>
  );
};