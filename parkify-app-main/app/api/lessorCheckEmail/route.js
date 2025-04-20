import sql from '../../../config/db';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), { status: 400 });
    }

    // Check if the email already exists
    const emailCheck = await sql`
      SELECT lessor_email 
      FROM lessor 
      WHERE lessor_email = ${email}
    `;

    if (emailCheck.length > 0) {
      return new Response(JSON.stringify({ error: 'Email already exists.' }), { status: 409 }); // 409 Conflict for existing resources
    }

    return new Response(JSON.stringify({ message: 'Email is available.' }), { status: 200 });
  } catch (error) {
    console.error('Error checking email:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again later.' }),
      { status: 500 }
    );
  }
}
