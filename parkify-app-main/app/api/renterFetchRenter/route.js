// app/api/fetchRenter/route.js
import sql from '../../../config/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const renterId = searchParams.get('renterId');


  if (!renterId) {
    console.log("Renter ID missing in request.");
    return new Response(JSON.stringify({ error: "Renter ID is required" }), { status: 400 });
  }

  try {
    const renterResult = await sql`
      SELECT user_id, first_name, last_name, phone_number, email, password
      FROM user_info
      WHERE user_id = ${renterId}
    `;


    if (renterResult.length === 0) {
      console.log("No renter found for ID:", renterId);
      return new Response(JSON.stringify({ error: "Renter not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ renterDetails: renterResult[0] }), { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return new Response(JSON.stringify({ error: "Error fetching data" }), { status: 500 });
  }
}


// app/api/fetchRenter/route.js

export async function PUT(req) {
  try {
    const {
      user_id,
      first_name,
      last_name,
      phone_number,
      email,
      password,
    } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Renter ID is required" }),
        { status: 400 }
      );
    }

    // Prepare data for updating
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone_number) updateData.phone_number = phone_number;
    if (email) updateData.email = email;
    if (password) {
      const encryptedPasswordResult = await sql`
          SELECT pgp_sym_encrypt(${password}, 'parkify-secret') AS encrypted_password;
        `;
      updateData.password = encryptedPasswordResult[0].encrypted_password;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one field must be updated" }),
        { status: 400 }
      );
    }

    await sql`
          UPDATE user_info
          SET ${sql(updateData)}
          WHERE user_id = ${user_id}
      `;

    return new Response(
      JSON.stringify({ message: "Renter updated successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Error:", error);
    return new Response(
      JSON.stringify({ error: "Error updating data" }),
      { status: 500 }
    );
  }
}



// DELETE Renter
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const renterId = searchParams.get('renterId');

  if (!renterId) {
    return new Response(JSON.stringify({ error: 'Renter ID is required' }), { status: 400 });
  }

  try {
    const deleteResult = await sql`
      DELETE FROM user_info WHERE user_id = ${renterId}
      RETURNING user_id
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Renter not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Renter deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error deleting renter',
        details: error.message,
      }),
      { status: 500 }
    );
  }
}