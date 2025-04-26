// ================================================
// 🔐 ADMIN Lessor Management API with JWT Verification
// ================================================

import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const publicKey = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

// Middleware to validate JWT and check for admin role
async function validateJWT(req, requiredRole) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    console.log('✅ Decoded Token:', decoded);

    if (requiredRole && decoded.role !== requiredRole) {
      return { isValid: false, error: 'Access denied: insufficient permissions' };
    }

    return { isValid: true, user: decoded };
  } catch (error) {
    console.error('❌ JWT Error:', error.message);
    return { isValid: false, error: 'Invalid or expired token' };
  }
}

// ------------------- GET -------------------
export async function GET(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lessorId = searchParams.get('lessor_id');

  try {
    let lessorResult;
    if (lessorId) {
      lessorResult = await sql`
        SELECT 
          lessor_id,
          lessor_firstname,
          lessor_lastname,
          lessor_phone_number,
          lessor_line_url,
          lessor_email,
          lessor_password,
          lessor_profile_pic
        FROM lessor
        WHERE lessor_id = ${lessorId}
      `;
    } else {
      lessorResult = await sql`
        SELECT 
          lessor_id,
          lessor_firstname,
          lessor_lastname,
          lessor_phone_number,
          lessor_line_url,
          lessor_email,
          lessor_password,
          lessor_profile_pic
        FROM lessor
      `;
    }

    if (lessorResult.length === 0) {
      return new Response(JSON.stringify({ error: 'No lessors found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ lessorDetails: lessorResult }), { status: 200 });
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
  }
}

// ------------------- PUT -------------------
export async function PUT(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  try {
    const {
      lessor_id,
      lessor_firstname,
      lessor_lastname,
      lessor_phone_number,
      lessor_line_url,
      lessor_email
    } = await req.json();

    if (!lessor_id) {
      return new Response(JSON.stringify({ error: 'Lessor ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (lessor_firstname) updateData.lessor_firstname = lessor_firstname;
    if (lessor_lastname) updateData.lessor_lastname = lessor_lastname;
    if (lessor_phone_number) updateData.lessor_phone_number = lessor_phone_number;
    if (lessor_line_url) updateData.lessor_line_url = lessor_line_url;
    if (lessor_email) updateData.lessor_email = lessor_email;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    const updatedRecord = await sql`
      UPDATE lessor
      SET ${sql(updateData)}
      WHERE lessor_id = ${lessor_id}::bigint
      RETURNING *;
    `;

    if (updatedRecord.length === 0) {
      return new Response(JSON.stringify({ error: 'No record found for the given Lessor ID' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Lessor information updated successfully', data: updatedRecord[0] }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating data', details: error.message }), { status: 500 });
  }
}

// ------------------- DELETE -------------------
export async function DELETE(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { lessor_id } = await req.json();

  if (!lessor_id) {
    return new Response(JSON.stringify({ error: 'Lessor ID is required' }), { status: 400 });
  }

  try {
    const deleteResult = await sql`
      DELETE FROM lessor
      WHERE lessor_id = ${lessor_id}
      RETURNING lessor_id;
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Lessor not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Lessor deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(JSON.stringify({ error: 'Error deleting lessor', details: error.message }), { status: 500 });
  }
}
