import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Edit2, Check, Download, Copy, Maximize2, Wand2 } from 'lucide-react';
import { Project } from '../../services/projects';
import { Designer } from '../../services/designers';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

interface UserProfileModalProps {
    designer: Designer;
    projects: Project[];
    currentUser?: { name: string; avatar: string };
    onClose: () => void;
    onUpdateProfile?: (name: string, avatar: string) => Promise<void>;
    onEditImage?: (imageUrl: string) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
    designer,
    projects,
    currentUser,
    onClose,
    onUpdateProfile,
    onEditImage
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(designer.name);
    const [isSaving, setIsSaving] = useState(false);
    const [viewingImage, setViewingImage] = useState<Project | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter projects for this designer
    const userProjects = projects.filter(p => p.author === designer.name);
    const totalGenerations = userProjects.length;
    const isCurrentUser = currentUser?.name === designer.name;

    const handleSave = async () => {
        if (!onUpdateProfile || !editedName.trim()) return;

        setIsSaving(true);
        try {
            await onUpdateProfile(editedName, designer.avatar);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header / Banner */}
                <div className="h-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-brand opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]" />
                    {/* Abstract shapes for visual interest */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/20 rounded-full blur-3xl" />
                    <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors backdrop-blur-md border border-white/5 z-10"
                >
                    <X size={20} />
                </button>

                <div className="px-8 pb-8 -mt-16 relative">
                    {/* Profile Info */}
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-10">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full p-1.5 bg-[#0A0A0A] relative z-10">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#0A0A0A] relative">
                                    <img
                                        src={getOptimizedImageUrl(designer.avatar, 200, 90, 'webp')}
                                        alt={designer.name}
                                        className="w-full h-full object-cover bg-gray-800"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full bg-gray-800 flex items-center justify-center text-white font-bold text-4xl">${designer.name.charAt(0)}</div>`;
                                        }}
                                    />
                                </div>
                                {designer.status === 'online' && (
                                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-[#0A0A0A] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" title="Online" />
                                )}
                            </div>
                            {isCurrentUser && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                    <span className="bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-md border border-white/10">
                                        Change Avatar
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 mb-2">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-3xl font-bold text-white focus:outline-none focus:border-brand w-full md:w-auto"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="p-2 bg-brand hover:bg-brand-light rounded-lg text-white transition-colors"
                                    >
                                        {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={20} />}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-bold text-white tracking-tight">{designer.name}</h2>
                                    {isCurrentUser && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            title="Edit Profile"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </div>
                            )}
                            <p className="text-gray-400 flex items-center gap-2 mt-2 font-medium">
                                <span className={`w-2 h-2 rounded-full ${designer.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
                                {designer.status === 'online' ? 'Online Now' : `Last active ${designer.lastActive}`}
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="flex gap-3">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[120px] backdrop-blur-sm">
                                <div className="text-3xl font-bold text-white mb-1">{totalGenerations}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Generations</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Section */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                            <ImageIcon size={20} className="text-brand" />
                            Recent Masterpieces
                        </h3>

                        {userProjects.length > 0 ? (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                                {userProjects.slice(0, 8).map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => setViewingImage(project)}
                                        className="aspect-square rounded-xl overflow-hidden border border-white/10 relative group cursor-pointer bg-gray-900 shadow-lg"
                                    >
                                        <img
                                            src={getOptimizedImageUrl(project.imageUrl, 400)}
                                            alt={project.prompt}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <Maximize2 className="text-white opacity-100 drop-shadow-lg" size={24} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ImageIcon size={24} className="text-gray-600" />
                                </div>
                                <p className="text-gray-500 font-medium">No masterpieces created yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Image Lightbox */}
            <AnimatePresence>
                {viewingImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
                        onClick={() => setViewingImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative max-w-7xl w-full h-full flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={getOptimizedImageUrl(viewingImage.imageUrl, 1200)}
                                alt={viewingImage.prompt}
                                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl border border-white/10"
                            />

                            <div className="mt-8 flex items-center gap-3 bg-[#0A0A0A] px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                                <span className="text-white/60 text-sm font-medium mr-4 border-r border-white/10 pr-4 uppercase tracking-wider text-xs">{viewingImage.model}</span>

                                {onEditImage && (
                                    <button
                                        onClick={() => {
                                            onEditImage(viewingImage.imageUrl);
                                            setViewingImage(null);
                                            onClose();
                                        }}
                                        className="flex items-center gap-2 text-white hover:text-brand transition-colors text-sm font-bold px-2"
                                    >
                                        <Wand2 size={16} /> Edit
                                    </button>
                                )}

                                <div className="w-px h-4 bg-white/10 mx-1" />

                                <button
                                    onClick={() => handleDownload(viewingImage.imageUrl, viewingImage.prompt)}
                                    className="flex items-center gap-2 text-white hover:text-brand transition-colors text-sm font-medium px-2"
                                >
                                    <Download size={16} /> Download
                                </button>

                                <div className="w-px h-4 bg-white/10 mx-1" />

                                <button
                                    onClick={() => handleCopyPrompt(viewingImage.prompt, viewingImage.id)}
                                    className="flex items-center gap-2 text-white hover:text-brand transition-colors text-sm font-medium px-2"
                                >
                                    {copiedId === viewingImage.id ? <Check size={16} /> : <Copy size={16} />} Copy Prompt
                                </button>
                            </div>

                            <div className="mt-6 max-w-2xl text-center">
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">{viewingImage.prompt}</p>
                            </div>

                            <button
                                onClick={() => setViewingImage(null)}
                                className="absolute top-4 right-4 p-3 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md border border-white/5"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserProfileModal;
