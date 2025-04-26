import sql from '../../../config/db';
import { encryptAESWithKey, verifyJWT } from '/utils/auth'; // ✅ Adjust paths as needed

export async function POST(req) {
  try {
    // 🔐 Step 1: Verify JWT
    const jwtVerification = await verifyJWT(req);
    if (!jwtVerification.isValid) {
      return new Response(JSON.stringify({ error: jwtVerification.error }), { status: 401 });
    }

    const sessionKey = jwtVerification.sessionKey;

    // 📥 Step 2: Parse incoming data
    const { complain, detail, userId } = await req.json();

    // 🛡️ Step 3: Validate required fields
    if (!complain || !detail || !userId) {
      console.error('❌ Validation failed: Missing fields', { complain, detail, userId });
      return new Response(JSON.stringify({ error: 'All fields are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔐 Step 4: Encrypt fields using the session key
    const encryptedComplain = encryptAESWithKey(complain, sessionKey);
    const encryptedDetail = encryptAESWithKey(detail, sessionKey);

    // 💾 Step 5: Insert encrypted data into the database (no signature)
    const insertResult = await sql`
      INSERT INTO complain (
        submitter_id, complain, detail, user_type
      )
      VALUES (
        ${userId}, ${encryptedComplain}, ${encryptedDetail}, 'renter'
      )
      RETURNING complain_id
    `;

    if (insertResult.length === 0) {
      throw new Error('❌ Database insertion failed');
    }

    return new Response(JSON.stringify({
      message: 'Complaint submitted successfully',
      id: insertResult[0].complain_id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error submitting complaint:', error);
    return new Response(JSON.stringify({
      error: 'An error occurred while submitting your complaint',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
