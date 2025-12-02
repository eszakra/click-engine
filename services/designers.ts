import { supabase } from './supabase';

export interface Designer {
    id: string;
    name: string;
    avatar: string;
    status: 'online' | 'generating' | 'offline';
    lastActive: string;
}

export const DesignersService = {
    getAll: async (): Promise<Designer[]> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*');

            if (error) throw error;

            return (data || []).map((record: any) => ({
                id: record.id,
                name: record.name || 'Unknown',
                avatar: record.avatar_url || `https://ui-avatars.com/api/?name=${record.name}&background=random`,
                status: record.status || 'offline',
                lastActive: record.status === 'online' ? 'Now' : 'Recently'
            }));
        } catch (error) {
            console.error('Error fetching designers:', error);
            return [];
        }
    }
};
