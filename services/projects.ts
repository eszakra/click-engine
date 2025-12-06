import { supabase } from './supabase';

export interface Project {
    id: string;
    imageUrl: string;
    prompt: string;
    author: string;
    authorAvatar: string;
    model: string;
    date: string;
    credits?: number; // Optional, returned after generation
}

export const ProjectsService = {
    getAll: async (): Promise<Project[]> => {
        try {
            // Fetch projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (projectsError) throw projectsError;

            // Fetch users to get avatars
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('name, avatar_url');

            if (usersError) console.warn('Error fetching users for avatars:', usersError);

            // Create a map of user avatars
            const avatarMap = new Map();
            if (usersData) {
                usersData.forEach((user: any) => {
                    avatarMap.set(user.name, user.avatar_url);
                });
            }

            return (projectsData || []).map((record: any) => ({
                id: record.id,
                imageUrl: record.image_url || '',
                prompt: record.prompt || '',
                author: record.author_name || 'Unknown',
                authorAvatar: avatarMap.get(record.author_name) || '',
                model: record.model || 'Unknown',
                date: new Date(record.created_at).toLocaleDateString()
            }));
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    },

    create: async (projectData: Omit<Project, 'id' | 'date'> & { aspectRatio?: string, referenceImage?: string, referenceImageMimeType?: string, resolution?: string }): Promise<Project> => {
        try {
            let imageUrl = '';
            let remainingCredits: number | undefined;
            const modelUsed = projectData.model;
            const aspectRatio = projectData.aspectRatio || '1:1';

            if (projectData.model === 'Grok 2' || projectData.model.includes('Nano Banana')) {
                console.log(`Generating with ${projectData.model} (Edge Function)...`);

                // Default to Grok settings
                let apiModelId = 'grok-2-image-1212';
                let provider = 'xai';

                // Prepend aspect ratio to prompt for Grok (Stronger adherence)
                let enhancedPrompt = "";

                // If editing (referenceImage exists), prioritize preserving structure
                if (projectData.referenceImage) {
                    enhancedPrompt = `maintain original ${aspectRatio} aspect ratio, ` + projectData.prompt;
                } else {
                    if (aspectRatio === '16:9') {
                        enhancedPrompt = "wide 16:9 aspect ratio, landscape orientation, cinematic shot, " + projectData.prompt;
                    } else if (aspectRatio === '4:3') {
                        enhancedPrompt = "4:3 aspect ratio, landscape orientation, " + projectData.prompt;
                    } else if (aspectRatio === '1:1') {
                        enhancedPrompt = "square 1:1 aspect ratio, " + projectData.prompt;
                    } else {
                        enhancedPrompt = projectData.prompt;
                    }
                }
                if (projectData.model.includes('Nano Banana')) {
                    if (projectData.model === 'Nano Banana Pro') {
                        apiModelId = 'gemini-3-pro-image-preview';
                    } else {
                        apiModelId = 'gemini-2.5-flash-image'; // Standard Nano Banana - Image Generation
                    }
                    provider = 'google';
                }

                const { data, error } = await supabase.functions.invoke('generate-image', {
                    body: {
                        prompt: enhancedPrompt,
                        model: apiModelId,
                        provider: provider,
                        referenceImage: projectData.referenceImage,
                        referenceImageMimeType: projectData.referenceImageMimeType,
                        aspectRatio: aspectRatio,
                        resolution: projectData.resolution
                    }
                });

                if (error) {
                    console.error("Supabase Function Error:", error);
                    // Try to extract the real error message from the response body
                    try {
                        if (error instanceof Error && 'context' in error) {
                            const response = (error as any).context as Response;
                            if (response && typeof response.json === 'function') {
                                const errorBody = await response.json();
                                console.log("Error Body:", errorBody);
                                if (errorBody.error && (
                                    errorBody.error.includes('safety') ||
                                    errorBody.error.includes('blocked') ||
                                    errorBody.error.includes('SAFETY')
                                )) {
                                    throw new Error('SAFETY_VIOLATION: Content blocked by safety filters.');
                                }
                                throw new Error(errorBody.error || error.message);
                            }
                        }
                    } catch (parseError) {
                        console.warn("Failed to parse error response:", parseError);
                    }
                    throw error;
                }

                if (data.error) {
                    if (data.error.includes('safety') || data.error.includes('blocked') || data.error.includes('SAFETY')) {
                        throw new Error('SAFETY_VIOLATION: Content blocked by safety filters.');
                    }
                    throw new Error(data.error);
                }

                imageUrl = data.imageUrl;
                remainingCredits = data.credits;
            } else {
                console.log('Generating with Pollinations...');

                // Calculate dimensions based on aspect ratio
                let width = 1024;
                let height = 1024;

                if (aspectRatio === '16:9') {
                    width = 1280;
                    height = 720;
                } else if (aspectRatio === '4:3') {
                    width = 1024;
                    height = 768;
                }

                const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(projectData.prompt)}?width=${width}&height=${height}&nologo=true&model=flux`;

                const response = await fetch(pollUrl);
                const blob = await response.blob();

                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
                const { error: uploadError } = await supabase.storage
                    .from('generated-images')
                    .upload(fileName, blob, { contentType: 'image/png' });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('generated-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const { data: project, error: dbError } = await supabase
                .from('projects')
                .insert({
                    prompt: projectData.prompt,
                    image_url: imageUrl,
                    model: modelUsed,
                    author_name: projectData.author
                })
                .select()
                .single();

            if (dbError) throw dbError;
            return {
                id: project.id,
                imageUrl: imageUrl,
                prompt: projectData.prompt,
                author: projectData.author,
                authorAvatar: projectData.authorAvatar,
                model: modelUsed,
                date: new Date(project.created_at).toLocaleDateString(),
                credits: remainingCredits
            };
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    subscribeToProjects: (onNewProject: (project: Project) => void) => {
        const channel = supabase
            .channel('public:projects')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'projects'
                },
                async (payload) => {
                    // Fetch user info for the new project to get the avatar
                    // We do this because the realtime payload doesn't contain the joined user data
                    let authorAvatar = '';
                    if (payload.new.author_name) {
                        const { data } = await supabase
                            .from('users')
                            .select('avatar_url')
                            .eq('name', payload.new.author_name)
                            .single();
                        if (data) authorAvatar = data.avatar_url;
                    }

                    const newProject: Project = {
                        id: payload.new.id,
                        imageUrl: payload.new.image_url,
                        prompt: payload.new.prompt,
                        author: payload.new.author_name || 'Unknown',
                        authorAvatar: authorAvatar,
                        model: payload.new.model || 'Unknown',
                        date: new Date(payload.new.created_at).toLocaleDateString()
                    };

                    onNewProject(newProject);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
};
