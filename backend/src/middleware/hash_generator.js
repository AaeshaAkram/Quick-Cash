import bcrypt from 'bcryptjs';

const pin = '1234';
const saltRounds = 10;

bcrypt.hash(pin, saltRounds, function(err, hash) {
    if (err) {
        console.error("Error generating hash:", err);
        return;
    }
    console.log(`\n✅ Generated Hash for PIN '${pin}':\n${hash}\n`);
    console.log("Copy this new hash and replace the pin_hash in your 'cards' table.");
});