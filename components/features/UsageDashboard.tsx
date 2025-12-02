import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, BarChart, Activity, Zap, Layers } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const UsageDashboard: React.FC = () => {
    // Mock Data
    const stats = [
        { label: 'Total Credits', value: '5,000', sub: 'Monthly Quota', icon: <Zap size={20} className="text-yellow-400" /> },
        { label: 'Credits Used', value: '2,450', sub: '49% Used', icon: <Activity size={20} className="text-brand" /> },
        { label: 'Remaining', value: '2,550', sub: 'Expires in 12 days', icon: <Layers size={20} className="text-blue-400" /> },
    ];

    const modelUsage = [
        { name: 'Krea 1', used: 1200, color: 'bg-brand' },
        { name: 'Flux', used: 800, color: 'bg-blue-500' },
        { name: 'Nano Banana', used: 300, color: 'bg-yellow-500' },
        { name: 'Others', used: 150, color: 'bg-gray-500' },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-display font-bold text-white mb-2">
                    Usage <span className="text-transparent bg-clip-text bg-gradient-brand">Statistics</span>
                </h1>
                <p className="text-gray-400">Track team consumption and resource allocation.</p>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <GlassCard key={index} className="flex items-center gap-4 p-6">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                            <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Model Breakdown */}
                <GlassCard>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <PieChart size={18} className="text-gray-400" />
                        Model Consumption
                    </h3>
                    <div className="space-y-6">
                        {modelUsage.map((model, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-300">{model.name}</span>
                                    <span className="text-gray-500">{model.used} units</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(model.used / 2450) * 100}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 }}
                                        className={`h-full ${model.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Recent Activity Graph Placeholder */}
                <GlassCard>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <BarChart size={18} className="text-gray-400" />
                        Daily Activity
                    </h3>
                    <div className="h-[200px] flex items-end justify-between gap-2 px-2">
                        {[40, 65, 30, 80, 55, 90, 45].map((height, i) => (
                            <div key={i} className="w-full bg-white/5 rounded-t-lg relative group hover:bg-white/10 transition-colors">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand/20 to-brand/80 rounded-t-lg mx-1"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-gray-500 px-2">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default UsageDashboard;
