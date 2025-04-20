// app/api/adFetchDeveloper/route.js
import sql from '../../../config/db'; // Ensure your database configuration is correct

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const developerId = searchParams.get('developerId');

    let developerResult;

    if (developerId) {
      developerResult = await sql`
        SELECT developer_id, email
        FROM developer
        WHERE developer_id = ${developerId}
      `;
    } else {
      developerResult = await sql`
        SELECT developer_id, email
        FROM developer
      `;
    }

    if (developerResult.length === 0) {
      return new Response(JSON.stringify({ error: 'No developers found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ developers: developerResult }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching developers' }), { status: 500 });
  }
}


// DELETE function to remove a developer by ID
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const developerId = searchParams.get('developerId');

  if (!developerId) {
    console.error('Delete Error: Developer ID is required');
    return new Response(JSON.stringify({ error: 'Developer ID is required' }), { status: 400 });
  }

  try {
    console.log(`Attempting to delete developer with ID: ${developerId}`);

    const deleteResult = await sql`
      DELETE FROM developer WHERE developer_id = ${developerId}
      RETURNING developer_id
    `;

    if (deleteResult.length === 0) {
      console.error(`Delete Error: Developer with ID ${developerId} not found`);
      return new Response(JSON.stringify({ error: 'Developer not found or could not be deleted' }), { status: 404 });
    }

    console.log(`Developer with ID ${developerId} deleted successfully`);
    return new Response(JSON.stringify({ message: 'Developer deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(JSON.stringify({ error: 'Error deleting developer', details: error.message }), { status: 500 });
  }
}
