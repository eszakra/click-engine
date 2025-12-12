import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MousePointer2, Brush, Eraser, Image as ImageIcon,
    Move, Maximize, type LucideIcon, Undo, Redo,
    Download, Share2, Layers, Settings, Wand2,
    Plus, Minus, Square, Circle, Upload, X,
    Clock, Cpu, ChevronDown, ChevronUp, Zap, Copy, Check, Lock
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import PremiumLoader from '../ui/PremiumLoader';
import { ProjectsService } from '../../services/projects';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { EditorHistoryService, type EditorSession, type EditorVersion } from '../../services/editorHistory';
import { uploadBase64Image } from '../../services/supabase';

interface Tool {
    id: string;
    icon: LucideIcon;
    label: string;
}

interface Version {
    id: string;
    url: string;
    prompt: string;
    model: string;
    timestamp: number;
}

interface Session {
    id: string;
    originalUrl: string;
    versions: Version[];
    timestamp: number;
}

interface ImageEditorProps {
    initialImage?: string | null;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage }) => {
    const [selectedTool, setSelectedTool] = useState('select');
    const [zoom, setZoom] = useState(100);
    const [brushSize, setBrushSize] = useState(20);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('Nano Banana Pro');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [imageAspectRatio, setImageAspectRatio] = useState<string>('1:1');
    const [isDragging, setIsDragging] = useState(false);
    const [safetyWarning, setSafetyWarning] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Load sessions from Supabase
    const [sessions, setSessions] = useState<EditorSession[]>([]);

    useEffect(() => {
        const loadSessions = async () => {
            const data = await EditorHistoryService.getSessions();
            setSessions(data);
        };
        loadSessions();
    }, []);

    // Load initial image if provided
    useEffect(() => {
        if (initialImage) {
            startNewSession(initialImage);
        }
    }, [initialImage]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const models = [
        { name: 'Nano Banana Pro', desc: 'Native 4K image generation', time: '30s', cost: '119 units', active: true, tags: ['2 images'] },
        { name: 'Nano Banana', desc: 'Smart model, best for image editing', time: '10s', cost: '32 units', active: false, tags: ['2 images'] },
        { name: 'Grok 2', desc: 'Smartest model, best for complex prompts', time: '10s', cost: '1 unit', active: false, tags: ['High Quality', 'Smart'] },
        { name: 'FLUX 2.0', desc: 'Next-gen image synthesis', time: '15s', cost: '2 units', active: false, tags: ['Ultra Quality', 'Inpainting'], isNew: true },
        { name: 'FLUX 1.0', desc: 'High fidelity generation', time: '12s', cost: '1 unit', active: false, tags: ['Balanced', 'Inpainting'] },
    ];
    const promptOnlyModels = ['Nano Banana', 'Nano Banana Pro'];

    const tools: Tool[] = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'rectangle', icon: Square, label: 'Rectangle' },
        { id: 'brush', icon: Brush, label: 'Inpaint' },
        { id: 'eraser', icon: Eraser, label: 'Erase' },
        { id: 'move', icon: Move, label: 'Move' },
    ];

    const isPromptOnly = promptOnlyModels.includes(selectedModel);

    const calculateAspectRatio = (src: string) => {
        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            const ratios: Record<string, number> = {
                '16:9': 16 / 9,
                '4:3': 4 / 3,
                '1:1': 1,
                '3:4': 3 / 4,
                '9:16': 9 / 16
            };
            let closest = '1:1';
            let minDiff = Infinity;
            for (const [key, val] of Object.entries(ratios)) {
                const diff = Math.abs(ratio - val);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = key;
                }
            }
            setImageAspectRatio(closest);
        };
        img.src = src;
    };

    const startNewSession = (imageUrl: string) => {
        setUploadedImage(imageUrl);
        setGeneratedImage(null);
        setPrompt('');
        calculateAspectRatio(imageUrl);
        setCurrentSessionId(null); // No session yet, waiting for first edit
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                startNewSession(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                startNewSession(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        if (uploadedImage) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -10 : 10;
            setZoom(z => Math.min(500, Math.max(10, z + delta)));
        }
    };

    const handleDownload = async () => {
        const imageToDownload = generatedImage || uploadedImage;
        if (!imageToDownload) return;

        try {
            const response = await fetch(imageToDownload);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `edited_image_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            const link = document.createElement('a');
            link.href = imageToDownload;
            link.download = `edited_image_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleGenerate = async () => {
        if (!uploadedImage || !prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setSafetyWarning(false);
        try {
            let base64Data: string;
            let mimeType: string;

            const sourceImage = generatedImage || uploadedImage;

            if (sourceImage.startsWith('http')) {
                const response = await fetch(sourceImage);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result);
                    };
                    reader.readAsDataURL(blob);
                });
                const [mimeTypePrefix, data] = base64.split(';base64,');
                mimeType = mimeTypePrefix.split(':')[1];
                base64Data = data;
            } else {
                const [mimeTypePrefix, data] = sourceImage.split(';base64,');
                mimeType = mimeTypePrefix.split(':')[1];
                base64Data = data;
            }

            let referenceUrl = sourceImage.startsWith('http') ? sourceImage : undefined;

            // If source is base64 (local upload), upload it first to get a URL for the reference
            if (!referenceUrl) {
                try {
                    referenceUrl = await uploadBase64Image(sourceImage, 'generated-images');
                } catch (uploadErr) {
                    console.error("Failed to upload reference image:", uploadErr);
                    // Continue without reference URL if upload fails (fallback to Generation tag)
                }
            }

            const userJson = localStorage.getItem('click_tools_current_user');
            const user = userJson ? JSON.parse(userJson) : { name: 'Guest', avatar_url: '' };

            const project = await ProjectsService.create({
                prompt: prompt,
                model: selectedModel,
                author: user.name,
                authorAvatar: user.avatar_url,
                imageUrl: '',
                referenceImage: base64Data,
                referenceImageUrl: referenceUrl,
                referenceImageMimeType: mimeType,
                aspectRatio: imageAspectRatio
            });

            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = project.imageUrl;
            });

            if (project.credits !== undefined) {
                const userJson = localStorage.getItem('click_tools_current_user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    user.credits = project.credits;
                    localStorage.setItem('click_tools_current_user', JSON.stringify(user));
                    window.dispatchEvent(new Event('storage'));
                }
            }

            setGeneratedImage(project.imageUrl);

            let activeSessionId = currentSessionId;

            // If no active session (first edit), create one now
            if (!activeSessionId) {
                // OPTIMISTIC SESSION CREATION
                const tempSessionId = Date.now().toString();
                const tempSession: EditorSession = {
                    id: tempSessionId,
                    originalUrl: uploadedImage,
                    versions: [],
                    timestamp: Date.now(),
                    userId: 'temp'
                };

                setSessions(prev => [tempSession, ...prev]);
                activeSessionId = tempSessionId;
                setCurrentSessionId(tempSessionId);

                // Create in DB
                try {
                    const newSession = await EditorHistoryService.createSession(uploadedImage);
                    if (newSession) {
                        // Update state with real ID
                        activeSessionId = newSession.id;
                        setCurrentSessionId(newSession.id);
                        setSessions(prev => prev.map(s => s.id === tempSessionId ? newSession : s));
                    }
                } catch (e) {
                    console.error("Failed to create session on first edit:", e);
                }
            }

            // Add to current session versions
            if (activeSessionId) {
                const targetSessionId = activeSessionId; // Capture for closure

                // OPTIMISTIC VERSION UPDATE
                const tempVersionId = Date.now().toString();
                const tempVersion: EditorVersion = {
                    id: tempVersionId,
                    url: project.imageUrl,
                    prompt: prompt,
                    model: selectedModel,
                    timestamp: Date.now()
                };

                setSessions(prev => {
                    return prev.map(session => {
                        if (session.id === targetSessionId) {
                            return {
                                ...session,
                                versions: [...session.versions, tempVersion]
                            };
                        }
                        return session;
                    });
                });

                // Save Version to Supabase
                const savedVersion = await EditorHistoryService.addVersion(
                    targetSessionId,
                    project.imageUrl,
                    prompt,
                    selectedModel
                );

                if (savedVersion) {
                    // Replace temp version with real one
                    setSessions(prev => {
                        return prev.map(session => {
                            if (session.id === targetSessionId) {
                                return {
                                    ...session,
                                    versions: session.versions.map(v => v.id === tempVersionId ? savedVersion : v)
                                };
                            }
                            return session;
                        });
                    });
                }
            }

        } catch (error: any) {
            console.error("Error generating image:", error);
            const isExplicitSafety = error.message && (
                error.message.includes('SAFETY_VIOLATION') ||
                error.message.includes('safety') ||
                error.message.includes('blocked')
            );
            const isNanoBanana = selectedModel.includes('Nano Banana');
            const isGenericEdgeError = error.message && (
                error.message.includes('FunctionsHttpError') ||
                error.message.includes('Edge Function returned') ||
                error.message.includes('non-2xx')
            );

            if (isExplicitSafety || (isNanoBanana && isGenericEdgeError)) {
                setSafetyWarning(true);
            } else {
                alert("Failed to generate image. Please try again.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const restoreSession = (session: EditorSession) => {
        setCurrentSessionId(session.id);
        setUploadedImage(session.originalUrl);
        // Restore the last version if it exists, otherwise show original
        if (session.versions.length > 0) {
            const lastVersion = session.versions[session.versions.length - 1];
            setGeneratedImage(lastVersion.url);
            setPrompt(lastVersion.prompt);
        } else {
            setGeneratedImage(null);
            setPrompt('');
        }
        calculateAspectRatio(session.originalUrl);
    };

    const restoreVersion = (version: EditorVersion) => {
        setGeneratedImage(version.url);
        setPrompt(version.prompt);
    };

    const resetEditor = () => {
        setUploadedImage(null);
        setGeneratedImage(null);
        setPrompt('');
        setSafetyWarning(false);
        setCurrentSessionId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const currentSession = sessions.find(s => s.id === currentSessionId);

    return (
        <div className="fixed inset-0 bg-[#050505] text-white overflow-hidden flex flex-col z-40">
            {/* Safety Warning Toast */}
            <AnimatePresence>
                {safetyWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-24 left-0 right-0 z-[60] flex justify-center pointer-events-none"
                    >
                        <div className="relative overflow-hidden bg-[#0A0A0A]/90 backdrop-blur-2xl border border-red-500/20 px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(255,0,0,0.15)] flex items-center gap-4 pointer-events-auto mt-2 group">
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

            {/* Top Bar */}
            <div className="h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-2xl flex items-center justify-between px-6 z-50 absolute top-0 left-0 right-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <Wand2 size={16} className="text-white" />
                        </div>
                        <span className="font-display font-medium text-sm tracking-wide text-white/90">Editor</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">

                    <button
                        onClick={handleDownload}
                        disabled={!uploadedImage}
                        className="px-4 py-2 bg-white text-black rounded-lg font-medium text-xs hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={14} />
                        Download
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative pt-16">
                {/* Left Sidebar (Sessions) - Vertical on Desktop, Horizontal on Mobile */}
                <div className="w-full h-20 md:w-20 md:h-full border-b md:border-b-0 md:border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl flex flex-row md:flex-col items-center py-2 px-4 md:py-6 md:px-0 gap-4 z-40 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto custom-scrollbar shrink-0 order-first">
                    <button
                        onClick={resetEditor}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all duration-200 shrink-0 mb-2 group shadow-lg"
                        title="New Session"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="w-8 h-px bg-white/5 shrink-0 mb-2" />

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />

                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            onClick={() => restoreSession(session)}
                            className={`w-16 h-16 rounded-xl border overflow-hidden transition-all hover:scale-105 shrink-0 relative group shadow-sm ${currentSessionId === session.id ? 'border-brand ring-2 ring-brand/20' : 'border-white/10 hover:border-white/30'}`}
                            title={session.versions.length > 0 ? session.versions[0].prompt : `Session from ${new Date(session.timestamp).toLocaleTimeString()}`}
                        >
                            <img src={getOptimizedImageUrl(session.originalUrl, 200)} alt="Session" className="w-full h-full object-cover" loading="lazy" />
                            <div className={`absolute inset-0 transition-colors ${currentSessionId === session.id ? 'bg-transparent' : 'bg-black/40 group-hover:bg-black/20'}`} />
                        </button>
                    ))}

                    <div className="h-20 shrink-0" />
                </div>

                {/* Main Canvas Area */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-[#050505] relative overflow-hidden flex items-center justify-center"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onWheel={handleWheel}
                >
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />

                    <motion.div
                        className={`relative max-w-[90%] max-h-[80%] rounded-lg overflow-hidden group flex items-center justify-center transition-all duration-300 ${!uploadedImage
                            ? `cursor-pointer hover:bg-white/5 border-2 border-dashed ${isDragging ? 'border-brand bg-brand/10 scale-105' : 'border-white/10 hover:border-white/20'}`
                            : 'bg-[#111] border border-white/5 shadow-2xl'
                            } ${selectedTool === 'move' && uploadedImage ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{
                            scale: uploadedImage ? zoom / 100 : 1,
                            opacity: 1
                        }}
                        drag={selectedTool === 'move' && !!uploadedImage}
                        dragConstraints={containerRef}
                        dragElastic={0.1}
                        dragMomentum={false}
                        transition={{ duration: 0.05 }}
                        style={{
                            width: uploadedImage ? 'auto' : '800px',
                            height: uploadedImage ? 'auto' : '600px'
                        }}
                        onClick={() => !uploadedImage && fileInputRef.current?.click()}
                    >
                        {!uploadedImage ? (
                            <div className="flex flex-col items-center justify-center text-gray-500 p-20">
                                <ImageIcon size={64} className="mx-auto mb-6 opacity-20" />
                                <p className="text-lg font-medium text-white/50">Drag and drop an image here</p>
                                <p className="text-sm opacity-40 mt-2">or click to upload</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={generatedImage || uploadedImage}
                                    alt="Canvas"
                                    className="max-w-full max-h-[70vh] object-contain"
                                />
                                {isGenerating && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"
                                            animate={{
                                                backgroundPosition: ['0% 0%', '100% 100%'],
                                                opacity: [0.2, 0.4, 0.2]
                                            }}
                                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                            style={{ backgroundSize: '200% 200%' }}
                                        />
                                        <div className="flex flex-col items-center justify-center z-30">
                                            <PremiumLoader size={60} />
                                        </div>
                                    </div>
                                )}
                                {generatedImage && !isGenerating && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={(e) => { e.stopPropagation(); setGeneratedImage(null); }}
                                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors border border-white/10 backdrop-blur-md z-20"
                                        title="Revert to original"
                                    >
                                        <Undo size={16} />
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {uploadedImage && selectedTool === 'brush' && !isGenerating && (
                            <div className="absolute inset-0 cursor-crosshair pointer-events-none">
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs border border-white/10 pointer-events-auto">
                                    Brush Size: {brushSize}px
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Right Floating Versions Panel */}
                    <AnimatePresence>
                        {currentSession && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute right-6 top-24 bottom-24 flex flex-col justify-center pointer-events-none z-40"
                            >
                                <div
                                    className="bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-col gap-3 max-h-full overflow-y-auto custom-scrollbar pointer-events-auto"
                                    onWheel={(e) => e.stopPropagation()}
                                >

                                    {/* Original Version */}
                                    <button
                                        onClick={() => {
                                            setGeneratedImage(null);
                                            setPrompt('');
                                        }}
                                        className={`w-20 h-20 rounded-xl border overflow-hidden transition-all hover:scale-105 shrink-0 relative group shadow-lg ${!generatedImage ? 'border-brand ring-2 ring-brand/20' : 'border-white/10 hover:border-white/30'}`}
                                        title="Original Image"
                                    >
                                        <img src={getOptimizedImageUrl(currentSession.originalUrl, 200)} alt="Original" className="w-full h-full object-cover" loading="lazy" />
                                        <div className={`absolute inset-0 transition-colors ${!generatedImage ? 'bg-transparent' : 'bg-black/40 group-hover:bg-black/20'}`} />
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 pt-4">
                                            <div className="text-[9px] font-bold text-white/90 text-center">Original</div>
                                        </div>
                                    </button>

                                    {/* Generated Versions */}
                                    {currentSession.versions.map((version, idx) => (
                                        <button
                                            key={version.id}
                                            onClick={() => restoreVersion(version)}
                                            className={`w-20 h-20 rounded-xl border overflow-hidden transition-all hover:scale-105 shrink-0 relative group shadow-lg ${generatedImage === version.url ? 'border-brand ring-2 ring-brand/20' : 'border-white/10 hover:border-white/30'}`}
                                            title={version.prompt}
                                        >
                                            <img src={getOptimizedImageUrl(version.url, 200)} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                            <div className={`absolute inset-0 transition-colors ${generatedImage === version.url ? 'bg-transparent' : 'bg-black/40 group-hover:bg-black/20'}`} />
                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 pt-4">
                                                <div className="text-[9px] font-medium text-white/90 truncate text-center">
                                                    {version.prompt.slice(0, 10)}{version.prompt.length > 10 ? '...' : ''}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Floating Toolbar (Bottom Center) */}
                    <div className="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-4 items-center z-50 w-full px-4 md:w-auto md:px-0">
                        <motion.div
                            className={`flex items-center gap-2 p-2 bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full md:w-[500px] transition-all duration-500 relative overflow-hidden ${safetyWarning ? 'shadow-[0_0_40px_rgba(255,0,0,0.15)] border-red-500/30' : ''}`}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-500/10 to-red-600/20 opacity-0 transition-opacity duration-500 blur-xl ${safetyWarning ? 'opacity-100 animate-pulse' : ''}`} />

                            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 relative z-10 shadow-lg shadow-brand/20">
                                <Wand2 size={18} className="text-white" />
                            </div>
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    if (safetyWarning) setSafetyWarning(false);
                                }}
                                placeholder="Describe what you want to change or add..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 px-2 relative z-10 font-medium h-full"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={!uploadedImage || !prompt.trim() || isGenerating}
                                className={`px-5 py-2.5 bg-white text-black rounded-xl text-xs font-bold transition-all relative z-10 hover:shadow-lg hover:shadow-white/10 ${!uploadedImage || !prompt.trim() || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 hover:scale-105 active:scale-95'}`}
                            >
                                {isGenerating ? '...' : 'Generate'}
                            </button>
                        </motion.div>

                        {!isPromptOnly && (
                            <motion.div
                                className="flex items-center gap-1 p-2 bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {tools.map((tool) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => setSelectedTool(tool.id)}
                                        className={`
                                            p-3 rounded-xl transition-all duration-200 relative group
                                            ${selectedTool === tool.id
                                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        <tool.icon size={20} />
                                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-white shadow-xl">
                                            {tool.label}
                                        </span>
                                    </button>
                                ))}
                                <div className="w-px h-8 bg-white/10 mx-2" />
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setZoom(z => Math.max(10, z - 10))}
                                        className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="text-xs font-mono w-12 text-center text-gray-400">{zoom}%</span>
                                    <button
                                        onClick={() => setZoom(z => Math.min(200, z + 10))}
                                        className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="absolute bottom-8 left-8 z-50">
                        <AnimatePresence mode="wait">
                            {!showModelMenu ? (
                                <motion.button
                                    key="pill"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    onClick={() => setShowModelMenu(true)}
                                    className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-xl hover:bg-[#222] transition-all group hover:border-white/20"
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
                                    className="w-80 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] absolute bottom-0 left-0"
                                >
                                    <div
                                        onClick={() => setShowModelMenu(false)}
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                                    >
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Model</span>
                                        <ChevronDown size={14} className="text-gray-500" />
                                    </div>

                                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 flex-1">
                                        {models.map((model, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setSelectedModel(model.name);
                                                    setShowModelMenu(false);
                                                }}
                                                className={`
                                        group relative p-3 rounded-2xl text-left transition-all duration-200 border w-full
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
