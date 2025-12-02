import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'glass' | 'glow';
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
    const baseStyles = "relative font-medium transition-all duration-500 flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed";

    // Specific shape styles based on variant
    const shapeStyles = variant === 'glow' ? 'rounded-full px-7 py-3' : 'rounded-xl px-6 py-3';

    const variants = {
        primary: "bg-gradient-brand text-white shadow-[0_4px_20px_rgba(255,0,85,0.3)] hover:shadow-[0_4px_25px_rgba(255,0,85,0.5)] border border-white/10 text-sm",
        secondary: "bg-surface border border-white/10 text-white hover:bg-white/5 hover:border-white/20 text-sm",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 text-sm",
        glow: `
            bg-gradient-to-b from-[#FF2E7E] to-[#FF0055] text-white text-sm font-bold
            border-t border-white/50 border-b border-[#990033]/30
            shadow-[0_10px_30px_-10px_rgba(255,0,85,0.6),0_4px_12px_-4px_rgba(255,46,126,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]
            hover:shadow-[0_20px_40px_-12px_rgba(255,0,85,0.7),0_8px_16px_-6px_rgba(255,0,85,0.2),inset_0_1px_0_rgba(255,255,255,0.5)]
            active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)]
        `
    };

    return (
        <motion.button
            whileHover={variant === 'glow' ? { scale: 1.03 } : { scale: 1.02 }}
            whileTap={variant === 'glow' ? { scale: 0.95 } : { scale: 0.98 }}
            className={`${baseStyles} ${shapeStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {/* Shimmer/Shine Effects */}
            {variant === 'primary' && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            )}

            {variant === 'glow' && (
                <>
                    {/* Top Shine */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm transform translate-x-[-100%] group-hover:translate-x-0" />

                    {/* Moving Shine Animation */}
                    <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                </>
            )}

            <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
                {children}
            </span>
        </motion.button>
    );
};

export default PremiumButton;
