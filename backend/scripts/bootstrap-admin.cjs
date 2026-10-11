const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
(async () => {
  // Permissions
  const permissions = [
    { code: '*', name: 'All permissions', module: 'system' },
    { code: 'dashboard.view', name: 'View dashboard', module: 'dashboard' },
    { code: 'traders.read', name: 'View traders', module: 'traders' },
    { code: 'traders.create', name: 'Create traders', module: 'traders' },
    { code: 'traders.update', name: 'Update traders', module: 'traders' },
    { code: 'traders.delete', name: 'Delete traders', module: 'traders' },
    { code: 'businesses.read', name: 'View businesses', module: 'businesses' },
    { code: 'businesses.create', name: 'Create businesses', module: 'businesses' },
    { code: 'businesses.update', name: 'Update businesses', module: 'businesses' },
    { code: 'businesses.delete', name: 'Delete businesses', module: 'businesses' },
    { code: 'licenses.read', name: 'View licenses', module: 'licenses' },
    { code: 'licenses.create', name: 'Create licenses', module: 'licenses' },
    { code: 'licenses.update', name: 'Update licenses', module: 'licenses' },
    { code: 'licenses.delete', name: 'Delete licenses', module: 'licenses' },
    { code: 'payments.read', name: 'View payments', module: 'finance' },
    { code: 'payments.create', name: 'Record payments', module: 'finance' },
    { code: 'finance.read', name: 'Finance read', module: 'finance' },
    { code: 'finance.write', name: 'Finance write', module: 'finance' },
    { code: 'inspections.read', name: 'View inspections', module: 'inspections' },
    { code: 'inspections.create', name: 'Create inspections', module: 'inspections' },
    { code: 'inspections.update', name: 'Update inspections', module: 'inspections' },
    { code: 'documents.read', name: 'View documents', module: 'documents' },
    { code: 'documents.create', name: 'Upload documents', module: 'documents' },
    { code: 'documents.update', name: 'Update document metadata', module: 'documents' },
    { code: 'documents.delete', name: 'Delete documents', module: 'documents' },
    { code: 'complaints.read', name: 'View complaints', module: 'complaints' },
    { code: 'complaints.update', name: 'Handle complaints', module: 'complaints' },
    { code: 'notifications.create', name: 'Send notifications', module: 'notifications' },
    { code: 'reports.read', name: 'View reports', module: 'reports' },
    { code: 'users.read', name: 'View users', module: 'users' },
    { code: 'roles.read', name: 'View roles', module: 'users' },
    { code: 'permissions.read', name: 'View permissions', module: 'users' },
  ];
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: {},
    });
  }

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    create: { name: 'admin', description: 'Full system control' },
    update: {},
  });
  const officerRole = await prisma.role.upsert({
    where: { name: 'officer' },
    create: { name: 'officer', description: 'Register and inspect traders' },
    update: {},
  });
  const financeRole = await prisma.role.upsert({
    where: { name: 'finance' },
    create: { name: 'finance', description: 'Manage payments and reports' },
    update: {},
  });
  const traderRole = await prisma.role.upsert({
    where: { name: 'trader' },
    create: { name: 'trader', description: 'View status and submit applications' },
    update: {},
  });

  const allPermIds = (await prisma.permission.findMany()).map((x) => x.id);
  const adminPermIds = allPermIds;
  const officerPermIds = (await prisma.permission.findMany({
    where: {
      code: {
        in: [
          'dashboard.view', 'traders.read', 'traders.create', 'traders.update',
          'businesses.read', 'businesses.create', 'businesses.update',
          'licenses.read', 'licenses.create', 'licenses.update',
          'inspections.read', 'inspections.create', 'inspections.update',
          'documents.read', 'documents.create', 'complaints.read', 'complaints.update',
        ],
      },
    },
  })).map((x) => x.id);
  const financePermIds = (await prisma.permission.findMany({
    where: {
      code: {
        in: [
          'dashboard.view', 'traders.read', 'businesses.read', 'licenses.read',
          'payments.read', 'payments.create', 'finance.read', 'finance.write',
          'reports.read', 'documents.read',
        ],
      },
    },
  })).map((x) => x.id);
  const traderPermIds = (await prisma.permission.findMany({
    where: {
      code: {
        in: ['dashboard.view', 'traders.read', 'businesses.read', 'licenses.read', 'complaints.read', 'documents.read'],
      },
    },
  })).map((x) => x.id);

  for (const permId of adminPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      create: { roleId: adminRole.id, permissionId: permId },
      update: {},
    }).catch(() => {});
  }
  for (const permId of officerPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: officerRole.id, permissionId: permId } },
      create: { roleId: officerRole.id, permissionId: permId },
      update: {},
    }).catch(() => {});
  }
  for (const permId of financePermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: financeRole.id, permissionId: permId } },
      create: { roleId: financeRole.id, permissionId: permId },
      update: {},
    }).catch(() => {});
  }
  for (const permId of traderPermIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: traderRole.id, permissionId: permId } },
      create: { roleId: traderRole.id, permissionId: permId },
      update: {},
    }).catch(() => {});
  }


 if (await prisma.user.findFirst({ where: { role: { name: 'admin' } } })) { console.log('Existing administrator retained.'); return; }
 const email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
 if (!email || !password || password.length < 16) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 16 characters).');
 await prisma.user.create({data:{email, passwordHash:await bcrypt.hash(password,12), name:'City Administrator',roleId:adminRole.id}});
 console.log('Initial administrator created.');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
