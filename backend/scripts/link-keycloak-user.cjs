const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
 const email=process.env.LINK_EMAIL, subject=process.env.LINK_SUBJECT;
 if(!email || !subject || !/^[0-9a-f-]{36}$/i.test(subject))throw new Error('Supply LINK_EMAIL and LINK_SUBJECT.');
 const issuer=(process.env.KEYCLOAK_URL || 'https://auth.chirocity.gov.et').replace(/\/$/,'')+'/realms/'+(process.env.KEYCLOAK_REALM || 'chirocity');
 await p.$transaction(async tx=>{
  const matches=await tx.user.findMany({where:{email:{equals:email,mode:'insensitive'}}});
  if(matches.length>1)throw new Error('Multiple accounts use this email; resolve explicitly.');
  const linked=await tx.user.findUnique({where:{keycloakSub:subject}});
  if(linked && (linked.email.toLowerCase()!==email.toLowerCase() || linked.keycloakIssuer!==issuer))throw new Error('Subject is already linked to another identity.');
  const user=linked || matches[0];
  if(user && (!user.isActive || (user.keycloakSub && user.keycloakSub!==subject)))throw new Error('Account disabled or already linked.');
  const role=await tx.role.findUniqueOrThrow({where:{name:'admin'}});
  const data={keycloakSub:subject,keycloakIssuer:issuer,roleId:role.id,passwordHash:'!chiro-auth-only'};
  const result=user ? await tx.user.update({where:{id:user.id},data}) : await tx.user.create({data:{...data,email:email.toLowerCase(),name:'City Administrator'}});
  console.log('Keycloak administrator linked. Local ID:',result.id);
 });
})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>p.$disconnect());
