// api/uploadFile.js
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../../config/supabaseClient';
import sql from '../../../config/db';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const storageBucket = formData.get('storageBucket');
    const parkingLotIdRaw = formData.get('parkingLotId');
    const parkingLotId = parseInt(parkingLotIdRaw, 10); // ✅ แปลงให้แน่ใจว่าเป็นตัวเลข

    if (!file || !storageBucket || isNaN(parkingLotId)) {
      return new Response(JSON.stringify({ error: 'File, storage bucket, and parking lot ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Upload file to Supabase storage
    const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
    const { data, error: uploadError } = await supabase.storage.from(storageBucket).upload(fileName, file);

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return new Response(JSON.stringify({ error: 'Error uploading file' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate public URL
    const { publicUrl } = supabase.storage.from(storageBucket).getPublicUrl(fileName).data;

    if (!publicUrl) {
      console.error('Failed to retrieve public URL');
      return new Response(JSON.stringify({ error: 'Failed to generate public URL' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update database with image URL
    await sql`
      UPDATE parking_lot
      SET carpark = ${publicUrl}
      WHERE parking_lot_id = ${parkingLotId}
    `;

    return new Response(JSON.stringify({ publicUrl, parkingLotId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Error uploading file or saving metadata' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
