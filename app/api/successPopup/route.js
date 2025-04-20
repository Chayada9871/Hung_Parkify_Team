import sql from '../../../config/db';

export async function GET(req) {
    try {
        // Extract query parameters
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const parkingLotId = searchParams.get('parkingLotId');

        // Validate input
        if (!userId || !parkingLotId) {
            return new Response(
                JSON.stringify({ error: 'userId and parkingLotId are required.' }),
                { status: 400 }
            );
        }

        // Fetch user info
        const userInfo = await sql`
            SELECT first_name, last_name
            FROM user_info
            WHERE user_id = ${userId}
        `;

        if (userInfo.length === 0) {
            return new Response(
                JSON.stringify({ error: 'User not found.' }),
                { status: 404 }
            );
        }

        // Fetch parking lot info
        const parkingInfo = await sql`
            SELECT location_name
            FROM parking_lot
            WHERE parking_lot_id = ${parkingLotId}
        `;

        if (parkingInfo.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Parking lot not found.' }),
                { status: 404 }
            );
        }

        // Combine data
        const bookerName = `${userInfo[0].first_name} ${userInfo[0].last_name}`;
        const location = parkingInfo[0].location_name;

        // Return response
        return new Response(
            JSON.stringify({ bookerName, location }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching payment details:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error.' }),
            { status: 500 }
        );
    }
}
