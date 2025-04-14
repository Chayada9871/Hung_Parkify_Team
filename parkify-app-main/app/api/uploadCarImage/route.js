import supabase from '../../../config/supabaseClient';
import sql from '../../../config/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const storageBucket = formData.get("storageBucket");
        const carId = formData.get("car_id");

        if (!file || !storageBucket || !carId) {
            return new Response(
                JSON.stringify({ error: "File, storage bucket, and car ID are required" }),
                { status: 400 }
            );
        }

        // Upload file to Supabase storage
        const fileName = `${uuidv4()}.${file.name.split(".").pop()}`;
        const { data, error: uploadError } = await supabase.storage
            .from(storageBucket)
            .upload(fileName, file);

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            return new Response(JSON.stringify({ error: "Error uploading file" }), { status: 500 });
        }

        // Generate public URL
        const { publicUrl } = supabase.storage.from(storageBucket).getPublicUrl(fileName).data;

        if (!publicUrl) {
            console.error("Failed to retrieve public URL");
            return new Response(JSON.stringify({ error: "Failed to generate public URL" }), { status: 500 });
        }

        // Update database with image URL
        await sql`
            UPDATE car
            SET car_image = ${publicUrl}
            WHERE car_id = ${carId}
        `;

        return new Response(JSON.stringify({ publicUrl, carId }), { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: "Error uploading file or saving metadata" }),
            { status: 500 }
        );
    }
}
