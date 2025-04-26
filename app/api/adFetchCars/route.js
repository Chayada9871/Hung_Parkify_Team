import sql from '../../../config/db';
import { decryptAESWithKey, verifyFieldSignature } from '/utils/auth'; // Adjust if needed
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const publicKey = fs.readFileSync(path.resolve('keys/public.pem'), 'utf8');

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

export async function GET(req) {
  const authResult = await validateJWT(req, 'admin');
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const carId = searchParams.get('car_id');

  try {
    let carResult;

    if (carId) {
      carResult = await sql`
        SELECT 
          car_id,
          user_id,
          carimage,
          car_model,
          car_color,
          license_plate,
          car_model_signature,
          car_color_signature,
          license_plate_signature
        FROM car
        WHERE car_id = ${carId}
      `;
    } else {
      carResult = await sql`
        SELECT 
          car_id,
          user_id,
          carimage,
          car_model,
          car_color,
          license_plate,
          car_model_signature,
          car_color_signature,
          license_plate_signature
        FROM car
      `;
    }

    console.log(`📦 Total cars fetched: ${carResult.length}`);

    if (carResult.length === 0) {
      return new Response(JSON.stringify({ error: 'No cars found' }), { status: 404 });
    }

    const decryptedCars = [];

    for (const car of carResult) {
      console.log(`🔍 Processing car_id: ${car.car_id} (user_id: ${car.user_id})`);

      const userKeys = await sql`
        SELECT 
          public_key, 
          pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
        FROM user_keys
        WHERE user_id = ${car.user_id}
      `;

      if (userKeys.length === 0) {
        console.warn(`⚠️ Skipped car_id ${car.car_id}: missing keys for user_id ${car.user_id}`);
        continue;
      }

      const { public_key, session_key } = userKeys[0];
      console.log(`🔑 Retrieved keys for user ${car.user_id}`);

      let decrypted_model, decrypted_color, decrypted_plate;
      try {
        decrypted_model = decryptAESWithKey(car.car_model, session_key);
        decrypted_color = decryptAESWithKey(car.car_color, session_key);
        decrypted_plate = decryptAESWithKey(car.license_plate, session_key);
        console.log(`✅ Decrypted car_id ${car.car_id}`);
      } catch (e) {
        console.error(`❌ Failed to decrypt car_id ${car.car_id}: ${e.message}`);
        continue;
      }

      const isModelValid = verifyFieldSignature(car.car_model_signature, decrypted_model, public_key);
      const isColorValid = verifyFieldSignature(car.car_color_signature, decrypted_color, public_key);
      const isPlateValid = verifyFieldSignature(car.license_plate_signature, decrypted_plate, public_key);
      console.log(`🔏 Signatures verified for car_id ${car.car_id}`);

      decryptedCars.push({
        car_id: car.car_id,
        user_id: car.user_id,
        carimage: car.carimage,
        car_model: decrypted_model,
        car_color: decrypted_color,
        license_plate: decrypted_plate,
        signatures_valid: {
          car_model: isModelValid,
          car_color: isColorValid,
          license_plate: isPlateValid,
        }
      });
    }

    console.log(`✅ Total cars processed and decrypted: ${decryptedCars.length}`);

    return new Response(JSON.stringify({ cars: decryptedCars }), { status: 200 });

  } catch (error) {
    console.error('❌ Admin Fetch Error:', error.message);
    return new Response(JSON.stringify({ error: 'Server error', details: error.message }), { status: 500 });
  }
}
