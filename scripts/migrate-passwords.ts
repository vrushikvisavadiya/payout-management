/**
 * One-time migration: hashes all plain-text passwords in the `users` collection.
 * Safe to run multiple times — skips users whose passwords are already hashed
 * (bcrypt hashes always start with "$2b$" or "$2a$").
 *
 * Run with:  npm run migrate:passwords
 */
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config({ path: ".env" });

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB_NAME as string;
const SALT_ROUNDS = 10;

async function migratePasswords() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const users = await db.collection("users").find({}).toArray();

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const pwd: string = user.password ?? "";

    // Already a bcrypt hash — skip
    if (pwd.startsWith("$2b$") || pwd.startsWith("$2a$")) {
      console.log(`⏭  Skipping ${user.email} (already hashed)`);
      skipped++;
      continue;
    }

    const hashed = await bcrypt.hash(pwd, SALT_ROUNDS);
    await db
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { password: hashed } });

    console.log(`✅  Hashed password for ${user.email}`);
    updated++;
  }

  console.log(
    `\nDone. ${updated} user(s) updated, ${skipped} already hashed.`,
  );
  await client.close();
}

migratePasswords().catch(console.error);
