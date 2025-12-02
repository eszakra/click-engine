import React from 'react';
import { Image, Folder, User, LogIn, Users, BarChart2, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopNavProps {
    currentView: 'generate' | 'edit' | 'projects' | 'team' | 'usage';
    onNavigate: (view: 'generate' | 'edit' | 'projects' | 'team' | 'usage') => void;
    currentUser: { name: string; avatar: string } | null;
    onOpenAuth: () => void;
    onOpenSettings: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ currentView, onNavigate, currentUser, onOpenAuth, onOpenSettings }) => {
    const navItems = [
        { icon: <Image size={18} />, label: 'Generate', id: 'generate', active: currentView === 'generate' },
        { icon: <Wand2 size={18} />, label: 'Edit', id: 'edit', active: currentView === 'edit' },
        { icon: <Folder size={18} />, label: 'Projects', id: 'projects', active: currentView === 'projects' },
        { icon: <Users size={18} />, label: 'Team', id: 'team', active: currentView === 'team' },
        { icon: <BarChart2 size={18} />, label: 'Usage', id: 'usage', active: currentView === 'usage' },
    ];

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-6 left-0 right-0 z-50 flex justify-center items-start pointer-events-none"
        >
            <div className="flex items-center gap-3 pointer-events-auto">
                {/* Main Nav Pill */}
                <div className="flex items-center p-1.5 glass-panel rounded-full shadow-2xl shadow-black/20 backdrop-blur-xl bg-[#050505]/80 border border-white/10">

                    {/* Logo Section */}
                    <div className="pl-4 pr-6 flex items-center gap-3 border-r border-white/10 mr-2">
                        <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,0,85,0.4)]">
                            <img
                                src="https://res.cloudinary.com/dx30xwfbj/image/upload/v1763703060/35536363463_q7rajl.png"
                                alt="Logo"
                                className="w-5 h-5 invert brightness-0"
                            />
                        </div>
                        {/* Horizontal Text Layout */}
                        <div className="flex items-center gap-1 leading-none hidden md:flex">
                            <span className="font-display font-bold text-sm text-white">Click-Engine</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-1">
                        {navItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => onNavigate(item.id as any)}
                                className={`
                    relative px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300
                    ${item.active
                                        ? 'text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-1.5 glass-panel rounded-full shadow-2xl shadow-black/20 backdrop-blur-xl bg-[#050505]/80 border border-white/10">
                    {currentUser ? (
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center gap-3 pr-5 pl-1.5 py-0.5 hover:bg-white/5 rounded-full transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-brand/50 transition-colors">
                                {currentUser.avatar ? (
                                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className="text-gray-400 group-hover:text-brand transition-colors" />
                                )}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-bold text-white leading-none">{currentUser.name}</span>
                                <span className="text-[10px] text-gray-500 leading-none mt-1">Online</span>
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand hover:bg-brand-light text-white text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,0,85,0.3)] hover:shadow-[0_0_25px_rgba(255,0,85,0.5)]"
                        >
                            <LogIn size={16} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default TopNav;
