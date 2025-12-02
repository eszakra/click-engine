import { supabase, uploadBase64Image } from './supabase';

export interface User {
    id: string;
    name: string;
    avatar: string;
    status?: 'online' | 'offline' | 'generating';
    lastActive?: string;
}

const STORAGE_KEY_CURRENT = 'click_tools_current_user';

export const AuthService = {
    login: async (name: string, password: string): Promise<User | null> => {
        try {
            console.log('🔍 Attempting login for user:', name);

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('name', name)
                .eq('password', password)
                .single();

            if (error || !data) {
                console.error('❌ Invalid credentials');
                return null;
            }

            console.log('✅ Login successful!');

            const user: User = {
                id: data.id,
                name: data.name,
                avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${data.name}&background=random`,
                status: 'online',
                lastActive: 'Now'
            };

            // Update status to online
            await supabase
                .from('users')
                .update({ status: 'online' })
                .eq('id', user.id);

            localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(user));
            return user;
        } catch (error) {
            console.error('💥 Login error:', error);
            return null;
        }
    },

    updateStatus: async (status: 'online' | 'offline' | 'generating'): Promise<void> => {
        const user = AuthService.getCurrentUser();
        if (user) {
            try {
                await supabase
                    .from('users')
                    .update({ status })
                    .eq('id', user.id);

                user.status = status;
                localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(user));
                console.log(`✅ Status updated to ${status}`);
            } catch (error) {
                console.error('Error updating status:', error);
            }
        }
    },

    updateProfile: async (name: string, avatarBase64: string): Promise<User | null> => {
        const user = AuthService.getCurrentUser();
        if (!user) return null;

        try {
            console.log('📤 Uploading avatar to Supabase Storage...');

            // Upload image to Supabase Storage
            const avatarUrl = await uploadBase64Image(avatarBase64, 'avatars');
            console.log('✅ Avatar uploaded:', avatarUrl);

            // Update user in database
            const { error, count } = await supabase
                .from('users')
                .update({
                    name,
                    avatar_url: avatarUrl
                })
                .eq('id', user.id)
                .select('id', { count: 'exact' });

            if (error) throw error;

            if (count === 0) {
                throw new Error('User not found in database. Please logout and login again.');
            }

            console.log('✅ Profile updated in Supabase');

            const updatedUser: User = {
                ...user,
                name,
                avatar: avatarUrl
            };

            localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            console.error('Error updating profile:', error);
            return null;
        }
    },

    register: async (name: string, email: string, avatar: string): Promise<User> => {
        throw new Error("Registration is disabled. Please contact admin.");
    },

    getCurrentUser: (): User | null => {
        const storedUser = localStorage.getItem(STORAGE_KEY_CURRENT);
        return storedUser ? JSON.parse(storedUser) : null;
    },

    logout: async () => {
        const current = AuthService.getCurrentUser();
        if (current) {
            try {
                await supabase
                    .from('users')
                    .update({ status: 'offline' })
                    .eq('id', current.id);
                console.log('✅ Status updated to offline');
            } catch (e) {
                console.warn('⚠️ Could not update status on logout');
            }
        }
        localStorage.removeItem(STORAGE_KEY_CURRENT);
        console.log('✅ Logged out successfully');
    }
};
