import sql from '../../../config/db';
import {
  decryptAESWithKey,
  encryptAESWithKey,
  verifyJWT,
  verifyFieldSignature,
  signWithPrivateKey,
} from '/utils/auth';

// ------------------- GET -------------------
export async function GET(req) {
  try {
    console.log('🔍 Received GET /lessorFetchPark request');
    const { searchParams } = new URL(req.url);
    let lessorId = searchParams.get('lessorId');
    console.log('📦 Lessor ID:', lessorId);

    const jwtVerification = await verifyJWT(req);
    console.log('🛡️ JWT verification result:', jwtVerification);

    if (!jwtVerification.isValid) {
      console.log('⛔ Invalid JWT');
      return new Response(JSON.stringify({ error: jwtVerification.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!lessorId) lessorId = jwtVerification.lessorId;

    if (!lessorId) {
      console.error('❌ Missing lessorId');
      return new Response(JSON.stringify({ error: 'Missing lessorId' }), { status: 400 });
    }

    const sessionKey = jwtVerification.sessionKey;
    const publicKey = jwtVerification.publicKey;

    console.log('🔑 Fetching parking lots from DB...');
    const parkingLots = await sql`
      SELECT parking_lot_id, location_name, address, location_url, total_slots, price_per_hour, carpark,
             location_name_signature, address_signature, location_url_signature
      FROM parking_lot
      WHERE lessor_id = ${lessorId}
    `;

    console.log(`✅ ${parkingLots.length} parking lots fetched`);

    if (parkingLots.length === 0) {
      return new Response(JSON.stringify({ parkingLots: [] }), { status: 200 });
    }

    const decryptedLots = [];

    for (const lot of parkingLots) {
      try {
        console.log('🔍 Verifying lot ID:', lot.parking_lot_id,lot.location_name_signature);
    
        if (!lot.location_name || !lot.location_name_signature) {
          console.error(`⚠️ Skipping lot ${lot.parking_lot_id}: Missing location_name or signature`);
          continue;
        }
        if (!lot.address || !lot.address_signature) {
          console.error(`⚠️ Skipping lot ${lot.parking_lot_id}: Missing address or signature`);
          continue;
        }
        if (!lot.location_url || !lot.location_url_signature) {
          console.error(`⚠️ Skipping lot ${lot.parking_lot_id}: Missing location_url or signature`);
          continue;
        }
    
        const isLocationNameValid = verifyFieldSignature( lot.location_name_signature, lot.location_name, publicKey);
        console.log(`${isLocationNameValid}`);

        const isAddressValid = verifyFieldSignature( lot.address_signature, lot.address,publicKey);
        const isUrlValid = verifyFieldSignature( lot.location_url_signature, lot.location_url, publicKey);

        if (!isLocationNameValid) {
          console.error(`❌ Signature verification failed: location_name for lot ${lot.parking_lot_id}`);
          continue;
        }
        if (!isAddressValid) {
          console.error(`❌ Signature verification failed: address for lot ${lot.parking_lot_id}`);
          continue;
        }
        if (!isUrlValid) {
          console.error(`❌ Signature verification failed: location_url for lot ${lot.parking_lot_id}`);
          continue;
        }
    
        const decryptedLot = {
          parking_lot_id: lot.parking_lot_id,
          location_name: decryptAESWithKey(lot.location_name, sessionKey),
          address: decryptAESWithKey(lot.address, sessionKey),
          location_url: decryptAESWithKey(lot.location_url, sessionKey),
          total_slots: lot.total_slots,
          price_per_hour: lot.price_per_hour,
          carpark: lot.carpark,
        };
    
        console.log(`✅ Successfully verified and decrypted lot ${lot.parking_lot_id}`);
        decryptedLots.push(decryptedLot);
    
      } catch (err) {
        console.error(`❌ Decrypt failed for lot ${lot.parking_lot_id}:`, err.message);
        continue;
      }
    }
    
    console.log(`✅ Successfully decrypted ${decryptedLots.length} parking lots`);
    return new Response(JSON.stringify({ parkingLots: decryptedLots }), { status: 200 });
    } catch (error) {
    console.error('❌ GET /lessorFetchPark Error:', error);
    return new Response(JSON.stringify({ error: 'Error fetching parking lots', details: error.message }), { status: 500 });
  }
}


// ------------------- POST -------------------
export async function POST(req) {
  try {
    console.log('📩 Received POST /lessorFetchPark');

    const jwtVerification = await verifyJWT(req);
    console.log('🛡️ JWT verification result:', jwtVerification);

    if (!jwtVerification.isValid) {
      console.log('⛔ Invalid JWT');
      return new Response(JSON.stringify({ error: jwtVerification.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionKey = jwtVerification.sessionKey;
    const privateKey = jwtVerification.privateKey;
    const lessorId = jwtVerification.lessorId;

    const { location_name, address, location_url, total_slots, price_per_hour, carpark } = await req.json();

    console.log('📥 Payload received:', { location_name, address, location_url, total_slots, price_per_hour });

    if (!location_name || !address || !location_url || !total_slots || !price_per_hour) {
      console.error('❌ Missing fields');
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    // ✅ Parse integer and float values correctly
    const parsedLessorId = parseInt(lessorId, 10);
    const parsedTotalSlots = parseInt(total_slots, 10);
    const parsedPrice = parseFloat(price_per_hour); // ✅ No encrypt, just store as number

    // 🔐 Encrypt only sensitive fields (location name, address, url)
    const encryptedLocationName = encryptAESWithKey(location_name, sessionKey);
    const encryptedAddress = encryptAESWithKey(address, sessionKey);
    const encryptedUrl = encryptAESWithKey(location_url, sessionKey);

    // ✍️ Sign fields (including price converted to string)
    const locationNameSig = signWithPrivateKey(encryptedLocationName, privateKey);
    const addressSig = signWithPrivateKey(encryptedAddress, privateKey);
    const urlSig = signWithPrivateKey(encryptedUrl, privateKey);

    console.log('📝 Inserting new parking lot...');
    console.log({
      parsedLessorId,
      encryptedLocationName,
      encryptedAddress,
      encryptedUrl,
      parsedTotalSlots,
      parsedPrice,
      carpark,
      locationNameSig,
      addressSig,
      urlSig,
      
    });

    const insertResult = await sql`
      INSERT INTO parking_lot (
        lessor_id,
        location_name,
        address,
        location_url,
        total_slots,
        available_slots,
        price_per_hour,
        carpark,
        location_name_signature,
        address_signature,
        location_url_signature
      ) VALUES (
        ${parsedLessorId},
        ${encryptedLocationName},
        ${encryptedAddress},
        ${encryptedUrl},
        ${parsedTotalSlots},
        ${parsedTotalSlots},
        ${parsedPrice},    -- ✅ Save real price here (as number)
        ${carpark},
        ${locationNameSig},
        ${addressSig},
        ${urlSig}
              )
      RETURNING parking_lot_id
    `;

    console.log('✅ Parking lot created:', insertResult[0].parking_lot_id);

    return new Response(JSON.stringify({
      parkingLotId: insertResult[0].parking_lot_id,
      fieldSignatures: {
        location_name: locationNameSig,
        address: addressSig,
        location_url: urlSig,
      }
    }), { status: 201 });

  } catch (error) {
    console.error('❌ POST /lessorFetchPark Error:', error);
    console.error('❌ Error details:', error.message);
    return new Response(JSON.stringify({ error: 'Error creating parking lot', details: error.message }), { status: 500 });
  }
}

//// ------------------- PUT -------------------
export async function PUT(req) {
  try {
    console.log('✏️ Received PUT /lessorFetchPark');

    const jwtVerification = await verifyJWT(req);
    console.log('🛡️ JWT verification:', jwtVerification);

    if (!jwtVerification.isValid) {
      console.error('❌ JWT invalid');
      return new Response(JSON.stringify({ error: jwtVerification.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionKey = jwtVerification.sessionKey;
    const privateKey = jwtVerification.privateKey;

    // ✅ Include parkingLotId here
    const {
      parkingLotId,
      lessorId,
      location_name,
      address,
      location_url,
      total_slots,
      price_per_hour,
      carpark
    } = await req.json();

    console.log('📥 Payload received:', {
      parkingLotId,
      location_name,
      address,
      location_url,
      total_slots,
      price_per_hour,
      carpark,
    });

    // ✅ Field validation
    if (
      !parkingLotId ||
      !location_name ||
      !address ||
      !location_url ||
      !total_slots ||
      !price_per_hour
    ) {
      console.error('❌ Missing fields');
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    const parsedTotalSlots = parseInt(total_slots, 10);
    const parsedPrice = parseFloat(price_per_hour);

    // 🔐 Encrypt only sensitive fields
    const encryptedLocationName = encryptAESWithKey(location_name, sessionKey);
    const encryptedAddress = encryptAESWithKey(address, sessionKey);
    const encryptedUrl = encryptAESWithKey(location_url, sessionKey);

    // ✍️ Sign encrypted fields (not price)
    const locationNameSig = signWithPrivateKey(encryptedLocationName, privateKey);
    const addressSig = signWithPrivateKey(encryptedAddress, privateKey);
    const urlSig = signWithPrivateKey(encryptedUrl, privateKey);

    console.log('🛠️ Updating parking lot...');
    await sql`
      UPDATE parking_lot
      SET location_name = ${encryptedLocationName},
          address = ${encryptedAddress},
          location_url = ${encryptedUrl},
          total_slots = ${parsedTotalSlots},
          price_per_hour = ${parsedPrice},
          carpark = ${carpark},
          location_name_signature = ${locationNameSig},
          address_signature = ${addressSig},
          location_url_signature = ${urlSig}
      WHERE parking_lot_id = ${parkingLotId}
    `;

    console.log('✅ Parking lot updated:', parkingLotId);
    return new Response(JSON.stringify({ message: 'Parking lot updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ PUT /lessorFetchPark Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error updating parking lot', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


// ------------------- DELETE -------------------
export async function DELETE(req) {
  try {
    console.log('🗑️ Received DELETE /lessorFetchPark');

    const { searchParams } = new URL(req.url);
    const parkingLotId = searchParams.get('parkingLotId');

    if (!parkingLotId) {
      console.error('❌ Missing parkingLotId');
      return new Response(JSON.stringify({ error: 'ParkingLot ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🧹 Deleting parking lot ID:', parkingLotId);

    const deleteResult = await sql`
      DELETE FROM parking_lot
      WHERE parking_lot_id = ${parkingLotId}
      RETURNING parking_lot_id
    `;

    if (deleteResult.length === 0) {
      console.error('❌ Parking lot not found or already deleted');
      return new Response(JSON.stringify({ error: 'Parking lot not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Parking lot deleted:', parkingLotId);
    return new Response(JSON.stringify({ message: 'Parking lot deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ DELETE /lessorFetchPark Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error deleting parking lot', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
