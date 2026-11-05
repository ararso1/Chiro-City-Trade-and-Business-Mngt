const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
(async () => {
 const adminRole=await prisma.role.findUniqueOrThrow({where:{name:'admin'}});
 if(process.env.AUTH_MODE==='keycloak') {console.log('Central authentication: local administrator bootstrap skipped.');return;}
 if (await prisma.user.findFirst({ where: { role: { name: 'admin' } } })) { console.log('Existing administrator retained.'); return; }
 const email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
 if (!email || !password || password.length < 16) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters).');
 await prisma.user.create({data:{email, passwordHash:await bcrypt.hash(password,12), name:'City Administrator',roleId:adminRole.id,roleNames:['admin']}});
 console.log('Initial administrator created.');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
