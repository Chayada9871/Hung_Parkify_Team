import sql from '../../../config/db';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  console.log('📥 Incoming GET /api/getUserKeys');

  // 🛡️ Inline JWT verification function
  const verifyJWT = async (req) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.split(' ')[1];
    const decodedUnverified = jwt.decode(token);
    if (!decodedUnverified || !decodedUnverified.user_id) {
      return { isValid: false, error: 'Invalid token format' };
    }

    const userId = decodedUnverified.user_id;

    try {
      const result = await sql`
        SELECT public_key FROM user_keys WHERE user_id = ${userId}
      `;

      if (result.length === 0) {
        return { isValid: false, error: 'Public key not found for user' };
      }

      const publicKey = result[0].public_key;
      const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

      return { isValid: true, user: decoded };
    } catch (err) {
      console.error('❌ JWT verification error:', err);
      return { isValid: false, error: 'Token verification failed' };
    }
  };

  // Step 1: Extract and verify token
  const jwtCheck = await verifyJWT(req);
  console.log('🔑 JWT Verification:', jwtCheck);

  if (!jwtCheck.isValid) {
    console.log('❌ JWT Invalid or Expired:', jwtCheck.error);
    return new Response(JSON.stringify({ error: jwtCheck.error }), { status: 401 });
  }

  const userId = jwtCheck.user.user_id;
  console.log('✅ Extracted user_id from JWT:', userId);

  try {
    // Step 2: Query decrypted keys from user_keys
    console.log('🔍 Querying user_keys for decrypted private_key and session_key...');
    const result = await sql`
      SELECT 
        pgp_sym_decrypt(private_key::bytea, 'parkify-master-secret') AS private_key,
        pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
      FROM user_keys
      WHERE user_id = ${userId}
    `;

    console.log('📦 Query Result:', result);

    if (result.length === 0) {
      console.log(`❌ No keys found for user_id ${userId}`);
      return new Response(JSON.stringify({ error: 'User keys not found' }), { status: 404 });
    }

    const { private_key, session_key } = result[0];

    // Step 3: Send back the keys
    console.log('✅ Keys successfully retrieved and ready to send');
    console.log('🛡️ Truncated Private Key (first 50 chars):', private_key.slice(0, 50));
    console.log('🗝️ AES Key (hex):', session_key);

    return new Response(
      JSON.stringify({
        privateKey: private_key,
        sessionKey: session_key
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('❌ Error fetching keys from DB:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
