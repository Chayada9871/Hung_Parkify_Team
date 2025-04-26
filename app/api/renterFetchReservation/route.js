import sql from '../../../config/db';
import {
  decryptAESWithKey,
  encryptAESWithKey,
  verifyJWT,
  verifyFieldSignature,
  signWithPrivateKey,
} from '/utils/auth';

export async function GET(req) {
  try {
    console.log('🔍 Received GET /renterFetchReservation request');
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('userId');
    console.log('📦 userId from URL:', userId);

    const jwtVerification = await verifyJWT(req);
    console.log('🛡️ JWT verification result:', jwtVerification);
    if (!jwtVerification.isValid) {
      return new Response(JSON.stringify({ error: jwtVerification.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!userId) userId = jwtVerification.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionKey = jwtVerification.sessionKey;
    const publicKey = jwtVerification.publicKey;

    const reservationResult = await sql`
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
      WHERE user_id = ${userId}
    `;

    console.log("📥 Fetched reservations:", reservationResult.length);
    if (reservationResult.length === 0) {
      return new Response(JSON.stringify({ reservationDetails: [] }), { status: 200 });
    }

    const today = new Date().toISOString().split("T")[0];
    const decrypted = reservationResult.map((r, i) => {
      try {
        const isStartValid = verifyFieldSignature(r.start_time_signature, r.start_time,  publicKey);
        const isEndValid = verifyFieldSignature(r.end_time_signature, r.end_time,  publicKey);
        const isTotalValid = verifyFieldSignature(r.total_price_signature, r.total_price,  publicKey);
        const isHourValid = verifyFieldSignature(r.duration_hour_signature, r.duration_hour, publicKey);
        const isDayValid = verifyFieldSignature(r.duration_day_signature, r.duration_day, publicKey);

        if (!isStartValid || !isEndValid || !isTotalValid || !isHourValid || !isDayValid) {
          console.error(`❌ Signature verification failed for reservation ${r.reservation_id}`);
          return null;
        }

        return {
          reservation_id: r.reservation_id,
          user_id: r.user_id,
          car_id: r.car_id,
          parking_lot_id: r.parking_lot_id,
          reservation_date: r.reservation_date,
          slot_number: r.slot_number,
          start_time: decryptAESWithKey(r.start_time, sessionKey),
          end_time: decryptAESWithKey(r.end_time, sessionKey),
          total_price: parseFloat(decryptAESWithKey(r.total_price, sessionKey)),
          duration_hour: parseFloat(decryptAESWithKey(r.duration_hour, sessionKey)),
          duration_day: parseInt(decryptAESWithKey(r.duration_day, sessionKey)),
        };
      } catch (err) {
        console.warn(`❌ Decryption failed [${i}]:`, err.message);
        return null;
      }
    }).filter(r => {
      if (!r) return false;
      const endDateOnly = r.end_time.split("T")[0];
      return endDateOnly >= today;
    });

    console.log("✅ Successfully decrypted reservations:", decrypted.length);

    return new Response(
      JSON.stringify({ reservationDetails: decrypted }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("❌ Error in GET /renterFetchReservation:", error.message);
    return new Response(
      JSON.stringify({ error: "Error fetching data", details: error.message }),
      { status: 500 }
    );
  }
}
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("reservationId");

    console.log("🗑 [DELETE] reservationId:", reservationId);

    if (!reservationId) {
      return new Response(
        JSON.stringify({ error: "Reservation ID is required." }),
        { status: 400 }
      );
    }

    const deleteResult = await sql`
      DELETE FROM reservation
      WHERE reservation_id = ${reservationId}
      RETURNING reservation_id
    `;

    console.log("📤 Deletion result:", deleteResult);

    if (deleteResult.length === 0) {
      throw new Error("Reservation not found or could not be deleted.");
    }

    return new Response(
      JSON.stringify({ message: "Reservation deleted successfully." }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in DELETE /reservation:", error.message);
    return new Response(
      JSON.stringify({ error: "Error deleting data", details: error.message }),
      { status: 500 }
    );
  }
}
