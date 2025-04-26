import sql from '../../../config/db';
import {
  encryptAESWithKey,
  verifyJWT,
  signWithPrivateKey,
} from '/utils/auth';

export async function POST(req) {
  const jwtVerification = await verifyJWT(req);
  if (!jwtVerification.isValid) {
    return new Response(JSON.stringify({ error: jwtVerification.error }), { status: 401 });
  }

  const sessionKey = jwtVerification.sessionKey;
  const privateKey = jwtVerification.privateKey;

  try {
    const { userId, ...rawPayload } = await req.json();

    // 🔐 Encrypt sensitive fields
    const encryptedPayload = {
      parking_lot_id: rawPayload.parking_lot_id,
      user_id: rawPayload.user_id,
      car_id: rawPayload.car_id,
      reservation_date: rawPayload.reservation_date,
      slot_number: rawPayload.slot_number,
      start_time: encryptAESWithKey(rawPayload.start_time, sessionKey),
      end_time: encryptAESWithKey(rawPayload.end_time, sessionKey),
      total_price: encryptAESWithKey(rawPayload.total_price, sessionKey),
      duration_hour: encryptAESWithKey(rawPayload.duration_hour, sessionKey),
      duration_day: encryptAESWithKey(rawPayload.duration_day, sessionKey),
    };

    // ✍️ Sign encrypted fields
    const fieldSignatures = {
      start_time_signature: signWithPrivateKey(encryptedPayload.start_time, privateKey),
      end_time_signature: signWithPrivateKey(encryptedPayload.end_time, privateKey),
      total_price_signature: signWithPrivateKey(encryptedPayload.total_price, privateKey),
      duration_hour_signature: signWithPrivateKey(encryptedPayload.duration_hour, privateKey),
      duration_day_signature: signWithPrivateKey(encryptedPayload.duration_day, privateKey),
    };

    // 🔢 Auto-assign next available slot number
    const slotQuery = await sql`
      SELECT slot_number FROM reservation
      WHERE parking_lot_id = ${encryptedPayload.parking_lot_id}
      ORDER BY slot_number
    `;
    const usedSlots = new Set(slotQuery.map(r => r.slot_number));
    let slotNumber = 1;
    while (usedSlots.has(slotNumber)) {
      slotNumber++;
    }

    // 💾 Insert into database
    let reservationId = null;
    await sql.begin(async (sql) => {
      const insertResult = await sql`
        INSERT INTO reservation (
          parking_lot_id, user_id, car_id, reservation_date,
          start_time, end_time, total_price,
          duration_hour, duration_day, slot_number,
          start_time_signature, end_time_signature,
          total_price_signature, duration_hour_signature,
          duration_day_signature
        ) VALUES (
          ${encryptedPayload.parking_lot_id},
          ${encryptedPayload.user_id},
          ${encryptedPayload.car_id},
          ${encryptedPayload.reservation_date},
          ${encryptedPayload.start_time},
          ${encryptedPayload.end_time},
          ${encryptedPayload.total_price},
          ${encryptedPayload.duration_hour},
          ${encryptedPayload.duration_day},
          ${slotNumber},
          ${fieldSignatures.start_time_signature},
          ${fieldSignatures.end_time_signature},
          ${fieldSignatures.total_price_signature},
          ${fieldSignatures.duration_hour_signature},
          ${fieldSignatures.duration_day_signature}
        )
        RETURNING reservation_id
      `;

      if (insertResult.length === 0) {
        throw new Error("Reservation insert failed.");
      }

      reservationId = insertResult[0].reservation_id;

      const updateResult = await sql`
        UPDATE parking_lot
        SET available_slots = available_slots - 1
        WHERE parking_lot_id = ${encryptedPayload.parking_lot_id}
          AND available_slots > 0
        RETURNING available_slots
      `;

      if (updateResult.length === 0) {
        throw new Error("No available slots remaining.");
      }
    });

    return new Response(
      JSON.stringify({ status: "success", reservationId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Reservation insert failed:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Reservation failed",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
