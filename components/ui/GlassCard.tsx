import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  noPadding?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  noPadding = false
}) => {
  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl
        bg-surface-glass backdrop-blur-xl
        border border-glass-border
        shadow-[0_8px_32px_rgba(0,0,0,0.2)]
        ${hoverEffect ? 'hover:border-glass-highlight hover:shadow-[0_8px_32px_rgba(255,0,85,0.1)] transition-all duration-300 group' : ''}
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Glossy Reflection Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
