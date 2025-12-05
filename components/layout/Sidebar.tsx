import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Cpu, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface SidebarProps {
    selectedModel: string;
    onSelectModel: (model: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedModel, onSelectModel }) => {
    const [isOpen, setIsOpen] = useState(false);

    const models = [
        { name: 'Nano Banana Pro', desc: 'Native 4K image generation', time: '30s', cost: '119 units', active: true, tags: ['2 images'], supportedAspectRatios: ['16:9', '4:3', '1:1'], supportedResolutions: ['1k', '2k', '4k'] },
        { name: 'Nano Banana', desc: 'Smart model, best for image editing', time: '10s', cost: '32 units', active: false, tags: ['2 images'], supportedAspectRatios: ['1:1'], supportedResolutions: ['1k'] },
        { name: 'Grok 2', desc: 'Smartest model, best for complex prompts', time: '10s', cost: '1 unit', active: false, tags: ['High Quality', 'Smart'], supportedAspectRatios: ['16:9', '4:3', '1:1'], supportedResolutions: ['1k'] },
        { name: 'FLUX 2.0', desc: 'Next-gen image synthesis', time: '15s', cost: '2 units', active: false, tags: ['Ultra Quality', 'Inpainting'], isNew: true, supportedAspectRatios: ['16:9', '4:3', '1:1'], supportedResolutions: ['1k', '2k'] },
        { name: 'FLUX 1.0', desc: 'High fidelity generation', time: '12s', cost: '1 unit', active: false, tags: ['Balanced', 'Inpainting'], supportedAspectRatios: ['16:9', '4:3', '1:1'], supportedResolutions: ['1k'] },
    ];

    return (
        <motion.div
            className="fixed left-6 bottom-6 z-40 flex flex-col justify-end"
            initial={false}
        >
            <AnimatePresence mode="wait">
                {!isOpen ? (
                    <motion.button
                        key="pill"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-xl hover:bg-[#222] transition-colors group"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Model</span>
                            <span className="text-sm font-bold text-white group-hover:text-brand transition-colors">{selectedModel}</span>
                        </div>
                        <ChevronUp size={16} className="text-gray-500" />
                    </motion.button>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-80 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        {/* Header */}
                        <div
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                        >
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Model</span>
                            <ChevronDown size={14} className="text-gray-500" />
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 flex-1">
                            {models.map((model, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        onSelectModel(model.name);
                                        setIsOpen(false);
                                    }}
                                    className={`
                            group relative p-3 rounded-xl text-left transition-all duration-200 border w-full
                            ${model.name === selectedModel
                                            ? 'bg-white/5 border-brand/50 shadow-[0_0_15px_rgba(255,0,85,0.1)]'
                                            : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}
                        `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold text-sm ${model.name === selectedModel ? 'text-white' : 'text-gray-300'}`}>
                                                {model.name}
                                            </span>
                                            {model.isNew && (
                                                <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">New</span>
                                            )}
                                        </div>
                                        {model.name === selectedModel && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_#FF0055]"></span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium mt-2">
                                        <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                                            <Clock size={10} /> {model.time}
                                        </span>
                                        <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                                            <Cpu size={10} /> {model.cost}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-white/5 bg-black/20">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Zap size={12} className="text-yellow-400" />
                                    {(() => {
                                        const userJson = localStorage.getItem('click_tools_current_user');
                                        const user = userJson ? JSON.parse(userJson) : null;
                                        return user?.credits ? user.credits.toLocaleString() : '0';
                                    })()} Credits
                                </span>
                                <button className="text-brand hover:text-brand-light transition-colors font-medium">Upgrade</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Sidebar;
