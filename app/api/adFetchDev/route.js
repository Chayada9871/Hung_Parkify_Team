// app/api/adFetchDeveloper/route.js
import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { encryptAES, decryptAES } from '/utils/crypto';

const PUBLIC_KEY = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

// ✅ JWT Validator
async function validateJWT(req, requiredRole = 'admin') {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { isValid: false, error: 'Authentication token is missing' };
  }

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
    if (requiredRole && decoded.role !== requiredRole) {
      return { isValid: false, error: 'Access denied: insufficient permissions' };
    }
    return { isValid: true, user: decoded };
  } catch (err) {
    console.error('❌ JWT Error:', err.message);
    return { isValid: false, error: 'Invalid or expired token' };
  }
}

// 🔍 GET: Fetch developers (all or by ID)
export async function GET(req) {
  const auth = await validateJWT(req);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const developerId = searchParams.get('developerId');

    const result = developerId
      ? await sql`SELECT developer_id, email FROM developer WHERE developer_id = ${developerId}`
      : await sql`SELECT developer_id, email FROM developer`;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'No developers found' }), { status: 404 });
    }

    const decrypted = result.map(dev => ({
      developer_id: dev.developer_id,
      email: decryptAES(dev.email),
    }));

    return new Response(JSON.stringify({ developers: decrypted }), { status: 200 });
  } catch (err) {
    console.error('❌ DB Error in GET:', err);
    return new Response(JSON.stringify({ error: 'Error fetching developers' }), { status: 500 });
  }
}

// 📝 POST: Add new developer
export async function POST(req) {
  const auth = await validateJWT(req);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
    }

    const encryptedEmail = encryptAES(email);

    const insert = await sql`
      INSERT INTO developer (email)
      VALUES (${encryptedEmail})
      RETURNING developer_id
    `;

    return new Response(JSON.stringify({
      message: 'Developer created successfully',
      developer_id: insert[0].developer_id,
    }), { status: 201 });
  } catch (err) {
    console.error('❌ POST Error:', err);
    return new Response(JSON.stringify({ error: 'Error creating developer' }), { status: 500 });
  }
}

// ❌ DELETE: Remove developer
export async function DELETE(req) {
  const auth = await validateJWT(req);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const developerId = searchParams.get('developerId');

    if (!developerId) {
      return new Response(JSON.stringify({ error: 'Developer ID is required' }), { status: 400 });
    }

    const deleted = await sql`
      DELETE FROM developer WHERE developer_id = ${developerId}
      RETURNING developer_id
    `;

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: 'Developer not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Developer deleted successfully' }), { status: 200 });
  } catch (err) {
    console.error('❌ DELETE Error:', err);
    return new Response(JSON.stringify({ error: 'Error deleting developer', details: err.message }), { status: 500 });
  }
}
