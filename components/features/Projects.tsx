import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Download, Share2, MoreHorizontal } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

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
}

const Projects: React.FC<ProjectsProps> = ({ projects, currentUser }) => {
    const [filter, setFilter] = React.useState<'all' | 'mine'>('all');

    const filteredProjects = filter === 'all'
        ? projects
        : projects.filter(p => p.author === currentUser);

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
                            <div className="aspect-[4/3] bg-gray-900 relative overflow-hidden">
                                {project.imageUrl ? (
                                    <img src={project.imageUrl} alt={project.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                        <span className="text-xs text-gray-600">Generating...</span>
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"><Download size={16} /></button>
                                            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"><Share2 size={16} /></button>
                                        </div>
                                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"><MoreHorizontal size={16} /></button>
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
        </div>
    );
};

export default Projects;
