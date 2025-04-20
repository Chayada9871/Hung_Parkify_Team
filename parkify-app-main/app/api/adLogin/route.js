import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10; // Salt rounds for bcrypt hashing

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Input validation
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required." }), { status: 400 });
    }

    // Fetch the admin user by email
    const adminResult = await sql`
      SELECT admin_id, email, password
      FROM admin
      WHERE email = ${email}
      LIMIT 1
    `;

    // If no admin found with the email, return a generic error
    if (adminResult.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid email or password." }), { status: 401 });
    }

    const admin = adminResult[0];

    // Transitional login: Check if the password is hashed or plaintext
    let passwordMatch = false;
    if (admin.password.startsWith('$2b$')) {
      // Password is already bcrypt-hashed
      passwordMatch = await bcrypt.compare(password, admin.password);
    } else {
      // Password is plaintext, compare directly
      passwordMatch = password === admin.password;

      if (passwordMatch) {
        // If the plaintext password matches, hash it and update in the database
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await sql`
          UPDATE admin
          SET password = ${hashedPassword}
          WHERE admin_id = ${admin.admin_id}
        `;
        console.log(`Password for admin_id ${admin.admin_id} has been updated to bcrypt.`);
      }
    }

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password." }),
        { status: 401 }
      );
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        email: admin.email,
        role: "admin", // Include any additional claims if needed
      },
      jwtSecret, // Secret key
      { expiresIn: "1h" } // Token expiration time
    );

    // Return the token in the response body
    return new Response(
      JSON.stringify({ admin_id: admin.admin_id, token }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error("Error during login:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during login.", details: error.message }),
      { status: 500 }
    );
  }
}
