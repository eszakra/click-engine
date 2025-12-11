import { supabase } from './supabase';

export interface Wallet {
    id: number;
    balance: number;
    updated_at: string;
}

export interface UsageStats {
    modelUsage: { name: string; used: number; color: string }[];
    dailyActivity: number[];
}

export const WalletService = {
    getBalance: async (): Promise<number> => {
        try {
            const { data, error } = await supabase
                .from('team_wallet')
                .select('balance')
                .single();

            if (error) throw error;
            return data?.balance || 0;
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            return 0;
        }
    },

    subscribeToBalance: (onBalanceChange: (balance: number) => void) => {
        const channel = supabase
            .channel('public:team_wallet')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'team_wallet'
                },
                (payload) => {
                    if (payload.new && typeof payload.new.balance === 'number') {
                        onBalanceChange(payload.new.balance);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    getUsageStats: async (): Promise<UsageStats> => {
        try {
            // 1. Get Model Usage (Nano Banana & Nano Banana Pro only)
            const { count: nanoBananaCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .ilike('model', '%Nano Banana%')
                .not('model', 'ilike', '%Pro%');

            const { count: nanoBananaProCount } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .ilike('model', '%Nano Banana Pro%');

            const modelUsage = [
                { name: 'Nano Banana Pro', used: nanoBananaProCount || 0, color: 'bg-brand' },
                { name: 'Nano Banana', used: nanoBananaCount || 0, color: 'bg-yellow-500' }
            ];

            // 2. Get Daily Activity (Last 7 Days)
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            // Fetch projects from last 7 days
            const { data: recentProjects } = await supabase
                .from('projects')
                .select('created_at')
                .gte('created_at', last7Days[0]);

            const dailyActivity = last7Days.map(date => {
                return (recentProjects || []).filter(p => p.created_at.startsWith(date)).length;
            });

            return {
                modelUsage,
                dailyActivity
            };

        } catch (error) {
            console.error('Error fetching usage stats:', error);
            return {
                modelUsage: [],
                dailyActivity: [0, 0, 0, 0, 0, 0, 0]
            };
        }
    }
};
