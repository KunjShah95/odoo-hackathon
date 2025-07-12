const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Demo Script - Learn how JWT works!

console.log('🔐 JWT Authentication Demo\n');

// 1. Check if JWT_SECRET is set
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'your_super_secret_jwt_key_here_make_it_long_and_random') {
  console.log('❌ Please update JWT_SECRET in your .env file!');
  console.log('💡 Generate a secure secret with:');
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

console.log('✅ JWT_SECRET is configured\n');

// 2. Create a sample JWT token
const sampleUserId = 'user-123-sample';
const sampleToken = jwt.sign(
  { userId: sampleUserId }, 
  jwtSecret, 
  { expiresIn: '7d' }
);

console.log('📝 Sample JWT Token Created:');
console.log('Token:', sampleToken);
console.log('Length:', sampleToken.length, 'characters\n');

// 3. Decode the token (without verification)
const decoded = jwt.decode(sampleToken, { complete: true });
console.log('🔍 Token Structure:');
console.log('Header:', decoded.header);
console.log('Payload:', decoded.payload);
console.log('Signature:', decoded.signature.substring(0, 20) + '...\n');

// 4. Verify the token
try {
  const verified = jwt.verify(sampleToken, jwtSecret);
  console.log('✅ Token Verification Success:');
  console.log('User ID:', verified.userId);
  console.log('Issued At:', new Date(verified.iat * 1000));
  console.log('Expires At:', new Date(verified.exp * 1000));
  console.log('Valid for:', Math.round((verified.exp - verified.iat) / 86400), 'days\n');
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}

// 5. Test invalid token
try {
  jwt.verify('invalid.token.here', jwtSecret);
} catch (error) {
  console.log('✅ Invalid token correctly rejected:', error.message.split(':')[0]);
}

// 6. Show how to use token in HTTP requests
console.log('\n📡 How to use this token in HTTP requests:');
console.log('Header: Authorization');
console.log('Value: Bearer ' + sampleToken.substring(0, 50) + '...');

console.log('\n🌐 Example cURL command:');
console.log(`curl -X GET http://localhost:5000/api/auth/profile \\`);
console.log(`  -H "Authorization: Bearer ${sampleToken}"`);

console.log('\n🎉 JWT Demo Complete!');
console.log('💡 Next steps:');
console.log('1. Start your server: npm run dev');
console.log('2. Test registration: POST /api/auth/register');
console.log('3. Test login: POST /api/auth/login');
console.log('4. Use returned token for protected routes');
