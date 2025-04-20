// app/api/fetchCars/route.js
import sql from '../../../config/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
  }

  try {
    const carsResult = await sql`
      SELECT car_id, car_image, car_model, car_color, license_plate
      FROM car
      WHERE user_id = ${userId}
    `;

    if (carsResult.length === 0) {
      return new Response(JSON.stringify({ message: 'No car is registered' }), { status: 200 });
    }

    return new Response(JSON.stringify({ cars: carsResult }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
  }
}

export async function POST(req) {
  const { userId, car_model, car_color, license_plate, car_image } = await req.json();

  if (!userId || !car_model || !car_color || !license_plate) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    const insertResult = await sql`
      INSERT INTO car (user_id, car_model, car_color, license_plate, car_image)
      VALUES (${userId}, ${car_model}, ${car_color}, ${license_plate}, ${car_image})
      RETURNING car_id
    `;

    const newCarId = insertResult[0].car_id;
    return new Response(JSON.stringify({ carId: newCarId }), { status: 201 });
  } catch (error) {
    console.error('Error creating car:', error);
    return new Response(JSON.stringify({ error: 'Error creating car' }), { status: 500 });
  }
}

export async function PUT(req) {
  const { carId, car_model, car_color, license_plate, car_image } = await req.json();

  if (!carId || !car_model || !car_color || !license_plate) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    await sql`
      UPDATE car
      SET
        car_model = ${car_model},
        car_color = ${car_color},
        license_plate = ${license_plate},
        car_image = ${car_image}
      WHERE car_id = ${carId}
    `;

    return new Response(JSON.stringify({ message: 'Car updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating car' }), { status: 500 });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get('carId');

  if (!carId) {
    return new Response(JSON.stringify({ error: 'Car ID is required' }), { status: 400 });
  }

  try {
    const deleteResult = await sql`
      DELETE FROM car
      WHERE car_id = ${carId}
      RETURNING car_id
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Car not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Car deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error deleting car', details: error.message }),
      { status: 500 }
    );
  }
}
