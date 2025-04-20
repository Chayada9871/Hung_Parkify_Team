import sql from '../../../config/db'; // Adjust this path as needed

export async function POST(req) {
  try {
    const { email, password } = await req.json(); // Parse request JSON

    // Basic validation
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use parameterized query to safely fetch user data
    const userData = await sql`
      SELECT
        user_id,
        email,
        pgp_sym_decrypt(password::bytea, 'parkify-secret') AS decrypted_password
      FROM
        user_info
      WHERE
        email = ${email};  -- Parameterized query prevents injection
    `;

    // Check if user exists
    if (userData.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = userData[0];

    // Securely compare provided password with decrypted password
    if (password !== user.decrypted_password) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return success response without exposing sensitive data
    return new Response(JSON.stringify({ message: 'Login successful', user_id: user.user_id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database or server error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
