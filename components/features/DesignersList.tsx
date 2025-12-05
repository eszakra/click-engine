import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DesignersService, Designer } from '../../services/designers';
import UserProfileModal from './UserProfileModal';
import { Project } from '../../services/projects';

interface DesignersListProps {
    projects?: Project[];
    currentUser?: { name: string; avatar: string };
    onUpdateProfile?: (name: string, avatar: string) => Promise<void>;
    onEditImage?: (imageUrl: string) => void;
}

const DesignersList: React.FC<DesignersListProps> = ({ projects = [], currentUser, onUpdateProfile, onEditImage }) => {
    const [designers, setDesigners] = useState<Designer[]>([]);
    const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);

    const loadDesigners = async () => {
        const data = await DesignersService.getAll();
        setDesigners(data);
    };

    useEffect(() => {
        loadDesigners();
        const interval = setInterval(loadDesigners, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-display font-semibold text-white mb-3 tracking-tight">
                    The <span className="text-transparent bg-clip-text bg-gradient-brand">Team</span>
                </h1>
                <p className="text-gray-400 text-base max-w-xl mx-auto font-medium">
                    Creative minds behind the magic.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {designers.map((designer) => (
                    <motion.div
                        key={designer.id}
                        layoutId={`designer-${designer.id}`}
                        onClick={() => setSelectedDesigner(designer)}
                        className="cursor-pointer group relative"
                    >
                        <div className="h-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-xl backdrop-blur-sm">

                            {/* Avatar */}
                            <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-brand/30 transition-colors">
                                    <img
                                        src={designer.avatar}
                                        alt={designer.name}
                                        className="w-full h-full rounded-full object-cover bg-gray-800"
                                    />
                                </div>
                                {/* Status Dot */}
                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2px] border-[#0A0A0A] ${designer.status === 'online' ? 'bg-green-500' :
                                        designer.status === 'generating' ? 'bg-brand animate-pulse' : 'bg-gray-600'
                                    }`} />
                            </div>

                            {/* Info */}
                            <h3 className="text-sm font-semibold text-white mb-0.5 group-hover:text-brand transition-colors tracking-wide">{designer.name}</h3>
                            <p className="text-[11px] text-gray-500 font-medium mb-3">
                                {designer.status === 'generating' ? 'Generating...' :
                                    designer.status === 'online' ? 'Online' :
                                        `Active ${designer.lastActive}`}
                            </p>

                            {/* Mini Stats Badge */}
                            <div className="mt-auto bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                <span className="text-[10px] font-semibold text-gray-400 group-hover:text-white transition-colors">
                                    {projects.filter(p => p.author === designer.name).length} generations
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {selectedDesigner && (
                    <UserProfileModal
                        designer={selectedDesigner}
                        projects={projects}
                        currentUser={currentUser}
                        onClose={() => setSelectedDesigner(null)}
                        onUpdateProfile={onUpdateProfile}
                        onEditImage={onEditImage}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DesignersList;
