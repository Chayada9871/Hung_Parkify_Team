// app/api/fetchParkingLot/route.js
import sql from '../../../config/db';
import supabase from '../../../config/supabaseClient';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lessorId = searchParams.get('lessorId');

  if (!lessorId) {
    return new Response(JSON.stringify({ error: 'Lessor ID is required' }), { status: 400 });
  }

  try {
    const lessorResult = await sql`
      SELECT lessor_id, lessor_firstname
      FROM lessor
      WHERE lessor_id = ${lessorId}
    `;
    const lessorData = lessorResult[0];

    if (!lessorData) {
      return new Response(JSON.stringify({ error: 'Lessor not found' }), { status: 404 });
    }

    const parkingLotsResult = await sql`
      SELECT parking_lot_id, location_name, address, location_url, total_slots, price_per_hour, location_image
      FROM parking_lot
      WHERE lessor_id = ${lessorId}
    `;
    
    return new Response(
      JSON.stringify({
        lessorDetails: lessorData,
        parkingLots: parkingLotsResult,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { parkingLotId, location_name, address, location_url, total_slots, price_per_hour, location_image } = await req.json();

    if (!parkingLotId || !location_name || !address || !location_url || !total_slots || !price_per_hour) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    const updateResult = await sql`
      UPDATE parking_lot
      SET
        location_name = ${location_name},
        address = ${address},
        location_url = ${location_url},
        total_slots = ${total_slots},
        price_per_hour = ${price_per_hour},
        location_image = ${location_image}
      WHERE parking_lot_id = ${parkingLotId}
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating data' }), { status: 500 });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const parkingLotId = searchParams.get('parkingLotId');

  if (!parkingLotId) {
    return new Response(JSON.stringify({ error: 'Parking lot ID is required' }), { status: 400 });
  }

  try {
    // Log the parkingLotId to ensure it's being retrieved correctly
    console.log('Deleting parking lot with ID:', parkingLotId);

    // Fetch the existing image path from the database
    const imageResult = await sql`
      SELECT location_image FROM parking_lot WHERE parking_lot_id = ${parkingLotId}
    `;
    
    // Log the result to ensure the image path was fetched correctly
    console.log('Fetched image path from database:', imageResult);

    const imagePath = imageResult[0]?.location_image;

    // If imagePath exists, attempt to delete from Supabase storage
    if (imagePath) {
      console.log('Attempting to delete image from storage:', imagePath);
      const { error: deleteError } = await supabase
        .storage
        .from('carpark') // Ensure this matches your actual storage bucket name
        .remove([imagePath]);

      if (deleteError) {
        console.error('Error deleting image from storage:', deleteError.message);
        return new Response(
          JSON.stringify({
            error: 'Error deleting image from storage',
            details: deleteError.message,
          }),
          { status: 500 }
        );
      }
    } else {
      console.log('No image path to delete from storage');
    }

    // Delete the parking lot record from the database
    const deleteResult = await sql`
      DELETE FROM parking_lot
      WHERE parking_lot_id = ${parkingLotId}
      RETURNING parking_lot_id
    `;

    console.log('Database deletion result:', deleteResult);

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Parking lot not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Parking lot and associated image deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error deleting parking lot and image',
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

// New POST method to add a parking lot
export async function POST(req) {
  
  const { lessorId, location_name, address, location_url, total_slots, price_per_hour, location_image } = await req.json();
  console.log('Incoming payload:', { lessorId, location_name, address, location_url, total_slots, price_per_hour, location_image });


  if (!lessorId || !location_name || !address || !location_url || !total_slots || !price_per_hour) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    const insertResult = await sql`
      INSERT INTO parking_lot (lessor_id, location_name, address, location_url, total_slots, available_slots, price_per_hour, location_image)
      VALUES (${lessorId}, ${location_name}, ${address}, ${location_url}, ${total_slots}, ${total_slots}, ${price_per_hour}, ${location_image})
      RETURNING parking_lot_id
    `;

    const newParkingLotId = insertResult[0].parking_lot_id;

    return new Response(JSON.stringify({ parkingLotId: newParkingLotId }), { status: 201 });
  } catch (error) {
    console.error('Error creating parking lot:', error);
    return new Response(JSON.stringify({ error: 'Error creating parking lot' }), { status: 500 });
  }
}
