import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'glass';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    icon,
    className = '',
    ...props
}) => {
    const baseStyles = "relative px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-brand text-white shadow-[0_4px_20px_rgba(255,0,85,0.3)] hover:shadow-[0_4px_25px_rgba(255,0,85,0.5)] border border-white/10",
        secondary: "bg-surface border border-white/10 text-white hover:bg-white/5 hover:border-white/20",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {/* Shimmer Effect */}
            {variant === 'primary' && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            )}

            <span className="relative z-10 flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
                {children}
            </span>
        </motion.button>
    );
};

export default PremiumButton;
