// pages/api/updateCar.js

import sql from '../../../config/db';
import { encryptAES, decryptAES } from '/utils/crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// 📂 Load RSA Public Key for verifying JWT
const publicKey = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

// 🔐 Verify JWT token helper
async function verifyAdminToken(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) return { valid: false, error: 'Authorization token missing' };

  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    if (decoded.role !== 'admin') {
      return { valid: false, error: 'Access denied: not an admin' };
    }
    return { valid: true, user: decoded };
  } catch (err) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

export async function GET(req) {
  const auth = await verifyAdminToken(req);
  if (!auth.valid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const car_id = searchParams.get('car_id');

  if (!car_id) {
    return new Response(JSON.stringify({ error: 'Car ID is required' }), { status: 400 });
  }

  try {
    const carData = await sql`
      SELECT car_id, user_id, car_model, car_color, license_plate, carimage
      FROM car
      WHERE car_id = ${car_id}
    `;

    if (carData.length === 0) {
      return new Response(JSON.stringify({ error: 'Car not found' }), { status: 404 });
    }

    const car = carData[0];
    const decryptedCar = {
      ...car,
      car_model: decryptAES(car.car_model),
      car_color: decryptAES(car.car_color),
      license_plate: decryptAES(car.license_plate),
      carimage: car.carimage // if stored encrypted, apply decryptAES here too
    };

    return new Response(JSON.stringify({ car: decryptedCar }), { status: 200 });
  } catch (error) {
    console.error('Fetch Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching car data', details: error.message }), { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await verifyAdminToken(req);
  if (!auth.valid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  try {
    const { carId, carModel, carColor, licensePlate } = await req.json();

    if (!carId) {
      return new Response(JSON.stringify({ error: 'Car ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (carModel) updateData.car_model = encryptAES(carModel);
    if (carColor) updateData.car_color = encryptAES(carColor);
    if (licensePlate) updateData.license_plate = encryptAES(licensePlate);

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    await sql`
      UPDATE car
      SET ${sql(updateData)}
      WHERE car_id = ${carId}
    `;

    return new Response(JSON.stringify({ message: 'Car information updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating data' }), { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await verifyAdminToken(req);
  if (!auth.valid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  const { car_id } = await req.json();

  if (!car_id) {
    console.error('Delete Error: Car ID is required');
    return new Response(JSON.stringify({ error: 'Car ID is required' }), { status: 400 });
  }

  try {
    console.log(`Attempting to delete car with ID: ${car_id}`);

    const deleteResult = await sql`
      DELETE FROM car WHERE car_id = ${car_id}
      RETURNING car_id
    `;

    if (deleteResult.length === 0) {
      console.error(`Delete Error: Car with ID ${car_id} not found`);
      return new Response(JSON.stringify({ error: 'Car not found or could not be deleted' }), { status: 404 });
    }
    console.log(`Car with ID ${car_id} deleted successfully`);
    return new Response(JSON.stringify({ message: 'Car deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(JSON.stringify({ error: 'Error deleting car', details: error.message }), { status: 500 });
  }
}