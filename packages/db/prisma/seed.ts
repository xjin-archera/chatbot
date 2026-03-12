import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Add your seed data here
  console.log("Seeding database...");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
