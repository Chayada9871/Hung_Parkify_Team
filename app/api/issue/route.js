import sql from '../../../config/db';

export async function GET(req) {
  const issueId = req.nextUrl.searchParams.get('issueId');

  if (!issueId) {
    return new Response(JSON.stringify({ error: 'No issue ID provided' }), {
      status: 400,
    });
  }

  try {
    // Use SQL query to fetch the issue by issue_id
    const result = await sql`
      SELECT * FROM issue WHERE issue_id = ${parseInt(issueId)}
    `;
    
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'No issue found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while fetching issue details' }),
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { issue_id, new_status, developer_email } = await req.json();

    if (!issue_id || !new_status) {
      return new Response(JSON.stringify({ error: 'Issue ID and status are required' }), {
        status: 400,
      });
    }

    // Determine the value for resolved_by based on the new status
    const resolvedByValue = new_status === 'Not Started' ? null : developer_email;

    // Update issue status using SQL query
    const result = await sql`
      UPDATE issue 
      SET status = ${new_status}, resolved_by = ${resolvedByValue}
      WHERE issue_id = ${parseInt(issue_id)}
      RETURNING *
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to update issue or issue not found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while updating issue' }),
      { status: 500 }
    );
  }
}
