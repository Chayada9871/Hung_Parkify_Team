import sql from '../../../config/db';
import crypto from 'crypto';
import { promisify } from 'util';
import { generateKeyPair as generateKeyPairCb } from 'crypto';

const generateKeyPair = promisify(generateKeyPairCb);

export async function POST(req) {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      lineUrl,
      password,
      profilePic = null,
    } = await req.json();
    console.log('📥 Received registration data:');
    console.log('📥 Incoming lessor data:', {
      firstName,
      lastName,
      phoneNumber,
      lineUrl,
      email,
      password,
    });

    // ✅ Validate input
    if (!firstName || !lastName || !email || !phoneNumber || !lineUrl || !password) {
      console.log('❌ Missing required fields');
      return new Response(JSON.stringify({ error: 'All fields are required.' }), { status: 400 });
    }

    const phoneCheck = await sql`
      SELECT lessor_id FROM lessor WHERE lessor_phone_number = ${phoneNumber}
    `;
    if (phoneCheck.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Phone number already exists. Please use a different phone number.' }),
        { status: 400 }
      );
    }
    // Check for existing email
    const emailCheck = await sql`
      SELECT lessor_id FROM lessor WHERE lessor_email = ${email}
    `;
    if (emailCheck.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Email already exists. Please use a different email address.' }),
        { status: 400 }
      );
    }


    // 🔐 Generate RSA key pair and AES key
    console.log('🔐 Generating RSA and AES keys...');
    const { publicKey, privateKey } = await generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    const aesKey = crypto.randomBytes(32).toString('hex');

    const insertLessor = await sql`
    INSERT INTO lessor (
      lessor_firstname,
      lessor_lastname,
      lessor_email,
      lessor_phone_number,
      lessor_line_url,
      lessor_profile_pic,
      lessor_password
    ) VALUES (
      ${firstName},
      ${lastName},
      ${email},
      ${phoneNumber},
      ${lineUrl},
      ${profilePic},
      pgp_sym_encrypt(${password}, 'parkify-secret')
    )
    RETURNING lessor_id
  `;

  if (insertLessor.length === 0) {
    console.error('❌ Insertion failed');
    return new Response(JSON.stringify({ error: 'Registration failed.' }), { status: 500 });
  }

  const lessorId = insertLessor[0].lessor_id;

  const encryptedSessionKeyResult = await sql`
      SELECT pgp_sym_encrypt(${aesKey}, 'parkify-session-secret') AS encrypted
  `;
    
  const encryptedSessionKey = encryptedSessionKeyResult[0].encrypted;

  await sql`
  INSERT INTO lessor_keys (
    lessor_id,
    public_key,
    private_key,
    encrypted_session_key
  ) VALUES (
    ${lessorId},
    ${publicKey},
    pgp_sym_encrypt(${privateKey}, 'parkify-master-secret'),
    ${encryptedSessionKey}
  )
`;

    return new Response(JSON.stringify({
      message: 'Registration successful',
      lessor_id: lessorId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Registration error:', error.stack || error.message);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
