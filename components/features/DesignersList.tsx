import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DesignersService, Designer } from '../../services/designers';
import GlassCard from '../ui/GlassCard';

const DesignersList: React.FC = () => {
    const [designers, setDesigners] = useState<Designer[]>([]);

    const loadDesigners = async () => {
        const data = await DesignersService.getAll();
        setDesigners(data);
    };

    useEffect(() => {
        // Load initially
        loadDesigners();

        // Refresh every 5 seconds to show real-time updates
        const interval = setInterval(loadDesigners, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-display font-bold text-white mb-2">
                    Active <span className="text-transparent bg-clip-text bg-gradient-brand">Team</span>
                </h1>
                <p className="text-gray-400">See who is creating magic right now.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {designers.map((designer) => (
                    <GlassCard key={designer.id} className="flex items-center gap-4 p-4" noPadding>
                        <div className="relative">
                            <img src={designer.avatar} alt={designer.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                            {designer.status === 'online' && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                            )}
                            {designer.status === 'generating' && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand border-2 border-black rounded-full animate-pulse"></span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-white font-medium">{designer.name}</h3>
                            <div className="flex items-center gap-2">
                                {designer.status === 'generating' ? (
                                    <span className="text-xs text-brand font-medium">Generating...</span>
                                ) : (
                                    <span className="text-xs text-gray-500">{designer.status === 'online' ? 'Online' : `Active ${designer.lastActive}`}</span>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};

export default DesignersList;
