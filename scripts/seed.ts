import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config({ path: ".env" });

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB_NAME as string;

const SALT_ROUNDS = 10;

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Clear old data
  await db.collection("users").deleteMany({});
  await db.collection("vendors").deleteMany({});
  await db.collection("payouts").deleteMany({});
  await db.collection("payout_audits").deleteMany({});

  // Seed users with hashed passwords
  await db.collection("users").insertMany([
    {
      email: "ops@demo.com",
      password: await bcrypt.hash("ops123", SALT_ROUNDS),
      role: "OPS",
      name: "Ops User",
    },
    {
      email: "finance@demo.com",
      password: await bcrypt.hash("fin123", SALT_ROUNDS),
      role: "FINANCE",
      name: "Finance User",
    },
  ]);

  // Seed vendors
  await db.collection("vendors").insertMany([
    {
      name: "Acme Supplies",
      upi_id: "acme@upi",
      bank_account: "1234567890",
      ifsc: "HDFC0001234",
      is_active: true,
      createdAt: new Date(),
    },
    {
      name: "Global Traders",
      upi_id: "global@upi",
      is_active: true,
      createdAt: new Date(),
    },
  ]);

  console.log("✅ Seed complete (passwords hashed with bcrypt)");
  await client.close();
}

seed().catch(console.error);

