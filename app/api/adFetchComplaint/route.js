import sql from '../../../config/db';
import {
  encryptAESWithKey,
  decryptAESWithKey,
  verifyJWT
} from '/utils/auth'; // Adjust if needed
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const publicKey = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

// 🔐 Validate JWT and role
async function validateJWT(req, requiredRole) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    if (requiredRole && decoded.role !== requiredRole) {
      return { isValid: false, error: 'Access denied: insufficient permissions' };
    }
    return { isValid: true, user: decoded };
  } catch (error) {
    return { isValid: false, error: 'Invalid or expired token' };
  }
}

// ------------------- GET: Admin Fetch Complaints -------------------
export async function GET(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const complainId = searchParams.get('complainId');

  try {
    const complaintsResult = complainId
      ? await sql`
        SELECT complain_id, complain, detail, submitter_id, user_type
        FROM complain
        WHERE complain_id = ${complainId}
      `
      : await sql`
        SELECT complain_id, complain, detail, submitter_id, user_type
        FROM complain
      `;

    if (complaintsResult.length === 0) {
      return new Response(JSON.stringify({ error: 'No complaints found' }), { status: 404 });
    }

    const decryptedComplaints = [];

    for (const c of complaintsResult) {
      const keyResult = await sql`
        SELECT pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
        FROM user_keys
        WHERE user_id = ${c.submitter_id}
      `;

      if (keyResult.length === 0) {
        console.warn(`⚠️ Skipped complaint ${c.complain_id}: missing session key for user_id ${c.submitter_id}`);
        continue;
      }

      const sessionKey = keyResult[0].session_key;

      decryptedComplaints.push({
        complain_id: c.complain_id,
        submitter_id: c.submitter_id,
        user_type: c.user_type,
        complain: decryptAESWithKey(c.complain, sessionKey),
        detail: decryptAESWithKey(c.detail, sessionKey),
      });
    }

    return new Response(JSON.stringify({ complaints: decryptedComplaints }), { status: 200 });

  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data', details: error.message }), { status: 500 });
  }
}

// ------------------- PUT: Admin Update Complaint -------------------
export async function PUT(req) {
  try {
    const authResult = await validateJWT(req, 'admin');
    if (!authResult.isValid) {
      return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
    }

    const { complain_id, complain, detail } = await req.json();

    if (!complain_id || !complain || !detail) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    // Step 1: Fetch submitter_id from the complaint
    const existing = await sql`
      SELECT submitter_id FROM complain WHERE complain_id = ${complain_id}
    `;

    if (existing.length === 0) {
      return new Response(JSON.stringify({ error: 'Complaint not found' }), { status: 404 });
    }

    const submitterId = existing[0].submitter_id;

    // Step 2: Retrieve that user's session key
    const keyResult = await sql`
      SELECT pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
      FROM user_keys
      WHERE user_id = ${submitterId}
    `;

    if (keyResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Session key not found for submitter' }), { status: 403 });
    }

    const sessionKey = keyResult[0].session_key;

    // Step 3: Encrypt updated values
    const encryptedComplain = encryptAESWithKey(complain, sessionKey);
    const encryptedDetail = encryptAESWithKey(detail, sessionKey);

    // Step 4: Update the database
    await sql`
      UPDATE complain
      SET complain = ${encryptedComplain},
          detail = ${encryptedDetail}
      WHERE complain_id = ${complain_id}
    `;

    return new Response(JSON.stringify({ message: 'Complaint updated successfully' }), { status: 200 });

  } catch (error) {
    console.error('❌ Error updating complaint:', error);
    return new Response(JSON.stringify({ error: 'Error updating complaint', details: error.message }), { status: 500 });
  }
}

// ------------------- DELETE: Admin Remove Complaint -------------------
export async function DELETE(req) {
  try {
    const authResult = await validateJWT(req, 'admin');
    if (!authResult.isValid) {
      return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const complainId = searchParams.get('complainId');

    if (!complainId) {
      return new Response(JSON.stringify({ error: 'Complaint ID is required' }), { status: 400 });
    }

    const deleteResult = await sql`
      DELETE FROM complain
      WHERE complain_id = ${complainId}
      RETURNING complain_id
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Complaint not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Complaint deleted successfully' }), { status: 200 });

  } catch (error) {
    console.error('❌ Error deleting complaint:', error);
    return new Response(JSON.stringify({ error: 'Error deleting complaint', details: error.message }), { status: 500 });
  }
}
