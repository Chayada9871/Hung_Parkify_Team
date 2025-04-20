import sql from '../../../config/db';

// GET Parking Lot Details
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const locationName = searchParams.get('locationName');

  if (!locationName) {
    return new Response(JSON.stringify({ error: 'Location name is required' }), { status: 400 });
  }

  try {
    // Fetch parking lots matching the location name
    const parkingResult = await sql`
      SELECT parking_lot_id, location_name, price_per_hour, address, available_slots
      FROM parking_lot
      WHERE LOWER(location_name) LIKE LOWER(${`%${locationName}%`})
    `;

    // Return an empty array if no parking lots are found
    if (parkingResult.length === 0) {
      return new Response(JSON.stringify({ parkingLots: [] }), { status: 200 });
    }

    return new Response(JSON.stringify({ parkingLots: parkingResult }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching parking data' }), { status: 500 });
  }
}
