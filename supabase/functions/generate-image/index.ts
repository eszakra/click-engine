import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            prompt,
            model = 'grok-2-image-1212',
            provider = 'xai',
            referenceImage, // Base64 string (without data:image/... prefix)
            referenceImageMimeType, // e.g. 'image/png'
            aspectRatio = '1:1', // e.g. '16:9', '1:1'
            imageSize // Optional, for Pro models (1K, 2K, 4K)
        } = await req.json()

        // Handle Google (Gemini) - Using REST API directly
        if (provider === 'google') {
            // Use the API key from Supabase Secrets
            const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
            if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set');

            console.log(`Calling Google AI with model: ${model}`);

            try {
                // Build parts array (Multimodal: Image + Text)
                const parts: any[] = [];

                // A) Add reference image if exists (Image-to-Image mode)
                if (referenceImage && referenceImageMimeType) {
                    console.log('Adding reference image to request...');
                    parts.push({
                        inlineData: {
                            data: referenceImage,
                            mimeType: referenceImageMimeType,
                        },
                    });
                }

                // B) Add text prompt (always required)
                parts.push({
                    text: prompt,
                });

                // Construct request config with image settings
                const imageConfig: any = {
                    aspectRatio: aspectRatio,
                };

                // Add imageSize for Pro models if provided
                if (imageSize) {
                    imageConfig.imageSize = imageSize;
                }

                // Call Google Gemini REST API directly
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: parts
                            }
                        ],
                        generationConfig: {
                            responseModalities: ["IMAGE"],
                            imageConfig: imageConfig
                        }
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Google API Error:', errorText);
                    throw new Error(`Google API Error: ${response.status} ${errorText}`);
                }

                const result = await response.json();

                // Check for safety blocks
                if (result.promptFeedback?.blockReason) {
                    console.warn(`Blocked by safety filters: ${result.promptFeedback.blockReason}`);
                    throw new Error(`SAFETY_VIOLATION: Content blocked by safety filters (${result.promptFeedback.blockReason})`);
                }

                if (result.candidates && result.candidates[0]?.finishReason === 'SAFETY') {
                    console.warn('Blocked by safety filters (finishReason: SAFETY)');
                    throw new Error('SAFETY_VIOLATION: Content blocked by safety filters.');
                }

                // Extract generated image from response
                let imageBlob: Blob | null = null;
                let extension = 'png';

                if (result.candidates && result.candidates[0].content.parts) {
                    for (const part of result.candidates[0].content.parts) {
                        if (part.inlineData) {
                            console.log('Found inline Base64 image data');
                            const base64Data = part.inlineData.data;
                            const mimeType = part.inlineData.mimeType || 'image/png';

                            const binString = atob(base64Data);
                            const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
                            imageBlob = new Blob([bytes], { type: mimeType });

                            if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
                            break;
                        }
                    }
                }

                if (!imageBlob) {
                    console.error('Full Response:', JSON.stringify(result));
                    throw new Error('El modelo completó la tarea pero no devolvió datos de imagen visualizables.');
                }

                // Upload to Supabase Storage
                const fileName = `${Date.now()}_gemini.${extension}`;
                const { error: uploadError } = await supabase.storage
                    .from('generated-images')
                    .upload(fileName, imageBlob, { contentType: imageBlob.type, upsert: false });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('generated-images')
                    .getPublicUrl(fileName);

                // Deduct credits
                const { data: remainingBalance } = await supabase.rpc('deduct_team_credits', { amount: 1 });

                return new Response(
                    JSON.stringify({ imageUrl: publicUrl, model: model, credits: remainingBalance }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );

            } catch (genError: any) {
                console.error('Error en generación:', genError);
                throw new Error(genError.message || 'Error desconocido al procesar la solicitud con Gemini.');
            }
        }

        // Default: xAI (Grok)
        const XAI_API_KEY = Deno.env.get('XAI_API_KEY')
        if (!XAI_API_KEY) throw new Error('XAI_API_KEY not set')

        console.log('Calling xAI API with model:', model);
        const response = await fetch('https://api.x.ai/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${XAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                model: model,
                response_format: "b64_json"
            }),
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error('xAI API Error:', errorText);
            throw new Error(`xAI API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json()
        const imageB64 = data.data[0].b64_json

        const fileName = `${Date.now()}_grok.png`
        const binString = atob(imageB64)
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!)

        const { error: uploadError } = await supabase.storage
            .from('generated-images')
            .upload(fileName, bytes, {
                contentType: 'image/png',
                upsert: false
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('generated-images')
            .getPublicUrl(fileName)

        const { data: remainingBalance } = await supabase.rpc('deduct_team_credits', { amount: 1 });

        return new Response(
            JSON.stringify({ imageUrl: publicUrl, model: model, credits: remainingBalance }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function Error:', error);
        // Return 200 with error message so client can parse it easily
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
