import sql from '../../../config/db'; // Ensure your database configuration is correct
import jwt from 'jsonwebtoken'; // For handling JWT
import dotenv from 'dotenv'; // For environment variables

dotenv.config(); // Load environment variables from .env file

const SECRET_KEY = process.env.JWT_SECRET; // Retrieve the secret key from the .env file

// Middleware to validate JWT
async function validateJWT(req, requiredRole) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // Extract token after 'Bearer'

  if (!token) {
    return { isValid: false, error: 'Authentication token is missing' };
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // Verify the token
    console.log('Decoded Token:', decoded);

    // Check if the role matches the required role
    if (requiredRole && decoded.role !== requiredRole) {
      return { isValid: false, error: 'Access denied: insufficient permissions' };
    }

    return { isValid: true, user: decoded }; // Return decoded user data if valid
  } catch (error) {
    console.error('JWT Error:', error.message);
    return { isValid: false, error: 'Invalid or expired token' };
  }
}

// GET endpoint with JWT validation
export async function GET(req) {
  const authResult = await validateJWT(req, 'admin'); // Require 'admin' role for access
  if (!authResult.isValid) {
    console.error(`GET Request Error: ${authResult.error}`);
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parkingLotId = searchParams.get('parkingLotId');

  try {
    let parkingLotResult;

    // Fetch parking lot data based on parkingLotId
    if (parkingLotId) {
      parkingLotResult = await sql`
        SELECT parking_lot_id, lessor_id, location_name, address, location_url, total_slots, price_per_hour, location_image
        FROM parking_lot
        WHERE parking_lot_id = ${parkingLotId}
      `;
    } else {
      parkingLotResult = await sql`
        SELECT parking_lot_id, lessor_id, location_name, address, location_url, total_slots, price_per_hour, location_image
        FROM parking_lot
      `;
    }

    // Handle case where no parking lots are found
    if (parkingLotResult.length === 0) {
      console.warn(`No parking lots found. parkingLotId: ${parkingLotId}`);
      return new Response(JSON.stringify({ error: 'No parking lots found' }), { status: 404 });
    }

    console.log(`Fetched parking lot data successfully. Count: ${parkingLotResult.length}`);
    return new Response(JSON.stringify({ parkingLotDetails: parkingLotResult }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error.message);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
  }
}

// PUT endpoint with JWT validation
export async function PUT(req) {
  const authResult = await validateJWT(req, 'admin'); // Require 'admin' role for access
  if (!authResult.isValid) {
    console.error(`PUT Request Error: ${authResult.error}`);
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  try {
    const { parkingLotId, locationName, address, locationUrl, totalSlots, pricePerHour, locationImage } = await req.json();

    if (!parkingLotId) {
      return new Response(JSON.stringify({ error: 'Parking Lot ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (locationName) updateData.location_name = locationName;
    if (address) updateData.address = address;
    if (locationUrl) updateData.location_url = locationUrl;
    if (totalSlots) updateData.total_slots = totalSlots;
    if (pricePerHour) updateData.price_per_hour = pricePerHour;
    if (locationImage) updateData.location_image = locationImage;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    await sql`
      UPDATE parking_lot
      SET ${sql(updateData)}
      WHERE parking_lot_id = ${parkingLotId}
    `;

    console.log(`Updated parking lot with ID: ${parkingLotId}`);
    return new Response(JSON.stringify({ message: 'Parking lot information updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error.message);
    return new Response(JSON.stringify({ error: 'Error updating data' }), { status: 500 });
  }
}

// DELETE endpoint with JWT validation
export async function DELETE(req) {
  const authResult = await validateJWT(req, 'admin'); // Require 'admin' role for access
  if (!authResult.isValid) {
    console.error(`DELETE Request Error: ${authResult.error}`);
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parkingLotId = searchParams.get('parkingLotId');

  if (!parkingLotId) {
    console.error('Delete Error: Parking Lot ID is required');
    return new Response(JSON.stringify({ error: 'Parking Lot ID is required' }), { status: 400 });
  }

  try {
    console.log(`Attempting to delete parking lot with ID: ${parkingLotId}`);

    const deleteResult = await sql`
      DELETE FROM parking_lot WHERE parking_lot_id = ${parkingLotId}
      RETURNING parking_lot_id
    `;

    if (deleteResult.length === 0) {
      console.error(`Delete Error: Parking lot with ID ${parkingLotId} not found`);
      return new Response(JSON.stringify({ error: 'Parking lot not found or could not be deleted' }), { status: 404 });
    }

    console.log(`Parking lot with ID ${parkingLotId} deleted successfully`);
    return new Response(JSON.stringify({ message: 'Parking lot deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error.message);
    return new Response(JSON.stringify({ error: 'Error deleting parking lot', details: error.message }), { status: 500 });
  }
}
