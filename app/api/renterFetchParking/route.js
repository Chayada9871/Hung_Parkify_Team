import sql from '../../../config/db';
import { decryptAESWithKey } from '/utils/auth'; // ✅ ใช้ decrypt ด้วย sessionKey

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const locationName = searchParams.get('locationName');

  if (!locationName) {
    return new Response(JSON.stringify({ error: 'Location name is required' }), { status: 400 });
  }

  try {
    // 🔍 Fetch parking lots + lessor session keys
    const parkingResult = await sql`
      SELECT 
        p.parking_lot_id,
        p.location_name,
        p.address,
        p.available_slots,
        p.price_per_hour,
        k.public_key,
        pgp_sym_decrypt(k.encrypted_session_key::bytea, 'parkify-session-secret') AS session_key
      FROM parking_lot p
      JOIN lessor_keys k ON p.lessor_id = k.lessor_id
    `;

    console.log(`✅ Total parking lots fetched: ${parkingResult.length}`);

    // 🔓 Decrypt fields and filter
    const decryptedLots = parkingResult.map(lot => {
      try {
        const decryptedName = decryptAESWithKey(lot.location_name, lot.session_key);
        const decryptedAddress = decryptAESWithKey(lot.address, lot.session_key);
        return {
          parking_lot_id: lot.parking_lot_id,
          location_name: decryptedName,
          address: decryptedAddress,
          available_slots: lot.available_slots,
          price_per_hour: lot.price_per_hour,
        };
      } catch (err) {
        console.error(`❌ Decryption failed for lot ${lot.parking_lot_id}:`, err.message);
        return null;
      }
    }).filter(lot => lot && lot.location_name.toLowerCase().includes(locationName.toLowerCase()));

    console.log(`✅ Successfully decrypted and filtered ${decryptedLots.length} parking lots`);

    return new Response(JSON.stringify({ parkingLots: decryptedLots }), { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching parking data' }), { status: 500 });
  }
}