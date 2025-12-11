import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, BarChart, Activity, Zap, Layers } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

import { WalletService, UsageStats } from '../../services/wallet';

const UsageDashboard: React.FC = () => {
    // Get real wallet balance
    const [credits, setCredits] = React.useState(0);
    const [usageStats, setUsageStats] = React.useState<UsageStats | null>(null);
    const TOTAL_QUOTA = 20000; // ~$200 USD visual cap

    React.useEffect(() => {
        // Initial fetch
        WalletService.getBalance().then(setCredits);
        WalletService.getUsageStats().then(setUsageStats);

        // Real-time subscription to balance
        const unsubscribe = WalletService.subscribeToBalance((newBalance) => {
            setCredits(newBalance);
            // Refetch stats when balance changes (implies new generation)
            WalletService.getUsageStats().then(setUsageStats);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Mock Data (Updated with real credits)
    const stats = [
        { label: 'Total Budget (Est.)', value: TOTAL_QUOTA.toLocaleString(), sub: 'Monthly Allocation', icon: <Zap size={20} className="text-yellow-400" /> },
        { label: 'Credits Used', value: (TOTAL_QUOTA - credits).toLocaleString(), sub: `${Math.round(((TOTAL_QUOTA - credits) / TOTAL_QUOTA) * 100)}% Used`, icon: <Activity size={20} className="text-brand" /> },
        { label: 'Remaining', value: credits.toLocaleString(), sub: 'Expires in 12 days', icon: <Layers size={20} className="text-blue-400" /> },
    ];

    const modelUsage = usageStats?.modelUsage || [
        { name: 'Nano Banana Pro', used: 0, color: 'bg-brand' },
        { name: 'Nano Banana', used: 0, color: 'bg-yellow-500' }
    ];

    // Generate last 7 days labels
    const getDayLabels = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            labels.push(days[d.getDay()]);
        }
        return labels;
    };

    const dailyData = usageStats?.dailyActivity || [0, 0, 0, 0, 0, 0, 0];
    const maxActivity = Math.max(...dailyData, 10); // Scale graph based on activity

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-display font-bold text-white mb-2">
                    Usage <span className="text-[#E91E63]">Statistics</span>
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
                                        animate={{ width: `${(model.used / TOTAL_QUOTA) * 100}%` }}
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
                        {dailyData.map((count, i) => (
                            <div key={i} className="w-full bg-white/5 rounded-t-lg relative group hover:bg-white/10 transition-colors tooltip-trigger"
                                title={`${count} generations`}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(count / maxActivity) * 100}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand/20 to-brand/80 rounded-t-lg mx-1"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-gray-500 px-2">
                        {getDayLabels().map((day, i) => (
                            <span key={i}>{day}</span>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default UsageDashboard;
