// app/api/register/route.js
import sql from '../../../config/db';

export async function POST(req) {
  try {
    const { firstName, lastName, email, phoneNumber, password } = await req.json();

    // Check if all required fields are present
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    // Check if phone number already exists
    const phoneCheckResult = await sql`
      SELECT user_id FROM user_info WHERE phone_number = ${phoneNumber}
    `;
    if (phoneCheckResult.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Phone number already exists. Please use a different phone number.' }),
        { status: 400 }
      );
    }

    // Insert the new renter into the database
    const insertResult = await sql`
      INSERT INTO user_info (first_name, last_name, email, phone_number, password)
      VALUES (${firstName}, ${lastName}, ${email}, ${phoneNumber}, pgp_sym_encrypt(${password},'parkify-secret'))
      RETURNING user_id
    `;


    if (insertResult.length === 0) {
      return new Response(
        JSON.stringify({ error: 'An error occurred while registering. Please try again.' }),
        { status: 500 }
      );
    }

    const userId = insertResult[0].user_id;

    // Return the new user's ID
    return new Response(JSON.stringify({ message: 'Registration successful!', userId }), { status: 200 });
  } catch (error) {
    console.error('Registration Error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500 }
    );
  }
}