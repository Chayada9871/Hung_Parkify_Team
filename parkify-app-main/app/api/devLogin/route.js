import sql from '../../../config/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const jwtSecret = process.env.JWT_SECRET; // Ensure your .env file contains this
const saltRounds = 10; // Number of salt rounds for bcrypt hashing

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        // Input validation
        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: "Email and password are required." }),
                { status: 400 }
            );
        }

        // Fetch the developer user by email
        const developerResult = await sql`
      SELECT developer_id, email, password
      FROM developer
      WHERE email = ${email}
      LIMIT 1
    `;

        // Validate user existence
        if (developerResult.length === 0) {
            return new Response(
                JSON.stringify({ error: "Invalid email or password." }),
                { status: 401 }
            );
        }

        const developer = developerResult[0];

        // Transitional login: Check if the password is hashed or plaintext
        let passwordMatch = false;
        if (developer.password.startsWith('$2b$')) {
            // Password is already bcrypt-hashed
            passwordMatch = await bcrypt.compare(password, developer.password);
        } else {
            // Password is plaintext, compare directly
            passwordMatch = password === developer.password;

            if (passwordMatch) {
                // If plaintext password matches, hash it and update the database
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                await sql`
          UPDATE developer
          SET password = ${hashedPassword}
          WHERE developer_id = ${developer.developer_id}
        `;
                console.log(`Password for developer_id ${developer.developer_id} has been updated to bcrypt.`);
            }
        }

        // If password does not match, return an error
        if (!passwordMatch) {
            return new Response(
                JSON.stringify({ error: "Invalid email or password." }),
                { status: 401 }
            );
        }

        // Generate a JWT token
        const token = jwt.sign(
            {
                developer_id: developer.developer_id,
                email: developer.email,
                role: "developer", // Include role or other claims if needed
            },
            jwtSecret, // Secret key
            { expiresIn: "1h" } // Token expiration time
        );

        // Dynamically set `Secure` for production cookies
        const isSecure = process.env.NODE_ENV === 'production';
        const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict${isSecure ? '; Secure' : ''}`;

        // Return success response with developer ID
        return new Response(
            JSON.stringify({ developer_id: developer.developer_id }),
            {
                status: 200,
                headers: {
                    'Set-Cookie': cookie,
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        console.error("Error during login:", error.message || error);
        return new Response(
            JSON.stringify({ error: "An error occurred during login." }),
            { status: 500 }
        );
    }
}
