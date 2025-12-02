import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MousePointer2, Brush, Eraser, Image as ImageIcon,
    Move, Maximize, type LucideIcon, Undo, Redo,
    Download, Share2, Layers, Settings, Wand2,
    Plus, Minus, Square, Circle, Upload, X,
    Clock, Cpu, ChevronDown, ChevronUp, Zap, Copy, Check
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import PremiumLoader from '../ui/PremiumLoader';
import { ProjectsService } from '../../services/projects';

interface Tool {
    id: string;
    icon: LucideIcon;
    label: string;
}

interface HistoryItem {
    url: string;
    prompt: string;
    model: string;
}

const ImageEditor: React.FC = () => {
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
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Load history from localStorage on mount
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const saved = localStorage.getItem('image_editor_history');
        return saved ? JSON.parse(saved) : [];
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const models = [
        { name: 'FLUX 2.0', desc: 'Next-gen image synthesis', time: '15s', cost: '2 units', active: true, tags: ['Ultra Quality', 'Inpainting'], isNew: true },
        { name: 'FLUX 1.0', desc: 'High fidelity generation', time: '12s', cost: '1 unit', active: false, tags: ['Balanced', 'Inpainting'] },
        { name: 'Grok 2', desc: 'Smartest model, best for complex prompts', time: '10s', cost: '1 unit', active: false, tags: ['High Quality', 'Smart'] },
        { name: 'Nano Banana Pro', desc: 'Native 4K image generation', time: '30s', cost: '119 units', active: false, tags: ['2 images'] },
        { name: 'Nano Banana', desc: 'Smart model, best for image editing', time: '10s', cost: '32 units', active: false, tags: ['2 images'] },
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

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('image_editor_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        // Add generated image to history if it's new
        if (generatedImage) {
            const exists = history.some(item => item.url === generatedImage);
            if (!exists) {
                setHistory(prev => [{
                    url: generatedImage,
                    prompt: prompt,
                    model: selectedModel
                }, ...prev]);
            }
        }
    }, [generatedImage]);

    const calculateAspectRatio = (src: string) => {
        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;

            // Define standard aspect ratios
            const ratios: Record<string, number> = {
                '16:9': 16 / 9,
                '4:3': 4 / 3,
                '1:1': 1,
                '3:4': 3 / 4,
                '9:16': 9 / 16
            };

            // Find closest standard ratio
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
            console.log(`Detected Aspect Ratio: ${closest} (Raw: ${ratio})`);
        };
        img.src = src;
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setUploadedImage(result);
                setGeneratedImage(null); // Reset generated image on new upload
                calculateAspectRatio(result);
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
                setUploadedImage(result);
                setGeneratedImage(null);
                calculateAspectRatio(result);
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
            setZoom(z => Math.min(200, Math.max(10, z + delta)));
        }
    };

    const handleGenerate = async () => {
        if (!uploadedImage || !prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        try {
            let base64Data: string;
            let mimeType: string;

            // If there's a generated image, we need to fetch it and convert to base64
            if (generatedImage) {
                // Fetch the image from URL
                const response = await fetch(generatedImage);
                const blob = await response.blob();

                // Convert blob to base64
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result);
                    };
                    reader.readAsDataURL(blob);
                });

                // Extract base64 data and mime type
                const [mimeTypePrefix, data] = base64.split(';base64,');
                mimeType = mimeTypePrefix.split(':')[1];
                base64Data = data;
            } else {
                // Use the uploaded image (first edit)
                const [mimeTypePrefix, data] = uploadedImage.split(';base64,');
                mimeType = mimeTypePrefix.split(':')[1];
                base64Data = data;
            }

            // Get current user (mock or from local storage)
            const userJson = localStorage.getItem('click_tools_current_user');
            const user = userJson ? JSON.parse(userJson) : { name: 'Guest', avatar_url: '' };

            const project = await ProjectsService.create({
                prompt: prompt,
                model: selectedModel,
                author: user.name,
                authorAvatar: user.avatar_url,
                imageUrl: '', // Placeholder, will be generated by backend
                referenceImage: base64Data,
                referenceImageMimeType: mimeType,
                aspectRatio: imageAspectRatio // Use calculated aspect ratio
            });

            setGeneratedImage(project.imageUrl);
        } catch (error) {
            console.error("Error generating image:", error);
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const restoreHistoryItem = (item: HistoryItem) => {
        setGeneratedImage(item.url);
        setUploadedImage(item.url); // Set as current base for further edits
        setPrompt(item.prompt);
        setSelectedModel(item.model);
        calculateAspectRatio(item.url);
    };

    const handleCopyPrompt = (prompt: string, idx: number) => {
        navigator.clipboard.writeText(prompt);
        setCopiedId(`history-${idx}`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="fixed inset-0 bg-[#050505] text-white overflow-hidden flex flex-col z-40">
            {/* Top Bar */}
            <div className="h-16 border-b border-white/5 bg-[#0A0A0A]/95 backdrop-blur-xl flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/20">
                            <Wand2 size={16} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-lg tracking-tight">Editor</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
                        <button className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white disabled:opacity-50" title="Undo">
                            <Undo size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white disabled:opacity-50" title="Redo">
                            <Redo size={16} />
                        </button>
                    </div>
                    <button className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar (History) */}
                {/* Left Sidebar (History) */}
                <div className="w-24 border-r border-white/5 bg-[#0A0A0A] flex flex-col items-center py-6 gap-4 z-40 overflow-y-auto custom-scrollbar h-full shrink-0">
                    {/* Hidden Input for Upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />

                    {/* History Items - Only Generated Images */}
                    {history.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => restoreHistoryItem(item)}
                            className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden hover:border-brand transition-all hover:scale-105 shrink-0 relative group shadow-sm"
                            title={item.prompt}
                        >
                            <img src={item.url} alt={`History ${idx}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                            {/* Copy Prompt Button */}
                            <div
                                onClick={(e) => { e.stopPropagation(); handleCopyPrompt(item.prompt, idx); }}
                                className="absolute bottom-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
                                title="Copy Prompt"
                            >
                                {copiedId === `history-${idx}` ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                            </div>
                        </button>
                    ))}

                    {/* Spacer at bottom */}
                    <div className="h-20 shrink-0" />
                </div>

                {/* Main Canvas Area */}
                <div
                    className="flex-1 bg-[#050505] relative overflow-hidden flex items-center justify-center"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {/* Grid Background Pattern */}
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {/* The Canvas */}
                    <motion.div
                        className={`relative max-w-[90%] max-h-[80%] rounded-lg overflow-hidden group flex items-center justify-center transition-all duration-300 ${!uploadedImage
                                ? `cursor-pointer hover:bg-white/5 border-2 border-dashed ${isDragging ? 'border-brand bg-brand/10 scale-105' : 'border-white/10 hover:border-white/20'}`
                                : 'bg-[#111] border border-white/5 shadow-2xl'
                            }`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            width: uploadedImage ? 'auto' : '800px',
                            height: uploadedImage ? 'auto' : '600px',
                            transform: uploadedImage ? `scale(${zoom / 100})` : 'none'
                        }}
                        onClick={() => !uploadedImage && fileInputRef.current?.click()}
                        onWheel={handleWheel}
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
                                        {/* Subtle Liquid Shimmer */}
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

                        {/* Interactive Overlay for Tools (Only if image loaded and not generating) */}
                        {uploadedImage && selectedTool === 'brush' && !isGenerating && (
                            <div className="absolute inset-0 cursor-crosshair pointer-events-none">
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs border border-white/10 pointer-events-auto">
                                    Brush Size: {brushSize}px
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Floating Toolbar (Bottom Center) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-4 items-center z-50">

                        {/* Prompt Input Bar */}
                        <motion.div
                            className="flex items-center gap-2 p-1.5 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-[500px]"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                        >
                            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
                                <Wand2 size={16} className="text-white" />
                            </div>
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to change or add..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 px-2"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={!uploadedImage || !prompt.trim() || isGenerating}
                                className={`px-4 py-1.5 bg-white text-black rounded-lg text-xs font-bold transition-colors ${!uploadedImage || !prompt.trim() || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            >
                                {isGenerating ? '...' : 'Generate'}
                            </button>
                        </motion.div>

                        {/* Tools Dock - Only show if not in prompt-only mode */}
                        {!isPromptOnly && (
                            <motion.div
                                className="flex items-center gap-1 p-2 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {tools.map((tool) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => setSelectedTool(tool.id)}
                                        className={`
                                            p-2.5 rounded-xl transition-all duration-200 relative group
                                            ${selectedTool === tool.id
                                                ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        <tool.icon size={20} />

                                        {/* Tooltip */}
                                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {tool.label}
                                        </span>
                                    </button>
                                ))}

                                <div className="w-px h-6 bg-white/10 mx-1" />

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setZoom(z => Math.max(10, z - 10))}
                                        className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="text-xs font-mono w-12 text-center text-gray-400">{zoom}%</span>
                                    <button
                                        onClick={() => setZoom(z => Math.min(200, z + 10))}
                                        className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom Left Model Selector Pill */}
                    <div className="absolute bottom-8 left-8 z-50">
                        <AnimatePresence mode="wait">
                            {!showModelMenu ? (
                                <motion.button
                                    key="pill"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    onClick={() => setShowModelMenu(true)}
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
                                    className="w-80 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] absolute bottom-0 left-0"
                                >
                                    {/* Header */}
                                    <div
                                        onClick={() => setShowModelMenu(false)}
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
                                                    setSelectedModel(model.name);
                                                    setShowModelMenu(false);
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
                                            <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> 2,450 Credits</span>
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
