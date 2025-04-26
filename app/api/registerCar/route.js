import sql from '../../../config/db';
import { verifyJWT } from '/utils/auth';
import crypto from 'crypto'; // ✅ Node's crypto module

// 🔓 AES decryption helper
function decryptAES(encrypted, keyHex) {
  const [ivBase64, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const key = Buffer.from(keyHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function POST(req) {
  const jwtVerification = await verifyJWT(req);
  if (!jwtVerification.isValid) {
    return new Response(JSON.stringify({ error: jwtVerification.error }), { status: 401 });
  }

  const userId = jwtVerification.user.user_id;
  const sessionKey = jwtVerification.user.sessionKey; // ⛔️ Make sure to include this in your JWT or fetch from DB
  const { car_model, car_color, license_plate, carimage } = await req.json();

  if (!car_model || !car_color || !license_plate || !carimage) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  try {
    // ✅ Decrypt values
    const model = decryptAES(car_model, sessionKey);
    const color = decryptAES(car_color, sessionKey);
    const plate = decryptAES(license_plate, sessionKey);

    const insertResult = await sql`
      INSERT INTO car (user_id, car_model, car_color, license_plate, carimage)
      VALUES (${userId}, ${model}, ${color}, ${plate}, ${carimage})
      RETURNING car_id
    `;

    return new Response(JSON.stringify({
      message: 'Car registered successfully',
      carId: insertResult[0].car_id
    }), { status: 201 });

  } catch (error) {
    console.error('❌ Error registering car:', error);
    return new Response(JSON.stringify({ error: 'Error saving car to database' }), { status: 500 });
  }
}
