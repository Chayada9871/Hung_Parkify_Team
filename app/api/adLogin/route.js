// ================================================
// 🔐 ADMIN LOGIN API - RSA JWT Auth (RS256)
// ================================================

import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from "fs";
import path from "path";

// ================================================
// 📂 Load RSA Private Key for Signing JWTs
// ================================================
const privateKey = fs.readFileSync(path.resolve("keys/private.pem"), "utf8");

// 🔁 Bcrypt settings
const saltRounds = 10;

// ================================================
// 🚀 POST /api/adLogin
// ================================================
export async function POST(req) {
  try {
    // 📨 Step 1: Parse login input
    const { email, password } = await req.json();
    console.log("📨 Login request from:", email);

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔍 Step 2: Find matching admin in database
    const adminResult = await sql`
      SELECT admin_id, email, password
      FROM admin
      WHERE email = ${email}
      LIMIT 1
    `;

    if (adminResult.length === 0) {
      console.warn("❌ Admin not found:", email);
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = adminResult[0];
    let passwordMatch = false;

    // 🔐 Step 3: Check password (bcrypt or plaintext)
    if (admin.password.startsWith('$2b$')) {
      // Password is already hashed
      passwordMatch = await bcrypt.compare(password, admin.password);
    } else {
      // Password is in plaintext (legacy)
      passwordMatch = password === admin.password;

      if (passwordMatch) {
        // 🛡 Step 4: Upgrade plaintext to hashed
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await sql`
          UPDATE admin
          SET password = ${hashedPassword}
          WHERE admin_id = ${admin.admin_id}
        `;
        console.log(`✅ Password upgraded to bcrypt for admin_id ${admin.admin_id}`);
      }
    }

    if (!passwordMatch) {
      console.warn("❌ Incorrect password for:", email);
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🎟 Step 5: Create JWT token using RSA private key

    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        email: admin.email,
        role: "admin",
      },
      privateKey, // ✅ ต้องเป็น private key จริง ๆ
      { algorithm: "RS256", expiresIn: "1h" }

    );

    // ✅ Step 6: Return token and admin_id to client
    console.log("✅ JWT issued for admin_id:", admin.admin_id);
    return new Response(JSON.stringify({ token, admin_id: admin.admin_id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("🔥 Server error during login:", error);
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
