import sql from "../../../config/db";
import { decryptAESWithKey } from "/utils/auth"; // ✅ AES decryption function

function safeDecryptAES(value, sessionKey) {
  try {
    if (value && value.includes(':')) {
      console.log('🔓 Decrypting AES data...');
      const decrypted = decryptAESWithKey(value, sessionKey);
      console.log('✅ AES Decryption complete.');
      return decrypted;
    } else {
      console.log('ℹ️ Field not encrypted, returning raw value.');
      return value; // Not encrypted, return as-is
    }
  } catch (error) {
    console.error('❌ Decryption error:', error);
    return value; // In case of error, return original
  }
}

// ------------------- GET: Fetch parking lot details -------------------
export async function GET(req) {
  try {
    console.log('🔍 [API] Incoming request: GET /LocationandPrice');

    const { searchParams } = new URL(req.url);
    const parkingLotId = searchParams.get("id");

    console.log('📦 Extracted parkingLotId from URL:', parkingLotId);

    if (!parkingLotId) {
      console.error('❌ Missing parkingLotId');
      return new Response(
        JSON.stringify({ error: "Parking Lot ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔎 Querying parking and lessor details from database...');
    const result = await sql`
      SELECT 
        pl.location_name, 
        pl.price_per_hour, 
        pl.address,
        pl.location_url,
        pl.carpark,
        l.lessor_firstname,
        l.lessor_lastname,
        l.lessor_email, 
        l.lessor_phone_number AS lessor_phone,
        pgp_sym_decrypt(lk.encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
      FROM parking_lot AS pl
      JOIN lessor AS l ON pl.lessor_id = l.lessor_id
      JOIN lessor_keys AS lk ON l.lessor_id = lk.lessor_id
      WHERE pl.parking_lot_id = ${parkingLotId}
    `;

    console.log('✅ Query complete. Rows returned:', result.length);

    if (result.length === 0) {
      console.error('❌ No parking lot found with the given ID');
      return new Response(
        JSON.stringify({ error: "Parking lot not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const row = result[0];
    const sessionKey = row.session_key;
    console.log('🔑 Session Key extracted:', sessionKey);

    const decryptedData = {
      parkingCode: safeDecryptAES(row.location_name, sessionKey),
      price: `${row.price_per_hour} THB / HOURS`,
      address: safeDecryptAES(row.address, sessionKey),
      locationUrl: safeDecryptAES(row.location_url, sessionKey),
      carpark: row.carpark, // not encrypted
      lessorDetails: {
        lessor_firstname: safeDecryptAES(row.lessor_firstname, sessionKey),
        lessor_lastname: safeDecryptAES(row.lessor_lastname, sessionKey),
        lessor_email: safeDecryptAES(row.lessor_email, sessionKey),
        lessor_phone: safeDecryptAES(row.lessor_phone, sessionKey),
      }
    };

    console.log('✅ Decrypted data ready:', decryptedData);

    return new Response(JSON.stringify(decryptedData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ Full error:', error.message, error.stack);
    return new Response(
      JSON.stringify({
        error: "An error occurred while fetching data. Please try again later.",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
