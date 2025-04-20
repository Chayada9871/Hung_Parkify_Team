// pages/api/updateCar.js

import sql from '../../../config/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const car_id = searchParams.get('car_id');

  if (!car_id) {
    return new Response(JSON.stringify({ error: 'Car ID is required' }), { status: 400 });
  }

  try {
    const carData = await sql`
      SELECT car_id, user_id, car_model, car_color, license_plate
      FROM car
      WHERE car_id = ${car_id}
    `;

    if (carData.length === 0) {
      return new Response(JSON.stringify({ error: 'Car not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ car: carData[0] }), { status: 200 });
  } catch (error) {
    console.error('Fetch Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching car data', details: error.message }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { car_id, car_model, car_color, license_plate } = await req.json();

    if (!car_id) {
      return new Response(JSON.stringify({ error: 'Car ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (car_model) updateData.car_model = car_model;
    if (car_color) updateData.car_color = car_color;
    if (license_plate) updateData.license_plate = license_plate;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    await sql`
      UPDATE car
      SET ${sql(updateData)}
      WHERE car_id = ${car_id}
    `;

    return new Response(JSON.stringify({ message: 'User information updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating data' }), { status: 500 });
  }
}


  export async function DELETE(req) {

    const {car_id} = await req.json();

    if (!car_id) {
      console.error('Delete Error: User ID is required');
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    try {
      console.log(`Attempting to delete car with ID: ${car_id}`);
      
      const deleteResult = await sql`
        DELETE FROM car WHERE car_id = ${car_id}
        RETURNING car_id
      `;

      if (deleteResult.length === 0) {
        console.error(`Delete Error: User with ID ${car_id} not found`);
        return new Response(JSON.stringify({ error: 'car not found or could not be deleted' }), { status: 404 });
      }
      console.log(`car with ID ${car_id} deleted successfully`);
      return new Response(JSON.stringify({ message: 'car deleted successfully' }), { status: 200 });
    } catch (error) {
      console.error('Delete Error:', error);
      return new Response(JSON.stringify({ error: 'Error deleting car', details: error.message }), { status: 500 });
    }

    }

  


 