import sql from '../../../config/db';
import { decryptAESWithKey, verifyFieldSignature } from '/utils/auth';

export async function GET(req) {
  try {
    console.log('🔍 [API] Received GET /lessorFetchReservations request');

    const { searchParams } = new URL(req.url);
    const lessorId = searchParams.get('lessorId');

    if (!lessorId) {
      return new Response(JSON.stringify({ error: 'Lessor ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch lessor info
    const lessorData = await sql`
      SELECT lessor_firstname, lessor_profile_pic
      FROM lessor
      WHERE lessor_id = ${lessorId}
    `;
    if (lessorData.length === 0) {
      return new Response(JSON.stringify({ error: 'Lessor not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch lessor session key and public key
    const lessorKeys = await sql`
      SELECT 
        pgp_sym_decrypt(lk.encrypted_session_key::bytea, 'parkify-session-secret') AS lessor_session_key,
        lk.public_key AS lessor_public_key
      FROM lessor_keys lk
      WHERE lessor_id = ${lessorId}
    `;
    if (lessorKeys.length === 0) {
      return new Response(JSON.stringify({ error: 'Lessor keys not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const lessorSessionKey = lessorKeys[0].lessor_session_key;
    const lessorPublicKey = lessorKeys[0].lessor_public_key;

    // 3. Fetch reservations with parking lot + car info
    const reservationsRaw = await sql`
      SELECT 
        r.reservation_id,
        r.parking_lot_id,
        p.location_name,
        p.location_name_signature,
        r.car_id,
        c.license_plate,
        r.start_time,
        r.end_time,
        r.total_price,
        r.duration_hour,
        r.duration_day,
        r.slot_number,
        r.start_time_signature,
        r.end_time_signature,
        r.total_price_signature,
        r.duration_hour_signature,
        r.duration_day_signature,
        r.reservation_date,
        pgp_sym_decrypt(uk.encrypted_session_key::bytea, 'parkify-session-secret') AS renter_session_key,
        uk.public_key AS renter_public_key
      FROM reservation r
      JOIN car c ON r.car_id = c.car_id
      JOIN parking_lot p ON r.parking_lot_id = p.parking_lot_id
      JOIN user_keys uk ON c.user_id = uk.user_id
      WHERE p.lessor_id = ${lessorId}
    `;

    console.log('✅ Reservations fetched:', reservationsRaw.length);

    // 4. Verify and Decrypt
    const verifiedReservations = reservationsRaw.map((r, idx) => {
      try {
        const renterPublicKey = r.renter_public_key;
        const renterSessionKey = r.renter_session_key;

        // 🛡 Verify reservation fields (start/end/price/hour/day)
        const isStartValid = verifyFieldSignature(r.start_time_signature, r.start_time, renterPublicKey);
        const isEndValid = verifyFieldSignature(r.end_time_signature, r.end_time, renterPublicKey);
        const isTotalValid = verifyFieldSignature(r.total_price_signature, r.total_price, renterPublicKey);
        const isHourValid = verifyFieldSignature(r.duration_hour_signature, r.duration_hour, renterPublicKey);
        const isDayValid = verifyFieldSignature(r.duration_day_signature, r.duration_day, renterPublicKey);

        // 🛡 Verify location name using lessor public key
        const isLocationValid = verifyFieldSignature(r.location_name_signature, r.location_name, lessorPublicKey);

        if (!isStartValid || !isEndValid || !isTotalValid || !isHourValid || !isDayValid || !isLocationValid) {
          console.error(`❌ [${idx}] Signature invalid for reservation ID ${r.reservation_id}`);
          return null;
        }

        return {
          reservation_id: r.reservation_id,
          parking_lot_id: r.parking_lot_id,
          location_name: decryptAESWithKey(r.location_name, lessorSessionKey),
          car_id: r.car_id,
          license_plate: decryptAESWithKey(r.license_plate, renterSessionKey),
          reservation_date: r.reservation_date,
          slot_number: r.slot_number,
          start_time: decryptAESWithKey(r.start_time, renterSessionKey),
          end_time: decryptAESWithKey(r.end_time, renterSessionKey),
          total_price: parseFloat(decryptAESWithKey(r.total_price, renterSessionKey)),
          duration_hour: parseFloat(decryptAESWithKey(r.duration_hour, renterSessionKey)),
          duration_day: parseInt(decryptAESWithKey(r.duration_day, renterSessionKey)),
        };
      } catch (error) {
        console.error(`❌ [${idx}] Decryption error:`, error.message);
        return null;
      }
    }).filter(Boolean);

    return new Response(JSON.stringify({
      lessorDetails: lessorData[0],
      reservations: verifiedReservations,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch reservations',
      details: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
