const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const initialDictionaries = [
  { code: '0840', label: 'おはよう' },
  { code: '3341', label: 'さみしい' },
  { code: '14106', label: '愛してる' },
  { code: '49106', label: '至急連絡' },
  { code: '724106', label: 'なにしてる' },
];

async function main() {
  const defaultPassword = await bcrypt.hash('pass1234', 10);

  for (let i = 1; i <= 5; i++) {
    const userId = `user0${i}`;
    const displayName = `ユーザー${String.fromCharCode(64 + i)}`; // ユーザーA〜E

    await prisma.user.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        passwordHash: defaultPassword,
        displayName,
        dictionaries: {
          create: initialDictionaries,
        },
      },
    });
  }
  console.log('シードデータの投入が完了しました！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });