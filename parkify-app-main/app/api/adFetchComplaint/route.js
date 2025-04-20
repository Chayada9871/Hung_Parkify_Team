import sql from '../../../config/db';  // Ensure your database configuration is correct

// Fetch complaints
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const complainId = searchParams.get('complainId');

  try {
    let complaintsResult;

    // If complainId is provided, fetch a single complaint; otherwise, fetch all complaints
    if (complainId) {
      complaintsResult = await sql`
        SELECT complain_id, complain, detail, submitter_id, user_type
        FROM complain
        WHERE complain_id = ${complainId}
      `;
    } else {
      complaintsResult = await sql`
        SELECT complain_id, complain, detail, submitter_id, user_type
        FROM complain
      `;
    }

    if (complaintsResult.length === 0) {
      return new Response(JSON.stringify({ error: 'No complaints found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ complaints: complaintsResult }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
  }
}

// Update a complaint
export async function PUT(req) {
  try {
    const {
      complain_id,
      complain,
      detail,
      user_type,
    } = await req.json();

    if (!complain_id) {
      return new Response(JSON.stringify({ error: 'Complaint ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (complain) updateData.complain = complain;
    if (detail) updateData.detail = detail;
    if (user_type) updateData.user_type = user_type;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    await sql`
      UPDATE complain
      SET ${sql(updateData)}
      WHERE complain_id = ${complain_id}
    `;

    return new Response(JSON.stringify({ message: 'Complaint information updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating data' }), { status: 500 });
  }
}

// Delete a complaint
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const complainId = searchParams.get('complainId');

  if (!complainId) {
    console.error('Delete Error: Complaint ID is required');
    return new Response(JSON.stringify({ error: 'Complaint ID is required' }), { status: 400 });
  }

  try {
    console.log(`Attempting to delete complaint with ID: ${complainId}`);

    const deleteResult = await sql`
      DELETE FROM complain WHERE complain_id = ${complainId}
      RETURNING complain_id
    `;

    if (deleteResult.length === 0) {
      console.error(`Delete Error: Complaint with ID ${complainId} not found`);
      return new Response(JSON.stringify({ error: 'Complaint not found or could not be deleted' }), { status: 404 });
    }

    console.log(`Complaint with ID ${complainId} deleted successfully`);
    return new Response(JSON.stringify({ message: 'Complaint deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(JSON.stringify({ error: 'Error deleting complaint', details: error.message }), { status: 500 });
  }
}
