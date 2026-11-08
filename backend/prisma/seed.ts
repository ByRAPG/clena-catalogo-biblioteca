import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed(): Promise<void> {
  await prisma.schemaInfo.upsert({
    where: { id: -1 },
    update: {},
    create: {
      id: -1,
      note: 'Registro ficticio de desarrollo',
    },
  })
}

seed()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
