// app/api/fetchParking/route.js
import sql from '../../../config/db';

// GET Parking Lot Details
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('parkingLotId');

  console.log("Requested Location ID:", locationId); // Debugging output

  if (!locationId) {
    return new Response(JSON.stringify({ error: 'Location ID is required' }), { status: 400 });
  }

  try {
    // Query the database for parking lot details
    const parkingResult = await sql`
      SELECT 
        parking_lot_id, 
        location_name, 
        price_per_hour, 
        address, 
        location_url
      FROM parking_lot
      WHERE parking_lot_id = ${locationId}
    `;

    console.log("Database query result:", parkingResult); // Debugging output

    if (parkingResult.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No parking lot found for the given location ID' }),
        { status: 404 }
      );
    }

    const parkingLot = parkingResult[0];
    return new Response(JSON.stringify({ parkingLot }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error fetching parking data' }),
      { status: 500 }
    );
  }
}
