import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateApiKey } from '../src/utils/crypto.js';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('changeme123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@batchtube.app' },
    update: {},
    create: {
      email: 'demo@batchtube.app',
      password_hash: passwordHash,
      plan: 'starter',
      webhook_secret: 'whsec_demo_123'
    }
  });

  const existingKey = await prisma.apiKey.findFirst({
    where: {
      user_id: user.id,
      name: 'Local Dev Key'
    }
  });

  if (existingKey) {
    console.log('Seed complete');
    console.log(`User: ${user.email}`);
    console.log('API key already exists for Local Dev Key.');
    return;
  }

  const apiKey = generateApiKey('bt_live_');

  await prisma.apiKey.create({
    data: {
      user_id: user.id,
      key_prefix: 'bt_live_',
      key_hash: apiKey.hash,
      name: 'Local Dev Key'
    }
  });

  console.log('Seed complete');
  console.log(`User: ${user.email}`);
  console.log(`API Key (save now): ${apiKey.plain}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
