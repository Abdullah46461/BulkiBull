import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoUser = {
  id: 'seed-user-local',
  email: 'demo@bulki.local',
  emailVerifiedAt: new Date(),
  passwordHash:
    'scrypt$16384$8$5$bulki-demo-salt-2026$l0b2gVrDjzHuFHyJMaut1uIqQho3-HXYMWY75GCMKxWRc56sj7bJCf00fhMLhjUktxs-ERLXRGWVmFrMTB0T_w',
};

const seedBulls = [
  {
    tagNumber: 'A-101',
    name: 'Буран',
    birthDate: '2025-03-12',
    breed: 'Абердин-ангусская',
    sex: 'MALE' as const,
    arrivalDate: '2025-09-15',
    initialWeight: 214,
    photoUrl: null,
    notes: 'Спокойный, хорошо ест концентраты.',
    weights: [
      { date: '2025-09-15', weight: 214, comment: 'Вес при поступлении' },
      { date: '2025-11-15', weight: 268, comment: 'Плановое взвешивание' },
      { date: '2026-01-15', weight: 326, comment: 'Хороший прирост' },
    ],
  },
  {
    tagNumber: 'A-102',
    name: 'Граф',
    birthDate: '2025-04-03',
    breed: 'Герефордская',
    sex: 'MALE' as const,
    arrivalDate: '2025-10-01',
    initialWeight: 198,
    photoUrl: null,
    notes: 'Активный, держать в основной группе.',
    weights: [
      { date: '2025-10-01', weight: 198, comment: 'Вес при поступлении' },
      { date: '2025-12-01', weight: 251, comment: null },
      { date: '2026-02-01', weight: 309, comment: 'Без замечаний' },
    ],
  },
  {
    tagNumber: 'B-203',
    name: null,
    birthDate: '2025-02-20',
    breed: 'Казахская белоголовая',
    sex: 'MALE' as const,
    arrivalDate: '2025-08-28',
    initialWeight: 226,
    photoUrl: null,
    notes: 'Нужен контроль аппетита после перегруппировки.',
    weights: [
      { date: '2025-08-28', weight: 226, comment: 'Вес при поступлении' },
      { date: '2025-10-28', weight: 279, comment: null },
      { date: '2025-12-28', weight: 334, comment: 'Стабильный прирост' },
    ],
  },
  {
    tagNumber: 'C-314',
    name: 'Марс',
    birthDate: '2025-05-18',
    breed: null,
    sex: 'MALE' as const,
    arrivalDate: '2025-11-05',
    initialWeight: 181,
    photoUrl: null,
    notes: null,
    weights: [
      { date: '2025-11-05', weight: 181, comment: 'Вес при поступлении' },
      { date: '2026-01-05', weight: 236, comment: null },
    ],
  },
];

const seedFeedStocks = [
  {
    type: 'hay' as const,
    currentStockKg: 1200,
    consumptionPerBullPerDayKg: 6.5,
  },
  {
    type: 'compound_feed' as const,
    currentStockKg: 280,
    consumptionPerBullPerDayKg: 2.2,
  },
];

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: {
      email: demoUser.email,
    },
    update: {
      emailVerifiedAt: demoUser.emailVerifiedAt,
      passwordHash: demoUser.passwordHash,
    },
    create: demoUser,
  });

  for (const seedBull of seedBulls) {
    const bull = await prisma.bull.upsert({
      where: {
        userId_tagNumber: {
          userId: user.id,
          tagNumber: seedBull.tagNumber,
        },
      },
      update: {
        name: seedBull.name,
        birthDate: new Date(seedBull.birthDate),
        breed: seedBull.breed,
        sex: seedBull.sex,
        arrivalDate: new Date(seedBull.arrivalDate),
        initialWeight: seedBull.initialWeight,
        photoUrl: seedBull.photoUrl,
        notes: seedBull.notes,
      },
      create: {
        userId: user.id,
        tagNumber: seedBull.tagNumber,
        name: seedBull.name,
        birthDate: new Date(seedBull.birthDate),
        breed: seedBull.breed,
        sex: seedBull.sex,
        arrivalDate: new Date(seedBull.arrivalDate),
        initialWeight: seedBull.initialWeight,
        photoUrl: seedBull.photoUrl,
        notes: seedBull.notes,
      },
    });

    await prisma.weightRecord.deleteMany({
      where: {
        bullId: bull.id,
      },
    });

    await prisma.weightRecord.createMany({
      data: seedBull.weights.map((weightRecord) => ({
        bullId: bull.id,
        date: new Date(weightRecord.date),
        weight: weightRecord.weight,
        comment: weightRecord.comment,
      })),
    });
  }

  for (const feedStock of seedFeedStocks) {
    await prisma.feedStock.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: feedStock.type,
        },
      },
      update: {
        currentStockKg: feedStock.currentStockKg,
        consumptionPerBullPerDayKg: feedStock.consumptionPerBullPerDayKg,
      },
      create: {
        userId: user.id,
        type: feedStock.type,
        currentStockKg: feedStock.currentStockKg,
        consumptionPerBullPerDayKg: feedStock.consumptionPerBullPerDayKg,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
