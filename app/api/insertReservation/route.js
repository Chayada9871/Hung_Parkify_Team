import sql from "../../../config/db";
import { verifySignature } from "/utils/crypto";

export async function POST(req) {
  try {
    const { payload, signature, rawPayload } = await req.json();

    // ✅ 1. Verify digital signature using raw plaintext data
    const isValid = verifySignature(JSON.stringify(rawPayload), signature);
    if (!isValid) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid digital signature" }),
        { status: 403 }
      );
    }

    // ✅ 2. Directly insert encrypted data (no decryption, no signature saved)
    let reservationId = null;

    await sql.begin(async (sql) => {
      const result = await sql`
        INSERT INTO reservation (
          parking_lot_id,
          user_id,
          reservation_date,
          start_time,
          end_time,
          total_price,
          duration_hour,
          duration_day,
          car_id
        ) VALUES (
          ${payload.parking_lot_id},
          ${payload.user_id},
          ${payload.reservation_date},
          ${payload.start_time},
          ${payload.end_time},
          ${payload.total_price},
          ${payload.duration_hour},
          ${payload.duration_day},
          ${payload.car_id}
        )
        RETURNING reservation_id
      `;

      if (result.length === 0) throw new Error("Reservation insert failed.");
      reservationId = result[0].reservation_id;

      await sql`
        UPDATE parking_lot
        SET available_slots = available_slots - 1
        WHERE parking_lot_id = ${payload.parking_lot_id} AND available_slots > 0
      `;
    });

    return new Response(
      JSON.stringify({ status: "success", reservationId }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Reservation insert failed:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Reservation failed",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
