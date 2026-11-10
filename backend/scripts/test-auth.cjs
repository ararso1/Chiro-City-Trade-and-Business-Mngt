const {IdentityLifecycle}=require('../dist/src/modules/auth/identity-lifecycle');
IdentityLifecycle.prototype.assertActive=async()=>{}; // Existing JWT tests; lifecycle has separate coverage.
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const crypto=require('node:crypto');
const jwt=require('jsonwebtoken');
const {JwtStrategy}=require('../dist/src/modules/auth/jwt.strategy');
const {KeycloakUserService}=require('../dist/src/modules/auth/keycloak-user.service');
const {AuthService}=require('../dist/src/modules/auth/auth.service');
const {authConfig}=require('../dist/src/modules/auth/auth.config');
const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=publicKey.export({format:'jwk'});jwk.kid='test';jwk.use='sig';jwk.alg='RS256';
let server,issuer;
let user;
const roles=['admin','officer','finance','trader'].map(name=>({id:name,name,rolePermissions:[{permission:{code:name==='admin'?'users.read':'dashboard.view'}}]}));
const prisma={role:{findMany:async({where})=>roles.filter(r=>where.name.in.includes(r.name)),findUnique:async({where})=>roles.find(r=>r.name===where.name)},user:{
 findUnique:async({where})=>where.id ? (user?.id===where.id?{...user,role:roles.find(r=>r.id===user.roleId)}:null) : (user?.keycloakSub===where.keycloakSub?user:null),
 findFirst:async()=>null,
 create:async({data})=>(user={id:'preserved-local-id',isActive:true,...data}),
 update:async({data})=>(user={...user,...data})
}};
function reset(){user={id:'preserved-local-id',email:'test@example.com',isActive:true,roleId:'admin',roleNames:['admin'],rolesValidAfter:0n,keycloakSub:'subject',keycloakIssuer:issuer};}
function claims(){return {sub:'subject',email:'test@example.com',email_verified:true,azp:'cctbm-web',typ:'Bearer',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60,iss:issuer,aud:'cctbm-api',resource_access:{'cctbm-api':{roles:['ADMIN']}}};}
async function authenticate(overrides={},algorithm='RS256'){
 const payload={...claims(),...overrides};
 const token=jwt.sign(payload,algorithm==='RS256'?privateKey:'wrong-secret',{algorithm,keyid:'test'});
 const strategy=new JwtStrategy({get:()=>undefined},prisma,new KeycloakUserService(prisma));
 return new Promise((resolve,reject)=>{strategy.success=resolve;strategy.fail=()=>reject(new Error('Unauthorized'));strategy.error=reject;strategy.authenticate({headers:{authorization:'Bearer '+token}});});
}
before(async()=>{server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({keys:[jwk]}));});await new Promise(r=>server.listen(0,'127.0.0.1',r));process.env.AUTH_MODE='keycloak';process.env.KEYCLOAK_URL='http://127.0.0.1:'+server.address().port;process.env.KEYCLOAK_REALM='test';issuer=authConfig().issuer;});
after(()=>new Promise(r=>server.close(r)));
test('valid signed token preserves the local ID and permissions',async()=>{reset();const result=await authenticate();assert.equal(result.sub,'preserved-local-id');assert.deepEqual(result.permissions,['users.read']);});
for(const [name,patch] of [
 ['wrong audience',{aud:'other-api'}],['wrong issuer',{iss:'https://wrong'}],['expired token',{exp:1}],['wrong client',{azp:'other-web'}],['ID token',{typ:'ID'}],['unverified email',{email_verified:false}],['missing email',{email:null}],['realm role only',{resource_access:{},realm_access:{roles:['ADMIN']}}],['other client role',{resource_access:{'other-api':{roles:['ADMIN']}}}],['unknown role',{resource_access:{'cctbm-api':{roles:['SUPER_ADMIN']}}}]
]) test('rejects '+name,async()=>{reset();await assert.rejects(authenticate(patch));});
test('rejects symmetric tokens',async()=>{reset();await assert.rejects(authenticate({},'HS256'));});
test('rejects disabled users',async()=>{reset();user.isActive=false;await assert.rejects(authenticate());});
test('rejects identity issuer mismatch',async()=>{reset();user.keycloakIssuer='https://other';await assert.rejects(authenticate());});
for(const role of ['OFFICER','FINANCE','TRADER'])test('maps '+role+' using application permissions',async()=>{reset();const result=await authenticate({resource_access:{'cctbm-api':{roles:[role]}}});assert.equal(result.role,role.toLowerCase());assert.deepEqual(result.permissions,['dashboard.view']);});
test('provisions authorized new identities without a local password',async()=>{user=null;await authenticate();assert.equal(user.passwordHash,'!chiro-auth-only');assert.equal(user.keycloakSub,'subject');});
test('refuses automatic email linking',async()=>{reset();user.keycloakSub=null;prisma.user.findFirst=async()=>user;try{await assert.rejects(authenticate());}finally{prisma.user.findFirst=async()=>null;}});
test('local password login blocked in central mode',async()=>{const service=new AuthService(prisma,{});await assert.rejects(service.login('x','x'),/Chiro Auth/);});

test('registered custom roles and multiple grants work',async()=>{reset();roles.push({id:'CASE_READER',name:'CASE_READER',rolePermissions:[{permission:{code:'traders.read'}}]});try{const result=await authenticate({resource_access:{'cctbm-api':{roles:['FINANCE','CASE_READER']}}});assert.deepEqual(new Set(result.roles),new Set(['finance','CASE_READER']));assert.deepEqual(new Set(result.permissions),new Set(['dashboard.view','traders.read']));}finally{roles.pop();}});
test('role changes reject older tokens',async()=>{reset();user.rolesValidAfter=BigInt(Math.floor(Date.now()/1000)+10);await assert.rejects(authenticate(),/roles changed/);});
