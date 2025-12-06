import { supabase, uploadBase64Image } from './supabase';

export interface EditorVersion {
    id: string;
    url: string;
    prompt: string;
    model: string;
    timestamp: number;
}

export interface EditorSession {
    id: string; // UUID from DB
    originalUrl: string;
    versions: EditorVersion[];
    timestamp: number;
    userId: string;
}

export const EditorHistoryService = {
    // Fetch all sessions for the current user
    getSessions: async (): Promise<EditorSession[]> => {
        try {
            // Get user from local storage (custom auth)
            const userJson = localStorage.getItem('click_tools_current_user');
            if (!userJson) return [];
            const user = JSON.parse(userJson);
            if (!user || !user.id) return [];

            // Fetch sessions
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('editor_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (sessionsError) throw sessionsError;
            if (!sessionsData) return [];

            // Fetch versions for these sessions
            const sessionIds = sessionsData.map(s => s.id);
            const { data: versionsData, error: versionsError } = await supabase
                .from('editor_versions')
                .select('*')
                .in('session_id', sessionIds)
                .order('created_at', { ascending: true }); // Oldest first to reconstruct history order

            if (versionsError) throw versionsError;

            // Group versions by session
            const versionsMap = new Map<string, EditorVersion[]>();
            versionsData?.forEach((v: any) => {
                const versions = versionsMap.get(v.session_id) || [];
                versions.push({
                    id: v.id,
                    url: v.url,
                    prompt: v.prompt || '',
                    model: v.model || '',
                    timestamp: new Date(v.created_at).getTime()
                });
                versionsMap.set(v.session_id, versions);
            });

            // Construct final session objects
            // Construct final session objects
            const allSessions = sessionsData.map((s: any) => ({
                id: s.id,
                originalUrl: s.original_url,
                versions: versionsMap.get(s.id) || [],
                timestamp: new Date(s.created_at).getTime(),
                userId: s.user_id
            }));

            // Filter out empty sessions (no versions) as they shouldn't be in history
            return allSessions.filter(s => s.versions.length > 0);

        } catch (error) {
            console.error('Error fetching editor history:', error);
            return [];
        }
    },

    // Create a new session
    createSession: async (originalUrl: string): Promise<EditorSession | null> => {
        try {
            const userJson = localStorage.getItem('click_tools_current_user');
            if (!userJson) throw new Error('User not authenticated locally');
            const user = JSON.parse(userJson);

            let finalUrl = originalUrl;

            // If it's a base64 image, upload it to storage first
            if (originalUrl.startsWith('data:image')) {
                try {
                    // Upload to 'generated-images' bucket for now (or could be 'editor-uploads' if we created it)
                    finalUrl = await uploadBase64Image(originalUrl, 'generated-images');
                } catch (uploadError) {
                    console.error('Failed to upload initial image, falling back to saving URL directly (might fail if too large):', uploadError);
                    // allow to proceed, maybe it works if small, or it will fail at DB insert
                }
            }

            const { data, error } = await supabase
                .from('editor_sessions')
                .insert({
                    user_id: user.id,
                    original_url: finalUrl
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                originalUrl: data.original_url,
                versions: [],
                timestamp: new Date(data.created_at).getTime(),
                userId: data.user_id
            };
        } catch (error) {
            console.error('Error creating session:', error);
            // Return a local fallback session so the UI doesn't break? 
            // Better to let the UI handle the fallback logic, so return null here indicating DB failure.
            return null;
        }
    },

    // Add a version to a session
    addVersion: async (sessionId: string, url: string, prompt: string, model: string): Promise<EditorVersion | null> => {
        try {
            const { data, error } = await supabase
                .from('editor_versions')
                .insert({
                    session_id: sessionId,
                    url: url,
                    prompt: prompt,
                    model: model
                })
                .select()
                .single();

            if (error) throw error;

            return {
                id: data.id,
                url: data.url,
                prompt: data.prompt,
                model: data.model,
                timestamp: new Date(data.created_at).getTime()
            };
        } catch (error) {
            console.error('Error adding version:', error);
            return null;
        }
    },

    // Delete a session
    deleteSession: async (sessionId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('editor_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting session:', error);
            return false;
        }
    }
};
