import sql from '../../../config/db';
import crypto from 'crypto';
import { promisify } from 'util';
import { generateKeyPair as generateKeyPairCb } from 'crypto';

const generateKeyPair = promisify(generateKeyPairCb);

export async function POST(req) {
  try {
    const { firstName, lastName, email, phoneNumber, password } = await req.json();
    console.log('📥 Received registration data:', { firstName, lastName, email, phoneNumber });

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
    }

    // Check for existing phone number
    const phoneCheck = await sql`
      SELECT user_id FROM user_info WHERE phone_number = ${phoneNumber}
    `;
    if (phoneCheck.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Phone number already exists. Please use a different phone number.' }),
        { status: 400 }
      );
    }

    // Check for existing email
    const emailCheck = await sql`
      SELECT user_id FROM user_info WHERE email = ${email}
    `;
    if (emailCheck.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Email already exists. Please use a different email address.' }),
        { status: 400 }
      );
    }

    console.log('🔐 Generating RSA key pair...');
    const { publicKey, privateKey } = await generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    const aesKey = crypto.randomBytes(32).toString('hex');

    const insertUser = await sql`
      INSERT INTO user_info (first_name, last_name, email, phone_number, password)
      VALUES (
        ${firstName},
        ${lastName},
        ${email},
        ${phoneNumber},
        pgp_sym_encrypt(${password}, 'parkify-secret')
      )
      RETURNING user_id
    `;

    if (insertUser.length === 0) {
      return new Response(
        JSON.stringify({ error: 'An error occurred while registering. Please try again.' }),
        { status: 500 }
      );
    }

    const userId = insertUser[0].user_id;

    const encryptedAesKey = await sql`
      SELECT pgp_sym_encrypt(${aesKey}, 'parkify-session-secret') AS encrypted
    `;
    const encryptedSessionKey = encryptedAesKey[0].encrypted;

    await sql`
      INSERT INTO user_keys (user_id, public_key, private_key, encrypted_session_key)
      VALUES (
        ${userId},
        ${publicKey},
        pgp_sym_encrypt(${privateKey}, 'parkify-master-secret'),
        ${encryptedSessionKey}
      )
    `;

    return new Response(JSON.stringify({
      message: 'register successful',
      user_id: userId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Registration Error:', error.message);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { status: 500 }
    );
  }
}
