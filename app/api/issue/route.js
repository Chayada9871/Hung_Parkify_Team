import sql from '../../../config/db';
import { decryptAES } from '/utils/crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const PUBLIC_KEY = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

async function validateJWT(req, allowedRoles = ['admin', 'developer']) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { isValid: false, error: 'Missing token' };
  }

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });

    if (!allowedRoles.includes(decoded.role)) {
      return { isValid: false, error: 'Access denied: insufficient permissions' };
    }

    return { isValid: true, user: decoded };
  } catch (error) {
    console.error('❌ JWT Error:', error.message);
    return { isValid: false, error: 'Invalid or expired token' };
  }
}

// ========================
// 🔍 GET issue by ID
// ========================
export async function GET(req) {
  const auth = await validateJWT(req);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const issueId = searchParams.get('issueId');

  if (!issueId) {
    return new Response(JSON.stringify({ error: 'No issue ID provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await sql`
      SELECT * FROM issue WHERE issue_id = ${parseInt(issueId, 10)}
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'No issue found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const issue = result[0];
    const decrypted = {
      ...issue,
      issue_header: issue.issue_header ? decryptAES(issue.issue_header) : null,
      issue_detail: issue.issue_detail ? decryptAES(issue.issue_detail) : null,
    };

    return new Response(JSON.stringify(decrypted), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error fetching issue:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while fetching issue details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ========================
// ✏️ PUT: Update issue status
// ========================
export async function PUT(req) {
  const auth = await validateJWT(req, ['developer']);
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { issue_id, new_status, developer_email } = await req.json();

    if (!issue_id || !new_status) {
      return new Response(JSON.stringify({ error: 'Issue ID and status are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resolvedByValue = new_status === 'Not Started' ? null : developer_email;

    const result = await sql`
      UPDATE issue
      SET status = ${new_status}, resolved_by = ${resolvedByValue}
      WHERE issue_id = ${parseInt(issue_id, 10)}
      RETURNING *
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to update issue or issue not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = result[0];
    const decrypted = {
      ...updated,
      issue_header: updated.issue_header ? decryptAES(updated.issue_header) : null,
      issue_detail: updated.issue_detail ? decryptAES(updated.issue_detail) : null,
    };

    return new Response(JSON.stringify(decrypted), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error updating issue:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while updating issue' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
