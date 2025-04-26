import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { encryptAES, decryptAES } from '/utils/crypto';

dotenv.config();

// 📂 Load RSA Public Key for verifying JWT
const publicKey = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

// ✅ Middleware: Validate JWT and check role
async function validateJWT(req, requiredRole) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return { isValid: false, error: 'Authentication token is missing' };
  }

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

// =========================================
// 📥 GET - Fetch parking lots
// =========================================
export async function GET(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parkingLotId = searchParams.get('parkingLotId');

  try {
    const parkingLotResult = parkingLotId
      ? await sql`
        SELECT parking_lot_id, lessor_id, location_name, address, location_url, total_slots, price_per_hour, location_image
        FROM parking_lot
        WHERE parking_lot_id = ${parkingLotId}
      `
      : await sql`
        SELECT parking_lot_id, lessor_id, location_name, address, location_url, total_slots, price_per_hour, location_image
        FROM parking_lot
      `;

    if (parkingLotResult.length === 0) {
      return new Response(JSON.stringify({ error: 'No parking lots found' }), { status: 404 });
    }

    const decryptedLots = parkingLotResult.map((lot) => ({
      ...lot,
      location_name: decryptAES(lot.location_name),
      address: decryptAES(lot.address),
      location_url: decryptAES(lot.location_url),
    }));

    return new Response(JSON.stringify({ parkingLotDetails: decryptedLots }), { status: 200 });
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    return new Response(JSON.stringify({ error: 'Error fetching data ' }), { status: 500 });
  }
}

// =========================================
// ✏️ PUT - Update parking lot details
// =========================================
export async function PUT(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  try {
    const {
      parkingLotId,
      locationName,
      address,
      locationUrl,
      totalSlots,
      pricePerHour,
      locationImage,
    } = await req.json();

    if (!parkingLotId) {
      return new Response(JSON.stringify({ error: 'Parking Lot ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (locationName) updateData.location_name = encryptAES(locationName);
    if (address) updateData.address = encryptAES(address);
    if (locationUrl) updateData.location_url = encryptAES(locationUrl);
    if (totalSlots) updateData.total_slots = totalSlots;
    if (pricePerHour) updateData.price_per_hour = pricePerHour;
    if (locationImage) updateData.location_image = locationImage;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    await sql`
      UPDATE parking_lot
      SET ${sql(updateData)}
      WHERE parking_lot_id = ${parkingLotId}
    `;

    return new Response(JSON.stringify({ message: 'Parking lot updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('❌ Update Error:', error.message);
    return new Response(JSON.stringify({ error: 'Error updating parking lot' }), { status: 500 });
  }
}

// =========================================
// ❌ DELETE - Delete parking lot
// =========================================
export async function DELETE(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parkingLotId = searchParams.get('parkingLotId');

  if (!parkingLotId) {
    return new Response(JSON.stringify({ error: 'Parking Lot ID is required' }), { status: 400 });
  }

  try {
    const deleteResult = await sql`
      DELETE FROM parking_lot
      WHERE parking_lot_id = ${parkingLotId}
      RETURNING parking_lot_id
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Parking lot not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Parking lot deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('❌ Delete Error:', error.message);
    return new Response(JSON.stringify({ error: 'Error deleting parking lot' }), { status: 500 });
  }
}