import sql from '../../../config/db';
import supabase from '../../../config/supabaseClient';

// GET: Fetch Lessor Details
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lessorId = searchParams.get('lessorId');

    if (!lessorId) {
      return new Response(
        JSON.stringify({ error: 'Lessor ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lessorResult = await sql`
      SELECT lessor_id, lessor_firstname, lessor_lastname, lessor_email, lessor_password, lessor_phone_number, lessor_line_url, lessor_profile_pic
      FROM lessor
      WHERE lessor_id = ${lessorId}
    `;


    if (lessorResult.length === 0) {
      console.log("No lessor found for ID:", lessorId);
      return new Response(JSON.stringify({ error: "Renter not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ lessorDetails: lessorResult[0] }), { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return new Response(JSON.stringify({ error: "Error fetching data" }), { status: 500 });
  }
}

// PUT: Update Lessor Details
export async function PUT(req) {
  try {
    const {
      lessor_id,
      lessor_firstname,
      lessor_lastname,
      lessor_email,
      lessor_password,
      lessor_phone_number,
      lessor_line_url,
      lessor_profile_pic,
    } = await req.json();

    if (!lessor_id) {
      return new Response(
        JSON.stringify({ error: "Lessor ID is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }



    const updateData = {};
    if (lessor_firstname) updateData.lessor_firstname = lessor_firstname;
    if (lessor_lastname) updateData.lessor_lastname = lessor_lastname;
    if (lessor_email) updateData.lessor_email = lessor_email;
    if (lessor_password) {
      const encryptedPasswordResult = await sql`
        SELECT pgp_sym_encrypt(${lessor_password}, 'parkify-secret') AS encrypted_password;
      `;
      updateData.lessor_password = encryptedPasswordResult[0].encrypted_password;
    }
    if (lessor_phone_number) updateData.lessor_phone_number = lessor_phone_number;
    if (lessor_line_url) updateData.lessor_line_url = lessor_line_url;
    if (lessor_profile_pic) updateData.lessor_profile_pic = lessor_profile_pic;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one field must be updated" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await sql`
      UPDATE lessor
      SET ${sql(updateData)}
      WHERE lessor_id = ${lessor_id}
    `;

    return new Response(
      JSON.stringify({ message: "Lessor updated successfully" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Update Error:", error);
    return new Response(
      JSON.stringify({ error: "Error updating data", details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE: Delete Lessor and Associated Image
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lessorId = searchParams.get('lessorId');

    if (!lessorId) {
      return new Response(
        JSON.stringify({ error: 'Lessor ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the image path before deletion
    const imageResult = await sql`
      SELECT lessor_profile_pic FROM lessor WHERE lessor_id = ${lessorId}
    `;
    const imagePath = imageResult[0]?.lessor_profile_pic;

    // Delete image from storage if it exists
    if (imagePath) {
      console.log('Attempting to delete image from storage:', imagePath);
      const { error: deleteError } = await supabase.storage
        .from('lessor_image') // Ensure this matches your actual storage bucket name
        .remove([imagePath]);

      if (deleteError) {
        console.error('Error deleting image from storage:', deleteError.message);
        return new Response(
          JSON.stringify({
            error: 'Error deleting image from storage',
            details: deleteError.message,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('No image path to delete from storage');
    }

    // Delete the lessor record
    const deleteResult = await sql`
      DELETE FROM lessor WHERE lessor_id = ${lessorId}
      RETURNING lessor_id
    `;

    if (deleteResult.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Lessor not found or could not be deleted' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Lessor deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error deleting lessor and image',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}