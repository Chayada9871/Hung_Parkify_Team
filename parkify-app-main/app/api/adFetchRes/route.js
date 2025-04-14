// app/api/fetchReservation/route.js
import sql from '../../../config/db';
import supabase from '../../../config/supabaseClient';


export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reservationId = searchParams.get('reservationId');

  try {
    let reservationResult;
    
    // Check if reservationId is provided; if not, fetch all reservations
    if (reservationId) {
      reservationResult = await sql`
        SELECT reservation_id, user_id, start_time, end_time, total_price, parking_lot_id, car_id
        FROM reservation
        WHERE reservation_id = ${reservationId}
      `;
    } else {
      reservationResult = await sql`
        SELECT reservation_id, user_id, start_time, end_time, total_price, parking_lot_id, car_id
        FROM reservation
      `;
    }

    if (reservationResult.length === 0) {
      return new Response(JSON.stringify({ error: 'No reservations found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ reservationDetails: reservationResult }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const {
      reservation_id,
      start_time,
      end_time,
      total_price,
      duration_hour,
      duration_day,
      car_id,
    } = await req.json();

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "Reservation ID is required" }), { status: 400 });
    }

    const updateData = {};
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (total_price) updateData.total_price = total_price;
    if (duration_hour !== undefined) updateData.duration_hour = duration_hour;
    if (duration_day !== undefined) updateData.duration_day = duration_day;
    if (car_id) updateData.car_id = car_id;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: "At least one field must be updated" }), { status: 400 });
    }

    await sql`
      UPDATE reservation
      SET ${sql(updateData)}
      WHERE reservation_id = ${reservation_id}
    `;

    return new Response(JSON.stringify({ message: "Reservation updated successfully" }), { status: 200 });
  } catch (error) {
    console.error("Update Error:", error);
    return new Response(JSON.stringify({ error: "Error updating data" }), { status: 500 });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const reservationId = searchParams.get('reservationId');

  if (!reservationId) {
    return new Response(JSON.stringify({ error: 'Reservation ID is required' }), { status: 400 });
  }

  try {
    // Optional: if there's a related image or file in Supabase storage, handle deletion here
    const deleteResult = await sql`
      DELETE FROM reservation WHERE reservation_id = ${reservationId}
      RETURNING reservation_id
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Reservation not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Reservation deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(JSON.stringify({ error: 'Error deleting reservation', details: error.message }), { status: 500 });
  }
}
