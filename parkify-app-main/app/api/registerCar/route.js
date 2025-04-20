import sql from '../../../config/db';

// POST Car Registration
export async function POST(req) {
  try {
    const { userId, carModel, carColor, licensePlateNumber, fileURL } = await req.json();

    // Validate required fields
    if (!userId || !carModel || !carColor || !licensePlateNumber || !fileURL) {
      return new Response(JSON.stringify({ error: 'Please fill in all fields.' }), { status: 400 });
    }

    // Insert car data into the car table
    const insertResult = await sql`
      INSERT INTO car (user_id, car_model, car_color, license_plate, car_image)
      VALUES (${userId}, ${carModel}, ${carColor}, ${licensePlateNumber}, ${fileURL})
      RETURNING car_id
    `;

    if (insertResult.length === 0) {
      return new Response(
        JSON.stringify({ error: 'An error occurred while registering the car. Please try again.' }),
        { status: 500 }
      );
    }

    const carId = insertResult[0].car_id;
    return new Response(JSON.stringify({ message: 'Car registration successful!', carId }), { status: 200 });
  } catch (error) {
    console.error('Car Registration Error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500 }
    );
  }
}
