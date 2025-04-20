import sql from '../../../config/db';
import { encryptAES, decryptAES } from '/utils/crypto'; // ✅ Import your AES utils

// ------------------- GET -------------------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
  }

  try {
    const carsResult = await sql`
      SELECT car_id, carimage, car_model, car_color, license_plate
      FROM car
      WHERE user_id = ${userId}
    `;

    if (carsResult.length === 0) {
      return new Response(JSON.stringify({ message: 'No car is registered' }), { status: 200 });
    }

    // ✅ Decrypt fields
    const decryptedCars = carsResult.map(car => ({
      car_id: car.car_id,
      car_image: car.carimage,
      car_model: decryptAES(car.car_model),
      car_color: decryptAES(car.car_color),
      license_plate: decryptAES(car.license_plate)
    }));

    return new Response(JSON.stringify({ cars: decryptedCars }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
  }
}

// ------------------- POST -------------------
export async function POST(req) {
  const { userId, car_model, car_color, license_plate, car_image } = await req.json();

  if (!userId || !car_model || !car_color || !license_plate) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    // ✅ Encrypt fields
    const encryptedModel = encryptAES(car_model);
    const encryptedColor = encryptAES(car_color);
    const encryptedPlate = encryptAES(license_plate);

    const insertResult = await sql`
      INSERT INTO car (user_id, car_model, car_color, license_plate, carimage)
      VALUES (${userId}, ${encryptedModel}, ${encryptedColor}, ${encryptedPlate}, ${car_image})
      RETURNING car_id
    `;

    const newCarId = insertResult[0].car_id;
    return new Response(JSON.stringify({ carId: newCarId }), { status: 201 });
  } catch (error) {
    console.error('Error creating car:', error);
    return new Response(JSON.stringify({ error: 'Error creating car' }), { status: 500 });
  }
}

// ------------------- PUT -------------------
export async function PUT(req) {
  const { carId, car_model, car_color, license_plate, car_image } = await req.json();

  if (!carId || !car_model || !car_color || !license_plate) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    // ✅ Encrypt fields
    const encryptedModel = encryptAES(car_model);
    const encryptedColor = encryptAES(car_color);
    const encryptedPlate = encryptAES(license_plate);

    await sql`
      UPDATE car
      SET
        car_model = ${encryptedModel},
        car_color = ${encryptedColor},
        license_plate = ${encryptedPlate},
        carimage = ${car_image}
      WHERE car_id = ${carId}
    `;

    return new Response(JSON.stringify({ message: 'Car updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating car' }), { status: 500 });
  }
}

// ------------------- DELETE -------------------
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
