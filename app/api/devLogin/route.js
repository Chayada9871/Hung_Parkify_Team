// ================================================
// 🔐 DEVELOPER LOGIN API - RSA JWT Auth (RS256)
// ================================================

import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// ================================================
// 📂 Load RSA Private Key for Signing JWTs
// ================================================
const privateKey = fs.readFileSync(path.resolve('keys/private.pem'), 'utf8');

const saltRounds = 10;

// ================================================
// 🚀 POST /api/devLogin
// ================================================
export async function POST(req) {
  try {
    const { email, password } = await req.json();
    console.log("📨 Developer login attempt from:", email);

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔍 Step 2: Find developer by email
    const result = await sql`
      SELECT developer_id, email, password
      FROM developer
      WHERE email = ${email}
      LIMIT 1
    `;

    if (result.length === 0) {
      console.warn("❌ Developer not found:", email);
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dev = result[0];
    let passwordMatch = false;

    if (dev.password.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(password, dev.password);
    } else {
      passwordMatch = password === dev.password;
      if (passwordMatch) {
        const hashed = await bcrypt.hash(password, saltRounds);
        await sql`
          UPDATE developer
          SET password = ${hashed}
          WHERE developer_id = ${dev.developer_id}
        `;
        console.log(`✅ Developer password upgraded to bcrypt: ${dev.developer_id}`);
      }
    }

    if (!passwordMatch) {
      console.warn("❌ Invalid password for developer:", email);
      return new Response(JSON.stringify({ error: "Invalid email or password." }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🎟 Step 5: Create JWT token using RSA private key
    const token = jwt.sign(
      {
        developer_id: dev.developer_id,
        email: dev.email,
        role: 'developer',
      },
      privateKey,
      { algorithm: 'RS256', expiresIn: '1h' }
    );

    console.log("✅ JWT issued for developer_id:", dev.developer_id);

    return new Response(JSON.stringify({ token, developer_id: dev.developer_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("🔥 Developer login error:", error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}