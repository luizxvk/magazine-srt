const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const r = await p.systemConfig.upsert({
    where: { key: 'rovex_api_secret' },
    update: { value: 'd02f8167de205843fd54b9c0cd30b3de6be23428c439e3aac7592c03976072df' },
    create: { key: 'rovex_api_secret', value: 'd02f8167de205843fd54b9c0cd30b3de6be23428c439e3aac7592c03976072df' }
  });
  console.log('Updated:', JSON.stringify(r));
  await p[String.fromCharCode(36)+'disconnect']();
}
main();
