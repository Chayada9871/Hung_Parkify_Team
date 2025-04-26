import sql from '../../../config/db';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔍 Fetch lessor credentials and keys
    const lessorData = await sql`
      SELECT
        l.lessor_id,
        l.lessor_email,
        pgp_sym_decrypt(l.lessor_password::bytea, 'parkify-secret') AS decrypted_password,
        pgp_sym_decrypt(k.private_key::bytea, 'parkify-master-secret') AS private_key,
        pgp_sym_decrypt(k.encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
      FROM lessor l
      JOIN lessor_keys k ON l.lessor_id = k.lessor_id
      WHERE l.lessor_email = ${email}
    `;

    if (lessorData.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lessor = lessorData[0];

    if (password !== lessor.decrypted_password) {
      return new Response(JSON.stringify({ error: 'Invalid email or password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🪪 Sign JWT with the lessor's private RSA key
    const token = jwt.sign(
      {
        lessor_id: lessor.lessor_id,
        email: lessor.lessor_email,
        role: 'lessor',
      },
      lessor.private_key,
      { algorithm: 'RS256', expiresIn: '2h' }
    );

    console.log('🪪 JWT token created for:', lessor.lessor_email);
    console.log('🛡️ JWT Token:', token);

    return new Response(
      JSON.stringify({
        message: 'Login successful',
        lessor_id: lessor.lessor_id,
        token,
        sessionKey: lessor.session_key, // 🔐 Encrypted AES session key
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Lessor login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
