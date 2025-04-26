import sql from '../../../config/db';
import {
  decryptAESWithKey,
  verifyFieldSignature,
} from '/utils/auth';
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
  const resId = searchParams.get('reservation_id');

  try {
    let reservationResult;

    if (resId) {
      reservationResult = await sql`
        SELECT 
          reservation_id,
          user_id,
          car_id,
          parking_lot_id,
          reservation_date,
          start_time,
          end_time,
          total_price,
          duration_hour,
          duration_day,
          slot_number,
          start_time_signature,
          end_time_signature,
          total_price_signature,
          duration_hour_signature,
          duration_day_signature
        FROM reservation
        WHERE reservation_id = ${resId}
      `;
    } else {
      reservationResult = await sql`
        SELECT 
          reservation_id,
          user_id,
          car_id,
          parking_lot_id,
          reservation_date,
          start_time,
          end_time,
          total_price,
          duration_hour,
          duration_day,
          slot_number,
          start_time_signature,
          end_time_signature,
          total_price_signature,
          duration_hour_signature,
          duration_day_signature
        FROM reservation
      `;
    }

    console.log("📥 Total reservations fetched:", reservationResult.length);

    if (reservationResult.length === 0) {
      console.warn('⚠️ No reservation found in database');
      return new Response(JSON.stringify({ error: 'No reservations found' }), { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];
    const decryptedReservations = [];

    for (const r of reservationResult) {
      const userKeys = await sql`
        SELECT 
          public_key, 
          pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
        FROM user_keys
        WHERE user_id = ${r.user_id}
      `;

      if (userKeys.length === 0) {
        console.warn(`⚠️ Skipped reservation ${r.reservation_id}: missing keys for user ${r.user_id}`);
        continue;
      }

      const { public_key, session_key } = userKeys[0];
      console.log(`🔑 Retrieved keys for user ${r.user_id}`);

      const isStartValid = verifyFieldSignature(r.start_time, r.start_time_signature, public_key);
      const isEndValid = verifyFieldSignature(r.end_time, r.end_time_signature, public_key);
      const isTotalValid = verifyFieldSignature(r.total_price, r.total_price_signature, public_key);
      const isHourValid = verifyFieldSignature(r.duration_hour, r.duration_hour_signature, public_key);
      const isDayValid = verifyFieldSignature(r.duration_day, r.duration_day_signature, public_key);

      if (!isStartValid || !isEndValid || !isTotalValid || !isHourValid || !isDayValid) {
        console.warn(`❌ Signature check failed for reservation ${r.reservation_id}`);
        continue;
      }

      try {
        const startTime = decryptAESWithKey(r.start_time, session_key);
        const endTime = decryptAESWithKey(r.end_time, session_key);
        const totalPrice = parseFloat(decryptAESWithKey(r.total_price, session_key));
        const durationHour = parseFloat(decryptAESWithKey(r.duration_hour, session_key));
        const durationDay = parseInt(decryptAESWithKey(r.duration_day, session_key));

        const endDateOnly = endTime.split("T")[0];
        if (endDateOnly < today) continue;

        decryptedReservations.push({
          reservation_id: r.reservation_id,
          user_id: r.user_id,
          car_id: r.car_id,
          parking_lot_id: r.parking_lot_id,
          reservation_date: r.reservation_date,
          slot_number: r.slot_number,
          start_time: startTime,
          end_time: endTime,
          total_price: totalPrice,
          duration_hour: durationHour,
          duration_day: durationDay,
        });
      } catch (err) {
        console.warn(`❌ Decryption failed for reservation ${r.reservation_id}:`, err.message);
      }
    }

    console.log("✅ Valid reservations returned:", decryptedReservations.length);

    return new Response(
      JSON.stringify({ reservationDetails: decryptedReservations }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("❌ Error in GET /adminFetchReservations:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500 }
    );
  }
}
