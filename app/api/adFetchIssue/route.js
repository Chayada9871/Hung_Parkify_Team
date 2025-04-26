// app/api/adFetchIssue/route.js
import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { encryptAES, decryptAES } from '/utils/crypto'; // 🔐 AES utils

// 🔑 Load RSA public key
const PUBLIC_KEY = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

// ✅ JWT Validation Middleware
async function validateJWT(req, requiredRoles = ['admin', 'developer']) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { isValid: false, error: 'Authentication token is missing' };
  }

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });

    if (!requiredRoles.includes(decoded.role)) {
      return { isValid: false, error: 'Access denied: insufficient permissions' };
    }

    return { isValid: true, user: decoded };
  } catch (error) {
    console.error('❌ JWT Error:', error.message);
    return { isValid: false, error: 'Invalid or expired token' };
  }
}


// 🔍 GET: Fetch all or one issue with decryption
export async function GET(req) {
  const auth = await validateJWT(req);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const issueId = searchParams.get('issue_id');

  try {
    const result = issueId
      ? await sql`SELECT * FROM issue WHERE issue_id = ${issueId}`
      : await sql`SELECT * FROM issue`;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'No issues found' }), { status: 404 });
    }

    const decrypted = result.map((issue) => ({
      ...issue,
      issue_header: decryptAES(issue.issue_header),
      issue_detail: decryptAES(issue.issue_detail),
    }));

    return new Response(JSON.stringify({ issues: decrypted }), { status: 200 });
  } catch (err) {
    console.error('GET Error:', err);
    return new Response(JSON.stringify({ error: 'Error fetching issues' }), { status: 500 });
  }
}

// ✏️ PUT: Update an issue (AES re-encryption included)
export async function PUT(req) {
  const auth = await validateJWT(req);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  try {
    const { issue_id, issue_header, issue_detail, resolved_by, status } = await req.json();

    if (!issue_id) {
      return new Response(JSON.stringify({ error: 'ISSUE ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (issue_header) updateData.issue_header = encryptAES(issue_header);
    if (issue_detail) updateData.issue_detail = encryptAES(issue_detail);
    if (resolved_by) updateData.resolved_by = resolved_by;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    const updated = await sql`
      UPDATE issue
      SET ${sql(updateData)}
      WHERE issue_id = ${issue_id}
      RETURNING issue_id
    `;

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: 'Issue not found or could not be updated' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Issue updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('PUT Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating issue', details: error.message }), { status: 500 });
  }
}

// ❌ DELETE: Remove issue
export async function DELETE(req) {
  const auth = await validateJWT(req);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const issue_id = searchParams.get('issue_id');

  if (!issue_id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), { status: 400 });
  }

  try {
    const deleted = await sql`
      DELETE FROM issue
      WHERE issue_id = ${issue_id}
      RETURNING issue_id
    `;

    if (deleted.length === 0) {
      return new Response(JSON.stringify({ error: 'Issue not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Issue deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return new Response(JSON.stringify({ error: 'Error deleting issue', details: error.message }), { status: 500 });
  }
}

// ➕ POST: Add new issue
export async function POST(req) {
  const auth = await validateJWT(req, ['admin']);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  try {
    const { issue_header, issue_detail, admin_id, status } = await req.json();

    if (!issue_header || !issue_detail || !admin_id || !status) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    // Encrypt fields
    const encryptedHeader = encryptAES(issue_header);
    const encryptedDetail = encryptAES(issue_detail);

    const insertResult = await sql`
      INSERT INTO issue (issue_header, issue_detail, admin_id, status)
      VALUES (${encryptedHeader}, ${encryptedDetail}, ${admin_id}, ${status})
      RETURNING issue_id
    `;

    return new Response(
      JSON.stringify({
        message: 'Issue created successfully',
        issue_id: insertResult[0].issue_id,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error creating issue', details: error.message }),
      { status: 500 }
    );
  }
}

