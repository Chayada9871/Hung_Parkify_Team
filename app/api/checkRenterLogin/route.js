import sql from '../../../config/db';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // ✅ Check input
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔐 Query user and decrypt credentials
    const userData = await sql`
      SELECT
        u.user_id,
        u.email,
        pgp_sym_decrypt(u.password::bytea, 'parkify-secret') AS decrypted_password,
        pgp_sym_decrypt(k.private_key::bytea, 'parkify-master-secret') AS private_key,
        pgp_sym_decrypt(k.encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
      FROM user_info u
      JOIN user_keys k ON u.user_id = k.user_id
      WHERE u.email = ${email}
    `;

    if (userData.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = userData[0];

    // 🔐 Validate password
    if (password !== user.decrypted_password) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ✅ Generate JWT using user's private RSA key
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: 'renter' },
      user.private_key,
      { algorithm: 'RS256', expiresIn: '2h' }
    );

    console.log('🪪 JWT token created for:', user.email);

    return new Response(
      JSON.stringify({
      message: 'Login successful',
      user_id: user.user_id,
      token,
      sessionKey: user.session_key, // ✅ AES key decrypted
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

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