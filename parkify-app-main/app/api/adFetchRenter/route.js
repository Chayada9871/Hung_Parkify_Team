import sql from "../../../config/db"; // Ensure your database configuration is correct
import jwt from "jsonwebtoken"; // For handling JWT
import dotenv from "dotenv"; // For environment variables

dotenv.config(); // Load environment variables from .env file

const SECRET_KEY = process.env.JWT_SECRET; // Retrieve the secret key from the .env file

// Middleware to validate JWT and check for admin role
async function validateJWT(req, requiredRole) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1]; // Extract token after 'Bearer'

  if (!token) {
    return { isValid: false, error: "Authentication token is missing" };
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // Verify the token
    console.log("Decoded Token:", decoded);

    // Check if the role matches the required role
    if (requiredRole && decoded.role !== requiredRole) {
      return { isValid: false, error: "Access denied: insufficient permissions" };
    }

    return { isValid: true, user: decoded }; // Return decoded user data if valid
  } catch (error) {
    console.error("JWT Error:", error.message);
    return { isValid: false, error: "Invalid or expired token" };
  }
}

// GET endpoint with admin_id from token
export async function GET(req) {
  const authResult = await validateJWT(req, "admin"); // Require 'admin' role for access
  if (!authResult.isValid) {
    console.error(`GET Request Error: ${authResult.error}`);
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { admin_id } = authResult.user; // Extract admin_id from the token
  console.log(`Authenticated admin_id: ${admin_id}`);

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    let renterResult;

    // Fetch renter data based on userId
    if (userId) {
      renterResult = await sql`
        SELECT user_id, first_name, last_name, phone_number, email
        FROM user_info
        WHERE user_id = ${userId}
      `;
    } else {
      renterResult = await sql`
        SELECT user_id, first_name, last_name, phone_number, email
        FROM user_info
      `;
    }

    // Handle case where no renters are found
    if (renterResult.length === 0) {
      console.warn(`No renters found for query. userId: ${userId}`);
      return new Response(JSON.stringify({ error: "No renters found" }), { status: 404 });
    }

    console.log(`Fetched renter data successfully. Count: ${renterResult.length}`);
    return new Response(JSON.stringify({ renterDetails: renterResult }), { status: 200 });
  } catch (error) {
    console.error("Database Error:", error.message);
    return new Response(JSON.stringify({ error: "Error fetching data" }), { status: 500 });
  }
}

// PUT endpoint for editing renter details
export async function PUT(req) {
  const authResult = await validateJWT(req, "admin"); // Require 'admin' role for access
  if (!authResult.isValid) {
    console.error(`PUT Request Error: ${authResult.error}`);
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { userId, firstName, lastName, phoneNumber } = await req.json();

  if (!userId) {
    console.error("PUT Request Error: Missing userId");
    return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400 });
  }

  try {
    const updateResult = await sql`
      UPDATE user_info
      SET first_name = ${firstName}, last_name = ${lastName}, phone_number = ${phoneNumber}
      WHERE user_id = ${userId}
      RETURNING user_id
    `;

    if (updateResult.length === 0) {
      console.warn(`PUT Request Error: User ID ${userId} not found`);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    console.log(`Updated user ID ${userId} successfully`);
    return new Response(JSON.stringify({ message: "User updated successfully" }), { status: 200 });
  } catch (error) {
    console.error("PUT Database Error:", error.message);
    return new Response(JSON.stringify({ error: "Error updating user" }), { status: 500 });
  }
}

// DELETE endpoint for deleting renter
export async function DELETE(req) {
  const authResult = await validateJWT(req, "admin"); // Require 'admin' role for access
  if (!authResult.isValid) {
    console.error(`DELETE Request Error: ${authResult.error}`);
    return new Response(JSON.stringify({ error: authResult.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    console.error("DELETE Request Error: Missing userId");
    return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400 });
  }

  try {
    const deleteResult = await sql`
      DELETE FROM user_info
      WHERE user_id = ${userId}
      RETURNING user_id
    `;

    if (deleteResult.length === 0) {
      console.warn(`DELETE Request Error: User ID ${userId} not found`);
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    console.log(`Deleted user ID ${userId} successfully`);
    return new Response(JSON.stringify({ message: "User deleted successfully" }), { status: 200 });
  } catch (error) {
    console.error("DELETE Database Error:", error.message);
    return new Response(JSON.stringify({ error: "Error deleting user" }), { status: 500 });
  }
}
