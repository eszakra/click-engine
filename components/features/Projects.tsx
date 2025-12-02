import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Download, Maximize2, Copy, Check, X } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import AccessRestricted from '../ui/AccessRestricted';

export interface Project {
    id: string;
    imageUrl: string;
    prompt: string;
    author: string;
    date: string;
    model: string;
    authorAvatar?: string;
}

interface ProjectsProps {
    projects: Project[];
    currentUser: string;
    onOpenAuth?: () => void;
}

const Projects: React.FC<ProjectsProps> = ({ projects, currentUser, onOpenAuth }) => {
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const [selectedImage, setSelectedImage] = useState<Project | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Auth Protection
    if (!currentUser) {
        return <AccessRestricted onSignIn={onOpenAuth} />;
    }

    const filteredProjects = filter === 'all'
        ? projects
        : projects.filter(p => p.author === currentUser);

    const handleDownload = async (imageUrl: string, prompt: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(imageUrl, '_blank');
        }
    };

    const handleCopyPrompt = (prompt: string, id: string) => {
        navigator.clipboard.writeText(prompt);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2">
                        Project <span className="text-transparent bg-clip-text bg-gradient-brand">Gallery</span>
                    </h1>
                    <p className="text-gray-400">Explore creations from the team.</p>
                </div>

                <div className="flex gap-2 bg-surface-glass border border-glass-border p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        All Projects
                    </button>
                    <button
                        onClick={() => setFilter('mine')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'mine' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        My Creations
                    </button>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <User size={32} className="text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {filter === 'mine' ? "You haven't generated any images yet." : "Start generating images to populate your team's gallery."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.map((project) => (
                        <GlassCard key={project.id} className="group relative overflow-hidden" noPadding>
                            {/* Image */}
                            <div className="aspect-[4/3] bg-gray-900 relative overflow-hidden cursor-pointer" onClick={() => setSelectedImage(project)}>
                                {project.imageUrl ? (
                                    <img
                                        src={project.imageUrl}
                                        alt={project.prompt}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                        <span className="text-xs text-gray-600">Generating...</span>
                                    </div>
                                )}

                                {/* Fallback for broken images */}
                                <div className="hidden absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center pointer-events-none">
                                    <span className="text-xs text-gray-500">Image not available</span>
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                                    <div className="flex items-center justify-between pointer-events-auto">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(project.imageUrl, project.prompt); }}
                                                className="p-2 rounded-full bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-md transition-all duration-200 hover:scale-105"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCopyPrompt(project.prompt, project.id); }}
                                                className="p-2 rounded-full bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-md transition-all duration-200 hover:scale-105"
                                                title="Copy Prompt"
                                            >
                                                {copiedId === project.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedImage(project); }}
                                            className="p-2 rounded-full bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-md transition-all duration-200 hover:scale-105"
                                            title="Expand"
                                        >
                                            <Maximize2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <p className="text-sm text-white font-medium line-clamp-1 mb-3" title={project.prompt}>{project.prompt}</p>

                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-[8px] font-bold text-white overflow-hidden border border-white/10">
                                            {project.authorAvatar ? (
                                                <img src={project.authorAvatar} alt={project.author} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{project.author.charAt(0)}</span>
                                            )}
                                        </div>
                                        <span>{project.author}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={10} />
                                        <span>{project.date}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500">{project.model}</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-7xl w-full max-h-[90vh] flex flex-col items-center overflow-y-auto custom-scrollbar p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage.imageUrl}
                                alt={selectedImage.prompt}
                                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl border border-white/10 shrink-0"
                            />

                            <div className="mt-6 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shrink-0">
                                <span className="text-white/80 text-sm font-medium mr-4 border-r border-white/10 pr-4">{selectedImage.model}</span>
                                <button
                                    onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.prompt)}
                                    className="flex items-center gap-2 text-white hover:text-brand transition-colors text-sm font-medium"
                                >
                                    <Download size={16} /> Download
                                </button>
                                <button
                                    onClick={() => handleCopyPrompt(selectedImage.prompt, selectedImage.id)}
                                    className="flex items-center gap-2 text-white hover:text-brand transition-colors text-sm font-medium"
                                >
                                    {copiedId === selectedImage.id ? <Check size={16} /> : <Copy size={16} />} Copy Prompt
                                </button>
                            </div>

                            {/* Full Prompt Display */}
                            <div className="mt-4 max-w-2xl text-center shrink-0 pb-4">
                                <p className="text-gray-400 text-sm">{selectedImage.prompt}</p>
                            </div>

                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors bg-black/50 rounded-full backdrop-blur-md z-50"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Projects;
