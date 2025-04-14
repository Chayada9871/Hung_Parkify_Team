import sql from '../../../config/db';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }


    const userData = await sql`
   select
  lessor_id,
  lessor_email,
  pgp_sym_decrypt (lessor_password::bytea, 'parkify-secret') as decrypted_password
from
  lessor
where
  lessor_email = ${email};
    `;

    if (userData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const user = userData[0];
    const isPasswordValid = password === user.decrypted_password;

    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password.' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Login successful', lessor_id: user.lessor_id }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Database or server error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}