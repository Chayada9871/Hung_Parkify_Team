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
    console.log('🔍 Received GET /renterFetchCar request');
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('userId');
    console.log('📦 userId from URL:', userId);

    const jwtVerification = await verifyJWT(req);
    console.log('🛡️ JWT verification result:', jwtVerification);
    if (!jwtVerification.isValid) {
      console.log('⛔ Invalid JWT');
      return new Response(JSON.stringify({ error: jwtVerification.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!userId) userId = jwtVerification.userId;
    if (!userId) {
      console.log('⛔ Missing userId even after JWT');
      return new Response(JSON.stringify({ error: 'Missing user ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionKey = jwtVerification.sessionKey;
    const publicKey = jwtVerification.publicKey;

    console.log('🔑 Decrypting with session key and verifying with public key');
    const carsResult = await sql`
      SELECT car_id, carimage, car_model, car_color, license_plate,
             car_model_signature, car_color_signature, license_plate_signature
      FROM car
      WHERE user_id = ${userId}
    `;
    console.log('🚗 Cars fetched:', carsResult.length);

    if (carsResult.length === 0) {
      return new Response(JSON.stringify({ cars: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const decryptedCars = carsResult.map((car) => {
      try {
        console.log('🔍 Encrypted Model for car:', car.car_model);
        console.log('🔍 Signature:', car.car_model_signature);
        console.log('🔍 Decoded sig length:', Buffer.from(car.car_model_signature, 'base64').length);

        const isModelValid = verifyFieldSignature( car.car_model_signature, car.car_model, publicKey);
        const isColorValid = verifyFieldSignature(car.car_color_signature, car.car_color,  publicKey);
        const isPlateValid = verifyFieldSignature(car.license_plate_signature, car.license_plate,  publicKey);
        console.log('🚗 Cars fetched:', carsResult.length);

        if (!isModelValid || !isColorValid || !isPlateValid) {
          console.error(`Signature verification failed for car ${car.car_id}`);
          console.error('Model valid:', isModelValid);
          console.error('Color valid:', isColorValid);
          console.error('Plate valid:', isPlateValid);
          return null;
        }

        return {
          car_id: car.car_id,
          carimage: car.carimage,
          car_model: decryptAESWithKey(car.car_model, sessionKey),
          car_color: decryptAESWithKey(car.car_color, sessionKey),
          license_plate: decryptAESWithKey(car.license_plate, sessionKey),
        };
      } catch (error) {
        console.error(`Error processing car ${car.car_id}:`, error);
        return null;
      }
    }).filter(Boolean);

    if (decryptedCars.length === 0 && carsResult.length > 0) {
      console.error('All car records failed decryption or verification');
      return new Response(
        JSON.stringify({ 
          error: 'Data integrity error', 
          details: 'Could not decrypt any car records' 
        }), 
        { status: 500 }
      );
    }

    console.log('✅ Decryption and verification complete');
    return new Response(JSON.stringify({ cars: decryptedCars }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ GET /renterFetchCar Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error fetching car data', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ------------------- PUT -------------------
export async function PUT(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  console.log('🪪 JWT Token received (PUT):', token);

  const jwtVerification = await verifyJWT(req);
  if (!jwtVerification.isValid) {
    return new Response(JSON.stringify({ error: jwtVerification.error }), { status: 401 });
  }

  const sessionKey = jwtVerification.sessionKey;
  const privateKey = jwtVerification.privateKey;
  const { carId, car_model, car_color, license_plate, carimage } = await req.json();

  if (!carId || !car_model || !car_color || !license_plate) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    const encryptedModel = encryptAESWithKey(car_model, sessionKey);
    const encryptedColor = encryptAESWithKey(car_color, sessionKey);
    const encryptedPlate = encryptAESWithKey(license_plate, sessionKey);

    const modelSig = signWithPrivateKey(encryptedModel, privateKey);
    const colorSig = signWithPrivateKey(encryptedColor, privateKey);
    const plateSig = signWithPrivateKey(encryptedPlate, privateKey);

    await sql`
      UPDATE car
      SET car_model = ${encryptedModel},
          car_color = ${encryptedColor},
          license_plate = ${encryptedPlate},
          carimage = ${carimage}
      WHERE car_id = ${carId}
    `;

    return new Response(JSON.stringify({
      message: 'Car updated successfully',
      fieldSignatures: {
        car_model: modelSig,
        car_color: colorSig,
        license_plate: plateSig,
      }
    }), { status: 200 });
  } catch (error) {
    console.error('❌ PUT Error:', error);
    return new Response(JSON.stringify({ error: 'Error updating car' }), { status: 500 });
  }
}

// ------------------- DELETE -------------------
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const carId = searchParams.get('carId');

  if (!carId) {
    return new Response(JSON.stringify({ error: 'Car ID is required' }), { status: 400 });
  }

  try {
    const deleteResult = await sql`
      DELETE FROM car
      WHERE car_id = ${carId}
      RETURNING car_id
    `;

    if (deleteResult.length === 0) {
      return new Response(JSON.stringify({ error: 'Car not found or could not be deleted' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Car deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('❌ DELETE Error:', error);
    return new Response(JSON.stringify({ error: 'Error deleting car' }), { status: 500 });
  }
}
// ------------------- POST -------------------
export async function POST(req) {
  const jwtVerification = await verifyJWT(req);
  if (!jwtVerification.isValid) {
    return new Response(JSON.stringify({ error: jwtVerification.error }), { status: 401 });
  }

  const sessionKey = jwtVerification.sessionKey;
  const privateKey = jwtVerification.privateKey;
  const { userId, car_model, car_color, license_plate, carimage } = await req.json();

  if (!userId || !car_model || !car_color || !license_plate) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    const encryptedModel = encryptAESWithKey(car_model, sessionKey);
    const encryptedColor = encryptAESWithKey(car_color, sessionKey);
    const encryptedPlate = encryptAESWithKey(license_plate, sessionKey);

    const modelSig = signWithPrivateKey(encryptedModel, privateKey);
    const colorSig = signWithPrivateKey(encryptedColor, privateKey);
    const plateSig = signWithPrivateKey(encryptedPlate, privateKey);

    const insertResult = await sql`
      INSERT INTO car (
        user_id, car_model, car_color, license_plate, carimage,
        car_model_signature, car_color_signature, license_plate_signature
      )
      VALUES (
        ${userId}, ${encryptedModel}, ${encryptedColor}, ${encryptedPlate}, ${carimage},
        ${modelSig}, ${colorSig}, ${plateSig}
      )
      RETURNING car_id
    `;

    return new Response(JSON.stringify({
      carId: insertResult[0].car_id,
      fieldSignatures: {
        car_model: modelSig,
        car_color: colorSig,
        license_plate: plateSig,
      }
    }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error creating car' }), { status: 500 });
  }
}
