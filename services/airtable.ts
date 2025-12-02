const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

export const AirtableService = {
    // Generic fetch wrapper
    request: async (endpoint: string, options: RequestInit = {}) => {
        const headers = {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('❌ Airtable Error:', error);
            throw new Error(error.error?.message || `Airtable Error: ${response.statusText}`);
        }

        return response.json();
    },

    // Upload image to Cloudinary (free tier, no API key needed for unsigned uploads)
    uploadImage: async (base64Image: string): Promise<string> => {
        try {
            console.log('📤 Uploading image to Cloudinary...');

            const formData = new FormData();
            formData.append('file', base64Image);
            formData.append('upload_preset', 'ml_default'); // Cloudinary's default unsigned preset

            const response = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Cloudinary upload failed');
            }

            const data = await response.json();
            console.log('✅ Image uploaded successfully:', data.secure_url);
            return data.secure_url;
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            // Fallback: just use the base64 directly (not ideal but works)
            console.warn('⚠️ Using base64 as fallback');
            return base64Image;
        }
    },

    // Users
    getUserByName: async (name: string) => {
        const filterByFormula = encodeURIComponent(`{Name} = '${name}'`);
        const data = await AirtableService.request(`/Users?filterByFormula=${filterByFormula}`);
        return data.records[0];
    },

    getAllUsers: async () => {
        const data = await AirtableService.request('/Users');
        return data.records;
    },

    updateUserStatus: async (recordId: string, status: string) => {
        return AirtableService.request(`/Users/${recordId}`, {
            method: 'PATCH',
            body: JSON.stringify({ fields: { Status: status } }),
        });
    },

    updateUserAvatar: async (recordId: string, avatarUrl: string) => {
        console.log('📝 Updating avatar in Airtable...');
        // Airtable expects attachments in this format
        return AirtableService.request(`/Users/${recordId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                fields: {
                    Avatar: [{ url: avatarUrl }]
                }
            }),
        });
    },

    updateUserProfile: async (recordId: string, name: string, avatarUrl: string) => {
        console.log('📝 Updating profile in Airtable...');
        return AirtableService.request(`/Users/${recordId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                fields: {
                    Name: name,
                    Avatar: [{ url: avatarUrl }]
                }
            }),
        });
    },

    // Projects
    getProjects: async () => {
        const data = await AirtableService.request('/Projects?sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=desc');
        return data.records;
    },

    createProject: async (projectData: any) => {
        return AirtableService.request('/Projects', {
            method: 'POST',
            body: JSON.stringify({ fields: projectData }),
        });
    }
};
