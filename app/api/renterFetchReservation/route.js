import sql from "../../../config/db";
import { decryptAES, STATIC_AES_KEY } from "/utils/crypto";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    console.log("🟢 [GET] userId:", userId);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400 }
      );
    }

    const reservationResult = await sql`
      SELECT 
        r.reservation_id,
        r.user_id,
        r.start_time,
        r.end_time,
        r.total_price,
        r.parking_lot_id,
        r.duration_day,
        r.duration_hour,
        r.status,
        COALESCE(c.car_model, 'No car available, please insert') AS car_model,
        p.location_name,
        p.address AS location_address
      FROM reservation r
      LEFT JOIN car c ON r.car_id = c.car_id
      LEFT JOIN parking_lot p ON r.parking_lot_id = p.parking_lot_id
      WHERE r.user_id = ${userId}
    `;

    console.log("📥 Fetched reservations:", reservationResult.length);

    if (reservationResult.length === 0) {
      return new Response(JSON.stringify({ reservationDetails: [] }), { status: 200 });
    }

    const today = new Date().toISOString().split("T")[0];
    console.log("📅 Today:", today);

    const decrypted = reservationResult.map((r, i) => {
      try {
        const start = decryptAES(r.start_time, STATIC_AES_KEY);
        const end = decryptAES(r.end_time, STATIC_AES_KEY);
        const total = decryptAES(r.total_price, STATIC_AES_KEY);
        const hour = decryptAES(r.duration_hour, STATIC_AES_KEY);
        const day = decryptAES(r.duration_day, STATIC_AES_KEY);

        console.log(`🔓 Decryption [${i}]`);
        console.log("  ⏱ start_time:", start);
        console.log("  ⏱ end_time:", end);
        console.log("  💰 total_price:", total);
        console.log("  🕓 duration_hour:", hour);
        console.log("  📆 duration_day:", day);

        return {
          reservation_id: r.reservation_id,
          user_id: r.user_id,
          parking_lot_id: r.parking_lot_id,
          location_name: r.location_name,
          location_address: r.location_address,
          car_model: r.car_model,
          status: r.status,
          start_time: start,
          end_time: end,
          total_price: parseFloat(total),
          duration_hour: parseFloat(hour),
          duration_day: parseInt(day),
        };
      } catch (err) {
        console.warn(`❌ Decryption failed [${i}]`, err.message);
        return null;
      }
    }).filter((r) => {
      if (!r) return false;
      const endDateOnly = r.end_time.split("T")[0];
      return endDateOnly >= today;
    });

    console.log("✅ Successfully decrypted reservations:", decrypted.length);

    return new Response(
      JSON.stringify({ reservationDetails: decrypted }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in GET /reservation:", error.message);
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
