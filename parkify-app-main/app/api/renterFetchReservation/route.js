import sql from '../../../config/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Update status to 'Complete' for all reservations where the end_time has passed today and increment available_slots
    await sql`
      WITH updated_reservations AS (
        UPDATE reservation
        SET status = 'Complete'
        WHERE end_time < CURRENT_DATE AND status != 'Complete'
        RETURNING parking_lot_id
      )
      UPDATE parking_lot
      SET available_slots = available_slots + 1
      WHERE parking_lot_id IN (SELECT parking_lot_id FROM updated_reservations)
    `;

    // Query reservations for the provided userId and exclude those where end_time < today
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
        AND r.end_time >= CURRENT_DATE -- Exclude reservations where end_time has already passed
    `;

    // Return an empty array if no reservations are found
    if (reservationResult.length === 0) {
      return new Response(JSON.stringify({ reservationDetails: [] }), { status: 200 });
    }

    return new Response(JSON.stringify({ reservationDetails: reservationResult }), { status: 200 });
  } catch (error) {
    console.error('Error fetching reservations:', error.message);
    return new Response(JSON.stringify({ error: 'Error fetching data', details: error.message }), { status: 500 });
  }
}



export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get('reservationId');

    // Validate that reservationId is provided
    if (!reservationId) {
      return new Response(JSON.stringify({ error: 'Reservation ID is required.' }), { status: 400 });
    }

    // Safely delete the reservation
    const deleteResult = await sql`
      DELETE FROM reservation
      WHERE reservation_id = ${reservationId}
      RETURNING reservation_id
    `;

    if (deleteResult.length === 0) {
      throw new Error('Reservation not found or could not be deleted.');
    }

    return new Response(
      JSON.stringify({ message: 'Reservation deleted successfully.' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting reservation:', error.message);
    return new Response(
      JSON.stringify({ error: 'Error deleting data', details: error.message }),
      { status: 500 }
    );
  }
}
