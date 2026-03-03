import { PrismaClient } from '@prisma/client';

// Create a single instance of PrismaClient
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

// Handle connection events
prisma.$connect()
  .then(() => {
    console.log(' Database bağlantısı başarılı');
  })
  .catch((error) => {
    console.error(' Database bağlantısı başarısız:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log(' Database bağlantısı kesildi');
});

export default prisma;







