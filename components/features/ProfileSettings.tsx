import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User, Save, LogOut } from 'lucide-react';
import PremiumButton from '../ui/PremiumButton';

interface ProfileSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: { name: string; avatar: string };
    onUpdateProfile: (name: string, avatar: string) => void;
    onLogout: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isOpen, onClose, currentUser, onUpdateProfile, onLogout }) => {
    const [name, setName] = useState(currentUser.name);
    const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync with currentUser changes
    React.useEffect(() => {
        setName(currentUser.name);
        setAvatarUrl(currentUser.avatar);
    }, [currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onUpdateProfile(name, avatarUrl);
            setIsLoading(false);
            // Wait a bit for the state to update before closing
            setTimeout(() => {
                onClose();
            }, 500);
        } catch (error) {
            console.error('Error updating profile:', error);
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-display font-bold text-white mb-2">
                            Profile Settings
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Update your personal information.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center mb-6">
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-brand/50 transition-colors">
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                    <Upload size={20} className="text-white" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 uppercase ml-1">Display Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-brand/50 transition-colors"
                                />
                            </div>
                        </div>

                        <PremiumButton
                            type="submit"
                            isLoading={isLoading}
                            className="w-full py-3"
                            icon={<Save size={16} />}
                        >
                            Save Changes
                        </PremiumButton>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProfileSettings;
