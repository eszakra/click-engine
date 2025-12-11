import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Download, Maximize2, Copy, Check, X, Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import AccessRestricted from '../ui/AccessRestricted';
import { getOptimizedImageUrl, getOriginalImageUrl } from '../../utils/imageOptimizer';

export interface Project {
    id: string;
    imageUrl: string;
    prompt: string;
    author: string;
    date: string;
    model: string;
    time: string;
    authorAvatar?: string;
}

interface ProjectsProps {
    projects: Project[];
    currentUser: string;
    onOpenAuth?: () => void;
    onEditImage?: (imageUrl: string) => void;
}

const ITEMS_PER_PAGE = 60; // Divisible by 2, 3, 4, 5 for perfect grids

const Projects: React.FC<ProjectsProps> = ({ projects, currentUser, onOpenAuth, onEditImage }) => {
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const [selectedImage, setSelectedImage] = useState<Project | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, projects.length]);

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // Auth Protection
    if (!currentUser) {
        return <AccessRestricted onSignIn={onOpenAuth} />;
    }

    const filteredProjects = filter === 'all'
        ? projects
        : projects.filter(p => p.author === currentUser);

    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentProjects = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // ... (handlers remain the same) ...
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

    // Pagination Logic for "Google-like" range
    const getPageNumbers = () => {
        const delta = 2; // Number of pages to show before and after current
        const range = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) range.unshift('...');
        if (currentPage + delta < totalPages - 1) range.push('...');

        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);

        return range;
    };

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col px-4 md:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">
                        The <span className="text-[#E91E63]">Gallery</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Explore the team's creations.</p>
                </div>

                <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'all' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('mine')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === 'mine' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Mine
                    </button>
                </div>
            </div>

            <div className="flex-grow">
                {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center h-full">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-white/20">
                            <Wand2 size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No masterpieces yet</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">
                            {filter === 'mine' ? "Your portfolio is empty. Time to create something." : "The gallery is waiting for its first creation."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Rounded Grid Container */}
                        <div className="rounded-3xl overflow-hidden border border-white/5 bg-[#050505] shadow-2xl">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                                {[
                                    ...currentProjects,
                                    ...Array(Math.max(0, ITEMS_PER_PAGE - currentProjects.length)).fill({
                                        id: 'placeholder',
                                        isPlaceholder: true,
                                        prompt: 'Future creation slot',
                                        author: 'System'
                                    })
                                ].map((project, index) => (
                                    <div
                                        key={project.id === 'placeholder' ? `placeholder-${index}` : project.id}
                                        className={`aspect-[4/3] relative overflow-hidden group bg-[#0A0A0A] ${project.isPlaceholder ? 'cursor-default' : 'cursor-pointer'}`}
                                        onClick={() => !project.isPlaceholder && setSelectedImage(project)}
                                    >
                                        {project.isPlaceholder ? (
                                            /* Skeleton / "Transparent" Placeholder */
                                            <div className="w-full h-full bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                                                <div className="w-full h-full bg-gradient-to-br from-transparent via-white/[0.02] to-transparent bg-[200%_auto] animate-pulse"></div>
                                            </div>
                                        ) : (
                                            <img
                                                src={getOptimizedImageUrl(project.imageUrl, 800, 90)}
                                                alt={project.prompt}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                loading={index < 10 ? "eager" : "lazy"}
                                            />
                                        )}

                                        {/* Minimal Overlay - Always visible Author (Hide on placeholder) */}
                                        {!project.isPlaceholder && (
                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 flex items-end justify-between opacity-100 transition-opacity">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-[#E91E63] flex items-center justify-center text-[8px] font-bold text-white overflow-hidden ring-1 ring-white/20">
                                                        {project.authorAvatar ? (
                                                            <img src={project.authorAvatar} alt={project.author} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{project.author?.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-medium text-white/90 drop-shadow-md">{project.author}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pagination - Numbered Style with Magenta */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center py-12 select-none">
                                <div className="flex items-center gap-2 p-2 bg-[#0A0A0A] border border-white/5 rounded-full shadow-2xl">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white disabled:opacity-20 transition-all font-medium"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <div className="flex items-center gap-1 px-2">
                                        {getPageNumbers().map((page, index) => (
                                            <React.Fragment key={index}>
                                                {page === '...' ? (
                                                    <span className="text-gray-600 px-1 text-xs">...</span>
                                                ) : (
                                                    <button
                                                        onClick={() => setCurrentPage(Number(page))}
                                                        className={`
                                                            w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-300
                                                            ${currentPage === page
                                                                ? 'bg-[#E91E63] text-white shadow-lg shadow-pink-500/20 scale-110'
                                                                : 'text-gray-500 hover:text-white hover:bg-white/5'}
                                                        `}
                                                    >
                                                        {page}
                                                    </button>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white disabled:opacity-20 transition-all font-medium"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Apple-style Split Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="p-2 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col md:flex-row gap-6 lg:gap-12" onClick={(e) => e.stopPropagation()}>

                            {/* Left: Image Area */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex items-center justify-center relative bg-[#050505] rounded-2xl overflow-hidden shadow-2xl border border-white/5"
                            >
                                <img
                                    src={getOptimizedImageUrl(selectedImage.imageUrl, 1600, 100)}
                                    alt={selectedImage.prompt}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </motion.div>

                            {/* Right: Sidebar Info */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="w-full md:w-[320px] lg:w-[380px] flex flex-col shrink-0 h-full overflow-y-auto custom-scrollbar"
                            >
                                <div className="space-y-6">
                                    {/* Author Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#E91E63] flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-2 ring-white/10">
                                            {selectedImage.authorAvatar ? (
                                                <img src={selectedImage.authorAvatar} alt={selectedImage.author} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{selectedImage.author.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">{selectedImage.author}</h3>
                                            <p className="text-xs text-green-400 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                Author
                                            </p>
                                        </div>
                                    </div>

                                    {/* Prompt Card */}
                                    <div className="bg-[#111] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prompt</span>
                                            <button
                                                onClick={() => handleCopyPrompt(selectedImage.prompt, selectedImage.id)}
                                                className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                                            >
                                                {copiedId === selectedImage.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                                {copiedId === selectedImage.id ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed font-light">
                                            {selectedImage.prompt}
                                        </p>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="bg-[#111] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-500" />
                                                <span className="text-xs text-gray-400">Created</span>
                                            </div>
                                            <span className="text-xs text-white font-medium">{selectedImage.date} • {selectedImage.time}</span>
                                        </div>
                                        <div className="bg-[#111] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Wand2 size={14} className="text-gray-500" />
                                                <span className="text-xs text-gray-400">Model</span>
                                            </div>
                                            <span className="text-xs text-white font-medium">{selectedImage.model}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleDownload(getOriginalImageUrl(selectedImage.imageUrl), selectedImage.prompt)}
                                            className="flex items-center justify-center gap-2 p-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                        {onEditImage && (
                                            <button
                                                onClick={() => onEditImage && onEditImage(getOriginalImageUrl(selectedImage.imageUrl))}
                                                className="flex items-center justify-center gap-2 p-3 bg-[#1A1A1A] text-white border border-white/10 rounded-xl text-xs font-bold hover:bg-[#222] transition-colors"
                                            >
                                                <Wand2 size={14} />
                                                Remix / Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Projects;
