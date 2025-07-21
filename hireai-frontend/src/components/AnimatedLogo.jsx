import { motion } from 'framer-motion';

const AnimatedLogo = () => {
  return (
    <motion.svg
      width="36"
      height="36"
      viewBox="0 0 50 50"
      initial={{ opacity: 0, rotate: -180 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* "H" for HireAI */}
      <motion.path
        d="M 10 10 L 10 40"
        stroke="#3b82f6"
        strokeWidth="5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.path
        d="M 40 10 L 40 40"
        stroke="#3b82f6"
        strokeWidth="5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
       <motion.path
        d="M 10 25 L 40 25"
        stroke="#ffffff"
        strokeWidth="5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
      />
    </motion.svg>
  );
};

export default AnimatedLogo;