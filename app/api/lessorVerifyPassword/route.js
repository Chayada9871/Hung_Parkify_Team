import sql from '../../../config/db';

export async function POST(req) {
    try {
        const { lessor_id, currentPassword } = await req.json();

        if (!lessor_id || !currentPassword) {
            return new Response(
                JSON.stringify({ error: "lessor ID and current password are required" }),
                { status: 400 }
            );
        }

        // Query to get the stored password
        const passwordVerification = await sql`
         SELECT pgp_sym_decrypt (lessor_password::bytea, 'parkify-secret') as decrypted_password FROM lessor WHERE lessor_id = ${lessor_id}
     `;

        if (passwordVerification.length === 0) {
            return new Response(
                JSON.stringify({ error: "Lessor not found" }),
                { status: 404 }
            );
        }

        const storedPassword = passwordVerification[0];
        const isPasswordValid = currentPassword === storedPassword.decrypted_password;

        if (!isPasswordValid) {
            return new Response(
                JSON.stringify({ error: "Current password is incorrect" }),
                { status: 401 }
            );
        }

        // Password matches
        return new Response(
            JSON.stringify({
                message: "Password verified successfully",
                decrypted_password: storedPassword.decrypted_password,
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error("Password Verification Error:", error);
        return new Response(
            JSON.stringify({ error: "Error verifying password" }),
            { status: 500 }
        );
    }
}