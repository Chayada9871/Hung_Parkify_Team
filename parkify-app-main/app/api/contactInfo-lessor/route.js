import sql from '../../../config/db';

export async function GET(req) {
    try {
        // Extract lessor ID from the query parameters
        const { searchParams } = new URL(req.url);
        const lessorId = searchParams.get('id');

        // Validate input
        if (!lessorId) {
            return new Response(
                JSON.stringify({ error: 'Lessor ID is required' }),
                { status: 400 }
            );
        }

        // Fetch lessor information using raw SQL
        const lessorInfo = await sql`
            SELECT lessor_firstname, lessor_lastname, lessor_phone_number, lessor_profile_pic
            FROM lessor
            WHERE lessor_id = ${lessorId}
        `;

        // Check if lessor information exists
        if (lessorInfo.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Lessor not found' }),
                { status: 404 }
            );
        }

        // Extract the lessor data
        const lessor = lessorInfo[0];

        // Return the data
        return new Response(
            JSON.stringify({
                lessor_firstname: lessor.lessor_firstname,
                lessor_lastname: lessor.lessor_lastname,
                lessor_phone_number: lessor.lessor_phone_number,
                lessor_profile_pic: lessor.lessor_profile_pic,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching lessor info:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        );
    }
}
