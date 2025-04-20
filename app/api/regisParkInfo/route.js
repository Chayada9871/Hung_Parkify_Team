// app/api/registerParkInfo/route.js
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../../config/supabaseClient';
import sql from '../../../config/db';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const lessorId = formData.get('lessorId');
    const locationName = formData.get('locationName');
    const address = formData.get('address');
    const locationUrl = formData.get('locationUrl');
    const totalSlots = formData.get('totalSlots');
    const pricePerHour = formData.get('pricePerHour');
    const file = formData.get('locationImage'); // The uploaded image file

    // Validate required fields
    if (!lessorId || !locationName || !address || !locationUrl || !totalSlots || !pricePerHour || !file) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    // Upload the file to Supabase storage
    const fileName = `${uuidv4()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('carpark')
      .upload(fileName, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'File upload failed' }), { status: 500 });
    }

    // Generate a public URL for the uploaded image
    const { data: urlData, error: urlError } = supabase.storage
      .from('carpark')
      .getPublicUrl(fileName);

    if (urlError) {
      console.error('Error generating public URL:', urlError);
      return new Response(JSON.stringify({ error: 'Failed to generate public URL' }), { status: 500 });
    }

    // Insert parking lot data into the database
    const insertResult = await sql`
      INSERT INTO parking_lot (
        lessor_id,
        location_name,
        address,
        location_url,
        total_slots,
        available_slots,
        price_per_hour,
        location_image
      ) VALUES (
        ${lessorId},
        ${locationName},
        ${address},
        ${locationUrl},
        ${parseInt(totalSlots, 10)},
        ${parseInt(totalSlots, 10)}, -- Set available slots to total slots initially
        ${parseFloat(pricePerHour)},
        ${urlData.publicUrl}
      ) RETURNING parking_lot_id
    `;

    // Return the inserted record's ID
    return new Response(JSON.stringify({ parkingLotId: insertResult[0].parking_lot_id }), { status: 200 });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred during registration' }), { status: 500 });
  }
}
