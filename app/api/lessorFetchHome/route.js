import sql from '../../../config/db'; // Adjust this import path as needed for your folder structure

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lessorId = searchParams.get('lessorId');

  if (!lessorId) {
    return new Response(JSON.stringify({ error: 'Lessor ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Query lessor details
    const lessorData = await sql`
      SELECT lessor_firstname, lessor_profile_pic
      FROM lessor
      WHERE lessor_id = ${lessorId}
    `;
    
    if (lessorData.length === 0) {
      return new Response(JSON.stringify({ error: 'Lessor not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query parking lots
    const parkingLots = await sql`
      SELECT parking_lot_id, address
      FROM parking_lot
      WHERE lessor_id = ${lessorId}
    `;

    console.log('Parking lots:', parkingLots);

    const parkingLotIds = parkingLots.map((lot) => lot.parking_lot_id);

    if (parkingLotIds.length === 0) {
      return new Response(
        JSON.stringify({ lessorDetails: lessorData[0], reservations: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Query reservations
    const reservations = await sql`
    SELECT r.duration_day, r.duration_hour, r.reservation_date, r.start_time, r.end_time,
           r.car_id, r.parking_lot_id, c.car_model, c.license_plate,
           u.first_name, u.last_name, u.phone_number,
           p.address
    FROM reservation r
    JOIN car c ON r.car_id = c.car_id
    JOIN user_info u ON c.user_id = u.user_id
    JOIN parking_lot p ON r.parking_lot_id = p.parking_lot_id
    WHERE r.parking_lot_id = ANY(${parkingLotIds})
  `;

    const responseData = {
      lessorDetails: lessorData[0],
      parkingLots,
      reservations,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error fetching data', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
