import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { MERCHANTS } from '@carbon/shared'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

async function main() {
  const factors = JSON.parse(
    readFileSync(join(__dirname, '../data/emission-factors-in-v1.json'), 'utf-8')
  )
  for (const f of factors) {
    await prisma.emissionFactor.upsert({
      where: { id: f.id },
      update: f,
      create: {
        ...f,
        validFrom: new Date(f.validFrom),
      },
    })
  }

  const catalog = JSON.parse(
    readFileSync(join(__dirname, '../data/packaging-catalog-v1.json'), 'utf-8')
  )
  for (const item of catalog) {
    await prisma.packagingCatalogItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    })
  }

  for (const m of MERCHANTS) {
    await prisma.merchantPackagingDefault.upsert({
      where: { id: m.merchant },
      update: {
        merchant: m.merchant,
        orderType: m.orderType,
        defaultBagGrams: m.defaultBagGrams,
        defaultContainerGrams: m.defaultContainerGrams,
        defaultCutleryGrams: m.defaultCutleryGrams,
        deliveryCo2eKgDefault: m.deliveryCo2eKgDefault,
      },
      create: {
        id: m.merchant,
        merchant: m.merchant,
        orderType: m.orderType,
        defaultBagGrams: m.defaultBagGrams,
        defaultContainerGrams: m.defaultContainerGrams,
        defaultCutleryGrams: m.defaultCutleryGrams,
        deliveryCo2eKgDefault: m.deliveryCo2eKgDefault,
      },
    })
  }

  const demoEmail = 'demo@carbon.local'
  const passwordHash = await bcrypt.hash('demo1234', 10)
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      passwordHash,
      name: 'Demo User',
      state: 'IN-UP',
    },
  })

  const existingVehicle = await prisma.vehicle.findFirst({ where: { userId: user.id } })
  if (!existingVehicle) {
    await prisma.vehicle.create({
      data: {
        userId: user.id,
        label: 'My Bike',
        fuelType: 'PETROL',
        mileageKmpl: 45,
      },
    })
  }

  console.log('Seed complete. Demo login: demo@carbon.local / demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
