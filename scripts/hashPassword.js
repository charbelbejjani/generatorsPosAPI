/**
 * Helper script to generate bcrypt password hash
 * Usage: node scripts/hashPassword.js your_password
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Usage: node scripts/hashPassword.js <password>');
  process.exit(1);
}

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

bcrypt.hash(password, BCRYPT_ROUNDS, (err, hash) => {
  if (err) {
    console.error('❌ Error hashing password:', err);
    process.exit(1);
  }

  console.log('\n✅ Password hashed successfully!\n');
  console.log('Hash:', hash);
  console.log('\nUse this hash in your INSERT query:');
  console.log(`\nINSERT INTO users (username, password, first_name, last_name, email, group_id, active)`);
  console.log(`VALUES ('admin', '${hash}', 'Admin', 'User', 'admin@example.com', 1, 1);\n`);
});
