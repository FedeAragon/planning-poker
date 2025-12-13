import { beforeEach } from 'vitest';
import { prisma } from '../lib/prisma';

beforeEach(async () => {
  // Clean database before each test
  await prisma.vote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.room.deleteMany();
});


