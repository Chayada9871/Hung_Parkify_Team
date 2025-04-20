import { v4 as uuidv4 } from 'uuid';
import supabase from '../../../config/supabaseClient';
import sql from '../../../config/db';

export async function POST(req) {
  console.log("Supabase instance:", supabase);
  console.log("Supabase storage:", supabase?.storage);

  if (!supabase || !supabase.storage) {
    return new Response(JSON.stringify({ error: "Supabase client or storage not initialized" }), { status: 500 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const storageBucket = 'lessor_image'; 
    const lessorId = formData.get('lessorId');
    const oldImagePath = formData.get('oldImagePath');

    if (!file || !lessorId) {
      console.error("File or Lessor ID missing:", { file, lessorId });
      return new Response(JSON.stringify({ error: 'File and lessor ID are required' }), { status: 400 });
    }

    console.log("File received:", file.name, "Lessor ID:", lessorId);

    if (oldImagePath) {
      const { error: deleteError } = await supabase.storage.from(storageBucket).remove([oldImagePath]);
      if (deleteError) {
        console.error("Error deleting old image:", deleteError.message);
        return new Response(JSON.stringify({ error: 'Error deleting old image' }), { status: 500 });
      }
    }

    const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(fileName, file);

    if (uploadError) {
      console.error("Upload Error:", uploadError.message);
      return new Response(JSON.stringify({ error: 'Error uploading file' }), { status: 500 });
    }

    const { data: urlData, error: urlError } = supabase.storage.from(storageBucket).getPublicUrl(fileName);

    if (urlError || !urlData?.publicUrl) {
      console.error("Error generating public URL:", urlError?.message);
      return new Response(JSON.stringify({ error: 'Failed to generate public URL' }), { status: 500 });
    }

    const publicUrl = urlData.publicUrl;

    console.log("Updating database for Lessor ID:", lessorId, "with URL:", publicUrl);

    const updateResult = await sql`
      UPDATE lessor
      SET lessor_profile_pic = ${publicUrl}
      WHERE lessor_id = ${lessorId}
      RETURNING lessor_id
    `;

    if (updateResult.length === 0) {
      throw new Error('Failed to update file metadata in the database');
    }

    return new Response(JSON.stringify({ publicUrl, lessorId: updateResult[0].lessor_id }), { status: 200 });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: 'Error uploading file or saving metadata', details: error.message }), {
      status: 500
    });
  }
}
