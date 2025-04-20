// app/api/adFetchRenter/route.js
import sql from '../../../config/db';  // Ensure your database configuration is correct

export  async function GET(req) {
    const { searchParams } = new URL(req.url);
    const lessorId = searchParams.get('lessor_id');
  
    try {
      let lessorResult;
      
      // If userId is provided, fetch a single renter; otherwise, fetch all renters
      if (lessorId) {
        lessorResult = await sql`
          SELECT lessor_id, lessor_firstname, lessor_lastname
          FROM lessor
          WHERE lessor_id = ${lessorId}
        `;
      } 
      else {
        lessorResult = await sql`
          SELECT lessor_id, lessor_firstname, lessor_lastname
          FROM lessor
        `;}
      
        if (lessorResult.length === 0) {
            return new Response(JSON.stringify({ error: 'No reservations found' }), { status: 404 });
          }
      
          return new Response(JSON.stringify({ lessorDetails:lessorResult }), { status: 200 });
        } 
          catch (error) {
          console.error('Database Error:', error);
          return new Response(JSON.stringify({ error: 'Error fetching data' }), { status: 500 });
        }
      }


      export async function PUT(req) {
        try {
          // Parse JSON input from the request body
          const { lessor_id, lessor_firstname, lessor_phone_number, lessor_line_url } = await req.json();
      
          // Validate required fields
          if (!lessor_id) {
            return new Response(JSON.stringify({ error: 'Lessor ID is required' }), { status: 400 });
          }
      
          // Prepare fields to be updated
          const updateData = {};
          if (lessor_firstname) updateData.lessor_firstname = lessor_firstname;
          if (lessor_phone_number) updateData.lessor_phone_number = lessor_phone_number;
          if (lessor_line_url) updateData.lessor_line_url = lessor_line_url;
      
          // Ensure at least one field is being updated
          if (Object.keys(updateData).length === 0) {
            return new Response(JSON.stringify({ error: 'At least one field must be updated' }), { status: 400 });
          }
      
          // Execute the SQL UPDATE query
          const updatedRecord = await sql`
            UPDATE lessor
            SET ${sql(updateData)}
            WHERE lessor_id = ${lessor_id}::bigint
            RETURNING *;
          `;
      
          // Check if the record was updated
          if (updatedRecord.length === 0) {
            return new Response(JSON.stringify({ error: 'No record found for the given Lessor ID' }), { status: 404 });
          }
      
          // Respond with the updated record
          return new Response(JSON.stringify({ message: 'Lessor information updated successfully', data: updatedRecord[0] }), { status: 200 });
        } catch (error) {
          console.error('Update Error:', error);
          return new Response(JSON.stringify({ error: 'Error updating data', details: error.message }), { status: 500 });
        }
      }
      
      export async function DELETE(req) {
        const { searchParams } = new URL(req.url);
        const {lessor_id} = await req.json();
    
        if (!lessor_id) {
          console.error('Delete Error: Lessor ID is required');
          return new Response(JSON.stringify({ error: 'Lessor ID is required' }), { status: 400 });
        }
    
        try {
          console.log(`Attempting to delete lessor with ID: ${lessor_id}`);
          
          const deleteResult = await sql`
            DELETE FROM lessor WHERE lessor_id = ${lessor_id}
            RETURNING lessor_id
          `;
    
          if (deleteResult.length === 0) {
            console.error(`Delete Error: User with ID ${lessor_id} not found`);
            return new Response(JSON.stringify({ error: 'lessor not found or could not be deleted' }), { status: 404 });
          }
          console.log(`car with ID ${lessor_id} deleted successfully`);
          return new Response(JSON.stringify({ message: 'car deleted successfully' }), { status: 200 });
        } catch (error) {
          console.error('Delete Error:', error);
          return new Response(JSON.stringify({ error: 'Error deleting lessor', details: error.message }), { status: 500 });
        }
    
        }

    
    
      
    