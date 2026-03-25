import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ clockwise = true }) => {
  const rotateValues = clockwise ? [0, 180, 360] : [0, -180, -360];
  const borderClass = clockwise ? 'border-[#FF8C00]' : 'border-[#0080C8]';
  const innerBgClass = clockwise ? 'bg-[#0080C8]' : 'bg-[#FF8C00]';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: rotateValues,
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: Infinity,
        }}
        className={`w-16 h-16 rounded-full border-4 ${borderClass} border-t-transparent flex items-center justify-center`}
      >
        <div className={`w-8 h-8 ${innerBgClass} rounded-full`} />
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;
