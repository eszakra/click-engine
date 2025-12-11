import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Sliders, Upload, Maximize2, X, Lock, Wand2, Download, Check, Copy } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import PremiumButton from '../ui/PremiumButton';
import PremiumLoader from '../ui/PremiumLoader';
import AccessRestricted from '../ui/AccessRestricted';
import { Project } from '../../services/projects';
import { getOptimizedImageUrl, getOriginalImageUrl } from '../../utils/imageOptimizer';

interface ImageGeneratorProps {
    onGenerate: (prompt: string, aspectRatio: string, resolution?: string) => Promise<Project | null>;
    isLoggedIn: boolean;
    onEditImage?: (imageUrl: string) => void;
    selectedModel: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onGenerate, isLoggedIn, onEditImage, selectedModel }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<Project[]>([]);
    const [imageCount, setImageCount] = useState(1);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [resolution, setResolution] = useState('1k');
    const [selectedImage, setSelectedImage] = useState<Project | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [safetyWarning, setSafetyWarning] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // Load user's history on mount
    React.useEffect(() => {
        if (isLoggedIn) {
            const loadHistory = async () => {
                try {
                    const userJson = localStorage.getItem('click_tools_current_user');
                    if (userJson) {
                        const user = JSON.parse(userJson);
                        const allProjects = await import('../../services/projects').then(m => m.ProjectsService.getAll());
                        const myProjects = allProjects.filter(p => p.author === user.name);
                        setGeneratedImages(myProjects);
                    }
                } catch (error) {
                    console.error("Failed to load history:", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            loadHistory();
        } else {
            setIsLoadingHistory(false);
        }
    }, [isLoggedIn]);

    const handleGenerate = async () => {
        if (!isLoggedIn) {
            onGenerate(prompt, aspectRatio, resolution);
            return;
        }

        if (!prompt.trim()) return;

        setIsGenerating(true);
        setSafetyWarning(false);
        try {
            const promises = Array.from({ length: imageCount }, () => onGenerate(prompt, aspectRatio, resolution));
            const results = await Promise.all(promises);

            const newProjects = results.filter((p): p is Project => p !== null);
            if (newProjects.length > 0) {
                setGeneratedImages(prev => [...newProjects, ...prev]);

                // Update local user credits if returned by backend (take the last one as it has the latest balance)
                const lastProject = newProjects[newProjects.length - 1];
                if (lastProject.credits !== undefined) {
                    const userJson = localStorage.getItem('click_tools_current_user');
                    if (userJson) {
                        const user = JSON.parse(userJson);
                        user.credits = lastProject.credits;
                        localStorage.setItem('click_tools_current_user', JSON.stringify(user));
                        // Force re-render of credits
                        window.dispatchEvent(new Event('storage'));
                    }
                }
            }
            setPrompt('');
        } catch (error: any) {
            console.error('Error generating image:', error);

            // Check for explicit safety violation
            const isExplicitSafety = error.message && (
                error.message.includes('SAFETY_VIOLATION') ||
                error.message.includes('safety') ||
                error.message.includes('blocked')
            );

            // Check for generic error on Nano Banana models (heuristic as per user request)
            // "If it didn't generate an image" -> likely safety block for these models
            const isNanoBanana = selectedModel.includes('Nano Banana');
            const isGenericEdgeError = error.message && (
                error.message.includes('FunctionsHttpError') ||
                error.message.includes('Edge Function returned') ||
                error.message.includes('non-2xx')
            );

            if (isExplicitSafety || (isNanoBanana && isGenericEdgeError)) {
                setSafetyWarning(true);
            }
        } finally {
            setIsGenerating(false);
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

    const getGridClass = () => {
        if (isLoadingHistory) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
        const totalItems = generatedImages.length + (isGenerating ? imageCount : 0);
        if (totalItems === 0) return 'grid-cols-1 max-w-4xl mx-auto'; // Should not happen if we handle empty state correctly
        if (totalItems === 1) return 'grid-cols-1 max-w-4xl mx-auto';
        if (totalItems === 2) return 'grid-cols-1 md:grid-cols-2';
        if (totalItems === 3) return 'grid-cols-1 md:grid-cols-3';
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    };

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto px-4 relative">
            {!isLoggedIn && <AccessRestricted variant="overlay" />}

            {/* Header Section */}
            <div className="text-center mb-8 mt-4">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight"
                >
                    Imagine <span className="text-[#E91E63]">Anything</span>
                </motion.h1>
            </div>

            {/* Safety Warning Toast */}
            <AnimatePresence>
                {safetyWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-24 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="relative overflow-hidden bg-[#0A0A0A]/90 backdrop-blur-2xl border border-red-500/20 px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(255,0,0,0.15)] flex items-center gap-4 pointer-events-auto mt-2 group">
                            {/* Liquid Background Effect */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-red-600/20 animate-pulse" style={{ backgroundSize: '200% 100%' }} />
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-500/10 to-transparent"
                                    animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    style={{ backgroundSize: '200% 200%' }}
                                />
                            </div>

                            <div className="relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-black border border-red-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
                                <Lock size={16} className="text-red-400 drop-shadow-[0_0_8px_rgba(255,50,50,0.5)]" />
                            </div>

                            <div className="relative z-10 flex flex-col">
                                <span className="text-sm font-bold text-white tracking-wide">Content Flagged</span>
                                <span className="text-[11px] text-red-200/60 font-medium">Safety guidelines blocked this request</span>
                            </div>

                            <div className="h-8 w-px bg-white/5 mx-2 relative z-10" />

                            <button
                                onClick={() => setSafetyWarning(false)}
                                className="relative z-10 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative z-20 mb-10 max-w-4xl mx-auto w-full"
            >
                <div className={`relative group rounded-3xl p-[1px] bg-white/10 shadow-2xl shadow-black/50 transition-all duration-500 ${safetyWarning ? 'shadow-[0_0_40px_rgba(255,0,0,0.15)]' : ''}`}>
                    <div className={`absolute inset-0 bg-[#E91E63]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl blur-xl ${safetyWarning ? 'opacity-0' : ''}`} />

                    {/* Red Liquid Glow for Warning */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-500/10 to-red-600/20 opacity-0 transition-opacity duration-500 rounded-3xl blur-xl ${safetyWarning ? 'opacity-100 animate-pulse' : ''}`} />

                    <div className="relative bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-3xl p-2 overflow-hidden">
                        <textarea
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                if (safetyWarning) setSafetyWarning(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                            placeholder={isLoggedIn ? "Describe your imagination... (e.g. A futuristic city with neon lights, cyberpunk style, 8k resolution)" : "Sign in to start creating..."}
                            className={`w-full bg-transparent text-white text-lg placeholder:text-gray-600 p-4 md:p-6 min-h-[100px] resize-none focus:outline-none transition-all ${!isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!isLoggedIn}
                        />

                        <div className="flex flex-col md:flex-row items-center justify-between px-4 pb-4 pt-2 gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
                                <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
                                    {['16:9', '4:3', '1:1'].map((ratio) => (
                                        <button
                                            key={ratio}
                                            onClick={() => setAspectRatio(ratio)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${aspectRatio === ratio
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                                }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>

                                {selectedModel === 'Nano Banana Pro' && (
                                    <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
                                        {['1k', '2k', '4k'].map((res) => (
                                            <button
                                                key={res}
                                                onClick={() => setResolution(res)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${resolution === res
                                                    ? 'bg-white/10 text-white shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                                    }`}
                                            >
                                                {res}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
                                    {[1, 2, 3, 4].map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => setImageCount(count)}
                                            className={`w-8 h-7 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${imageCount === count
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                                }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                <PremiumButton
                                    onClick={handleGenerate}
                                    disabled={isLoggedIn && !prompt.trim() || isGenerating}
                                    variant="glow"
                                    isLoading={isGenerating}
                                    icon={!isGenerating && <Wand2 size={16} />}
                                    className="w-full md:w-auto"
                                >
                                    {isLoggedIn ? 'Generate' : 'Sign In'}
                                </PremiumButton>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Results Area */}
            <div className="flex-1 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {(generatedImages.length > 0 || isGenerating || isLoadingHistory) ? (
                        <motion.div
                            key="image-grid"
                            className={`grid gap-3 ${getGridClass()} `}
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.02,
                                        when: "beforeChildren"
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        >
                            {/* Loading State - Skeleton + Spinner */}
                            {(isGenerating || isLoadingHistory) && Array.from({ length: isLoadingHistory ? 12 : imageCount }).map((_, i) => (
                                <motion.div
                                    key={`loading-${i}`}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.95 },
                                        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
                                    }}
                                    className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 relative flex items-center justify-center"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-[shimmer_1.5s_infinite]" />
                                    {isGenerating && <PremiumLoader size={32} />}
                                </motion.div>
                            ))}

                            {/* Existing Images */}
                            {generatedImages.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.95 },
                                        visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } }
                                    }}
                                    className="group relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg hover:shadow-2xl hover:border-white/20 transition-all duration-200"
                                >
                                    <img
                                        src={getOptimizedImageUrl(project.imageUrl, 800, 90)}
                                        alt={project.prompt}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                                        onClick={() => setSelectedImage(project)}
                                        loading="lazy"
                                    />

                                    {/* Model Badge (Left) */}
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-[10px] font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {project.model}
                                    </div>

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                                        <p className="text-white text-sm font-medium line-clamp-1 mb-3">{project.prompt}</p>
                                        <div className="flex items-center gap-2 pointer-events-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(getOriginalImageUrl(project.imageUrl), project.prompt); }}
                                                className="p-2 rounded-lg bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-md transition-all duration-200 border border-white/10 hover:border-white hover:scale-105"
                                                title="Download"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCopyPrompt(project.prompt, project.id); }}
                                                className="p-2 rounded-lg bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-md transition-all duration-200 border border-white/10 hover:border-white hover:scale-105"
                                                title="Copy Prompt"
                                            >
                                                {copiedId === project.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedImage(project); }}
                                                className="p-2 rounded-lg bg-white/10 hover:bg-white hover:text-black text-white backdrop-blur-md transition-all duration-200 ml-auto border border-white/10 hover:border-white hover:scale-105"
                                                title="Expand"
                                            >
                                                <Maximize2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

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
                                src={getOptimizedImageUrl(selectedImage.imageUrl, 1200)}
                                alt={selectedImage.prompt}
                                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl border border-white/10 shrink-0"
                            />

                            <div className="mt-6 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shrink-0">
                                <span className="text-white/80 text-sm font-medium mr-4 border-r border-white/10 pr-4">{selectedImage.model}</span>
                                <button
                                    onClick={() => handleDownload(getOriginalImageUrl(selectedImage.imageUrl), selectedImage.prompt)}
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
                                {onEditImage && (
                                    <button
                                        onClick={() => onEditImage && onEditImage(getOriginalImageUrl(selectedImage.imageUrl))}
                                        className="flex items-center gap-2 text-white hover:text-brand transition-colors text-sm font-medium pl-4 border-l border-white/10"
                                    >
                                        <Wand2 size={16} /> Edit
                                    </button>
                                )}
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
        </div >
    );
};

export default ImageGenerator;
