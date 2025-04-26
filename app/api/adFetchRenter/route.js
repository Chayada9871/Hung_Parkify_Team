import sql from "../../../config/db"; // Database config
import jwt from "jsonwebtoken";       // For JWT
import fs from "fs";
import path from "path";

// 🔐 Load RSA Public Key for verifying JWT
const PUBLIC_KEY = fs.readFileSync(path.resolve("keys/public.pem"), "utf8");

// ✅ JWT Middleware to verify token and check admin role
async function validateJWT(req, requiredRole) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return { isValid: false, error: "Authentication token is missing" };
  }

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
    console.log("✅ Decoded JWT:", decoded);

    if (requiredRole && decoded.role !== requiredRole) {
      return { isValid: false, error: "Access denied: insufficient permissions" };
    }

    return { isValid: true, user: decoded };
  } catch (error) {
    console.error("❌ JWT verification failed:", error.message);
    return { isValid: false, error: "Invalid or expired token" };
  }
}

// 🚀 GET: Fetch renters (optionally by userId)
export async function GET(req) {
  const auth = await validateJWT(req, "admin");
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  const { admin_id } = auth.user;
  console.log(`📥 GET renter request by admin_id: ${admin_id}`);

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    let result;
    if (userId) {
      result = await sql`
        SELECT user_id, first_name, last_name, phone_number, email
        FROM user_info
        WHERE user_id = ${userId}
      `;
    } else {
      result = await sql`
        SELECT user_id, first_name, last_name, phone_number, email
        FROM user_info
      `;
    }

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "No renters found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ renterDetails: result }), { status: 200 });
  } catch (err) {
    console.error("❌ DB Error on GET:", err.message);
    return new Response(JSON.stringify({ error: "Error fetching renters" }), { status: 500 });
  }
}

// 🚀 PUT: Update renter details
export async function PUT(req) {
  const auth = await validateJWT(req, "admin");
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  const { userId, firstName, lastName, phoneNumber } = await req.json();
  if (!userId) {
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
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "User updated successfully" }), { status: 200 });
  } catch (err) {
    console.error("❌ DB Error on PUT:", err.message);
    return new Response(JSON.stringify({ error: "Error updating user" }), { status: 500 });
  }
}

// 🚀 DELETE: Delete a renter
export async function DELETE(req) {
  const auth = await validateJWT(req, "admin");
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400 });
  }

  try {
    const deleteResult = await sql`
      DELETE FROM user_info
      WHERE user_id = ${userId}
      RETURNING user_id
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "User deleted successfully" }), { status: 200 });
  } catch (err) {
    console.error("❌ DB Error on DELETE:", err.message);
    return new Response(JSON.stringify({ error: "Error deleting user" }), { status: 500 });
  }
}
