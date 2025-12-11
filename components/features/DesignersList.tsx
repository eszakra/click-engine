import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DesignersService, Designer } from '../../services/designers';
import UserProfileModal from './UserProfileModal';
import { Project } from '../../services/projects';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { Wand2, Image as ImageIcon, Sparkles, User } from 'lucide-react';

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
        const interval = setInterval(loadDesigners, 30000); // Metadata refresh
        return () => clearInterval(interval);
    }, []);

    // Helper to get stats and latest art
    const getDesignerStats = (designerName: string) => {
        const userProjects = projects.filter(p => p.author === designerName);
        // Sort by id assuming newer ids are larger/newer, or if we had a timestamp. 
        // For now, reverse formatting usually puts new ones first in current logic, 
        // but let's assume index 0 of filtered list is newest if the parent list is ordered.

        // Actually, let's find the absolute latest based on order in 'projects' array (usually newest first).
        const latestProject = userProjects[0];
        const count = userProjects.length;

        return { latestProject, count };
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
            <div className="mb-12 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
                        The <span className="text-[#E91E63]">Team</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
                        Explore the visionary artists behind the masterpieces.
                    </p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {designers.map((designer, idx) => {
                    const stats = getDesignerStats(designer.name);
                    const hasArt = !!stats.latestProject;

                    return (
                        <motion.div
                            key={designer.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut", delay: idx * 0.05 }}
                            layoutId={`designer-${designer.id}`}
                            onClick={() => setSelectedDesigner(designer)}
                            className="group relative h-[320px] rounded-3xl cursor-pointer overflow-hidden bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-brand/5"
                        >
                            {/* Dynamic Background */}
                            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                                {hasArt ? (
                                    <>
                                        <img
                                            src={getOptimizedImageUrl(stats.latestProject?.imageUrl, 600)}
                                            alt="Art"
                                            className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity duration-500 blur-sm group-hover:blur-0"
                                            loading={idx < 4 ? "eager" : "lazy"}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                // Fallback could be handled by showing the gradient div below
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent group-hover:via-[#050505]/40 transition-all duration-500" />
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-10"
                                            style={{
                                                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                                                backgroundSize: '20px 20px'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Content Layer */}
                            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center z-10">

                                {/* Avatar - Floating centered initially, moves up or stays distinct */}
                                <motion.div
                                    className="mb-6 relative"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <div className="w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md shadow-2xl">
                                        <img
                                            src={getOptimizedImageUrl(designer.avatar, 200, 90, 'webp')}
                                            alt={designer.name}
                                            className="w-full h-full rounded-[14px] object-cover bg-[#1A1A1A]"
                                            loading={idx < 8 ? "eager" : "lazy"}
                                            onError={(e) => {
                                                // Fallback to initial
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center text-white font-bold text-2xl">${designer.name.charAt(0)}</div>`;
                                            }}
                                        />
                                    </div>

                                </motion.div>

                                {/* Text Info */}
                                <div className="text-center w-full transform transition-transform duration-300 group-hover:-translate-y-2">
                                    <h3 className="text-xl font-bold text-white mb-1 tracking-wide drop-shadow-lg">{designer.name}</h3>

                                    {/* Stats Row */}
                                    <div className="flex items-center justify-center w-full border-t border-white/5 pt-4 opacity-70 group-hover:opacity-100 transition-opacity delay-100">
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-bold text-white leading-none">{stats.count}</span>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Generations</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
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
