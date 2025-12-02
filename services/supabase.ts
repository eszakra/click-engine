import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration:');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials are missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase client created successfully');

// Helper to upload images to Supabase Storage
export const uploadImage = async (file: File | Blob, bucket: 'avatars' | 'generated-images'): Promise<string> => {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const filePath = `${fileName}.png`;

    console.log(`📤 Uploading to bucket: ${bucket}`);

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (error) {
        console.error('❌ Error uploading image:', error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    console.log('✅ Image uploaded:', publicUrl);
    return publicUrl;
};

// Helper to upload base64 image
export const uploadBase64Image = async (base64: string, bucket: 'avatars' | 'generated-images'): Promise<string> => {
    try {
        console.log('🔄 Converting base64 to blob...');
        // Convert base64 to blob
        const base64Data = base64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        return uploadImage(blob, bucket);
    } catch (error) {
        console.error('❌ Error in uploadBase64Image:', error);
        throw error;
    }
};
