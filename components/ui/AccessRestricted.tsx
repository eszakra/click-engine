import React from 'react';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';

interface AccessRestrictedProps {
    variant?: 'default' | 'overlay';
    onSignIn?: () => void;
}

const AccessRestricted: React.FC<AccessRestrictedProps> = ({ variant = 'default', onSignIn }) => {
    // Mock sign in function if not provided
    const handleSignIn = () => {
        if (onSignIn) {
            onSignIn();
        } else {
            // Dispatch a custom event or use a global state manager to open auth modal
            // For now, we'll just log it, assuming the parent might handle it or we need a global store
            console.log('Open Auth Modal');
            // You might want to dispatch an event that your Layout listens to
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
        }
    };

    if (variant === 'overlay') {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-8 rounded-3xl bg-[#0A0A0A]/80 border border-white/10 shadow-2xl max-w-md mx-4"
                >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <Lock size={24} className="text-white/80" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">Team Access Only</h3>
                    <p className="text-gray-400 mb-8 text-sm">
                        Please sign in with your <span className="text-white font-medium">assigned team account</span> to access the generation tools and credits.
                    </p>
                    <button
                        onClick={handleSignIn}
                        className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        Sign In with Team Account
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 relative z-30 pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                {/* Liquid Glass Effect Background */}
                <div className="absolute inset-0 bg-brand/20 blur-[60px] rounded-full opacity-20 animate-pulse" />

                <div className="relative w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.05)] mx-auto group">
                    <div className="absolute inset-0 rounded-full border border-white/5 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700" />
                    <User size={32} className="text-white/80" />
                </div>

                <h3 className="text-3xl font-display font-bold text-white mb-3">Restricted Workspace</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                    This area is for authorized team members only. Please sign in with your <span className="text-white font-medium">assigned credentials</span>.
                </p>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Sign In Clicked');
                        handleSignIn();
                    }}
                    className="relative z-50 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
                >
                    Sign In with Team Account
                </button>
            </motion.div>
        </div>
    );
};

export default AccessRestricted;
