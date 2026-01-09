import { prisma } from '../src/lib/prisma';
(async function() {
  try {
    const u = await prisma.user.findUnique({ where: { email: 'admin@bellu.ch' }, select: { id: true, email: true, role: true } });
    console.log('user:', JSON.stringify(u, null, 2));
  } catch (err) {
    console.error('error querying user:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
