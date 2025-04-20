import sql from '../../../config/db';  // Ensure your database configuration is correct

export async function PUT(req) {
  try {
    const { issue_id, admin_id, issue_header, issue_detail, resolved_by, status } = await req.json();

    if (!issue_id) {
      return new Response(JSON.stringify({ error: 'ISSUE ID is required' }), { status: 400 });
    }

    const updateData = {};
    if (issue_header) updateData.issue_header = issue_header;
    if (issue_detail) updateData.issue_detail = issue_detail;
    if (resolved_by) updateData.resolved_by = resolved_by;
    if (status) updateData.status = status; // Ensure status is included

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
    }

    const updatedRows = await sql`
      UPDATE issue
      SET ${sql(updateData)}
      WHERE issue_id = ${issue_id}
      RETURNING issue_id
    `;

    if (updatedRows.length === 0) {
      throw new Error('Issue not found or could not be updated');
    }

    return new Response(JSON.stringify({ message: 'Issue information updated successfully' }), { status: 200 });

  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating ISSUE', details: error.message }), { status: 500 });
  }
}

  
  export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const issue_id = searchParams.get('issue_id');
  
    if (!issue_id) {
      console.error('Delete Error: Issueis required');
      return new Response(JSON.stringify({ error: 'Issue ID is required' }), { status: 400 });
    }
  
    try {
      console.log(`Attempting to delete issue with ID: ${issue_id}`);
  
      const deleteResult = await sql`
        DELETE FROM issue WHERE issue_id = ${issue_id}
        RETURNING issue_id
      `;
  
      if (deleteResult.length === 0) {
        console.error(`Delete Error: Issue with ID ${issue_id} not found`);
        return new Response(JSON.stringify({ error: 'Issue not found or could not be deleted' }), { status: 404 });
      }
  
      console.log(`Issue with ID ${issue_id} deleted successfully`);
      return new Response(JSON.stringify({ message: 'Issue deleted successfully' }), { status: 200 });
    } catch (error) {
      console.error('Delete Error:', error);
      return new Response(JSON.stringify({ error: 'Error deleting issue', details: error.message }), { status: 500 });
    }
  }
  