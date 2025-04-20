// app/api/registerInfo/route.js
import supabase from '../../../config/supabaseClient';
import sql from '../../../config/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const password = formData.get('password'); // Remember to hash in production
    const phoneNumber = formData.get('phoneNumber');
    const lineurl = formData.get('lineurl');
    const file = formData.get('profileImage');

    if (!firstName || !lastName || !email || !password || !phoneNumber || !lineurl || !file) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    const fileName = `${uuidv4()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lessor_image')
      .upload(fileName, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'File upload failed' }), { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('lessor_image')
      .getPublicUrl(fileName);

    const insertResult = await sql`

      INSERT INTO lessor (
        lessor_firstname, lessor_lastname, lessor_email, lessor_phone_number,
        lessor_password, lessor_line_url, lessor_profile_pic
      ) VALUES (
        ${firstName}, ${lastName}, ${email}, ${phoneNumber},pgp_sym_encrypt(${password},'parkify-secret'), ${lineurl}, ${urlData.publicUrl}
      ) RETURNING lessor_id
    `;


    return new Response(JSON.stringify({ lessorId: insertResult[0].lessor_id }), { status: 200 });
  }
  catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred during registration' }), { status: 500 });
  }
}