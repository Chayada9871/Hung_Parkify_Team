// app/api/submitComplaint/route.js
import sql from '../../../config/db';

export async function POST(req) {
  try {
    const { complain, detail, userId } = await req.json();

    // Basic validation
    if (!complain || !detail || !userId) {
      console.error('Validation failed: Missing fields', { complain, detail, userId });
      return new Response(JSON.stringify({ error: 'All fields are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert data into the complain table
    const insertResult = await sql`
      INSERT INTO complain (submitter_id, complain, detail, user_type)
      VALUES (${userId}, ${complain}, ${detail}, 'renter')
      RETURNING complain_id
    `;

    if (insertResult.length === 0) {
      throw new Error('Database insertion failed');
    }

    return new Response(JSON.stringify({ message: 'Complaint submitted successfully', id: insertResult[0].id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while submitting your complaint' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
