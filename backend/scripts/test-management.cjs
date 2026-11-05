const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ConfigService}=require('@nestjs/config');
const {validate}=require('class-validator');
const {plainToInstance}=require('class-transformer');
const {UsersService}=require('../dist/src/modules/users/users.service');
const {RolesService,administratorPermissions}=require('../dist/src/modules/users/roles.service');
const {CreateUserDto}=require('../dist/src/modules/users/management.dto');
const {KeycloakAdmin}=require('../dist/src/modules/auth/keycloak-admin');
const {PermissionsGuard}=require('../dist/src/modules/auth/permissions.guard');
const actor={sub:'actor',permissions:['users.create','users.read','users.update','roles.create','roles.update','roles.read','permissions.read','traders.read']};
const row=(name,codes)=>({id:name,name,rolePermissions:codes.map(code=>({permission:{id:code,code}}))});
function setup(){
 process.env.AUTH_MODE='keycloak';
 const all=[row('CUSTOM',['traders.read']),row('admin',administratorPermissions)];
 const db={role:{findMany:async({where})=>all.filter(r=>!where?.name?.in||where.name.in.includes(r.name)),findUnique:async()=>null,findUniqueOrThrow:async()=>all[0],create:async({data})=>data,upsert:async()=>null},user:{findFirst:async()=>null,findUnique:async()=>({id:'target',name:'Target',email:'target@example.com',role:{name:'CUSTOM'},roleNames:['CUSTOM'],isActive:true}),findUniqueOrThrow:async()=>({keycloakSub:'central-id'}),create:async({data})=>({id:'new-local',...data}),update:async({data})=>data,delete:async()=>{},count:async()=>0},permission:{findMany:async()=>[{id:'traders.read',code:'traders.read'}]}};
 return {db,users:new UsersService(db,new ConfigService()),roles:new RolesService(db,new ConfigService())};
}
test('a named admin has no bypass and a custom role needs no wildcard',()=>{
 const g=new PermissionsGuard({getAllAndOverride:key=>key==='anyPermissions'?undefined:['users.read']});
 const ctx=permissions=>({getHandler:()=>null,getClass:()=>null,switchToHttp:()=>({getRequest:()=>({user:{role:'admin',permissions}})})});
 assert.equal(g.canActivate(ctx(['users.read'])),true);
 assert.throws(()=>g.canActivate(ctx([])),/Insufficient/);
 assert.throws(()=>g.canActivate(ctx(['*'])),/Insufficient/);
});
test('finance aliases accept either configured permission',()=>{
 const g=new PermissionsGuard({getAllAndOverride:key=>key==='anyPermissions'?['finance.read','payments.read']:undefined});
 const ctx={getHandler:()=>null,getClass:()=>null,switchToHttp:()=>({getRequest:()=>({user:{permissions:['payments.read']}})})};
 assert.equal(g.canActivate(ctx),true);
});
test('creates central identity, roles and local subject before enabling sign-in',async t=>{
 const {users}=setup();
 t.mock.method(KeycloakAdmin.prototype,'createIdentity',async()=> 'central-id');
 const mapping=t.mock.method(KeycloakAdmin.prototype,'replaceRoles',async()=>{});
 const remote=t.mock.method(KeycloakAdmin.prototype,'request',async()=>{});
 const u=await users.create({name:'New User',email:'new@example.com',password:'Test-only-example1!',roleNames:['CUSTOM']},actor);
 assert.equal(u.keycloakSub,'central-id');
 assert.deepEqual(mapping.mock.calls[0].arguments,['central-id',['CUSTOM']]);
 assert.deepEqual(remote.mock.calls[0].arguments,['/users/central-id','PUT',{enabled:true,emailVerified:true}]);
 assert.notEqual(u.passwordHash,'Test-only-example1!');
});
test('cleans up a failed central identity without creating a local user',async t=>{
 const {users,db}=setup();let local=false;db.user.create=async()=>{local=true;};
 t.mock.method(KeycloakAdmin.prototype,'createIdentity',async()=> 'central-id');
 t.mock.method(KeycloakAdmin.prototype,'replaceRoles',async()=>{throw Error('mapping failed')});
 const remote=t.mock.method(KeycloakAdmin.prototype,'request',async()=>{});
 await assert.rejects(users.create({name:'New User',email:'new@example.com',password:'Test-only-example1!',roleNames:['CUSTOM']},actor),/mapping failed/);
 assert.equal(local,false);assert.deepEqual(remote.mock.calls[0].arguments,['/users/central-id','DELETE']);
});
test('rejects privilege escalation',async()=>{
 const {users}=setup();await assert.rejects(users.create({name:'A',email:'new@example.com',password:'Test-only-example1!',roleNames:['admin']},{...actor,permissions:['users.create']}),/beyond your own/);
});
test('replaces the role set and sets a barrier against older tokens',async t=>{
 const {users,db}=setup();const writes=[];db.user.update=async({data})=>{writes.push(data);return data};
 const mapping=t.mock.method(KeycloakAdmin.prototype,'replaceRoles',async()=>{});
 await users.update('target',{roleNames:['CUSTOM']},actor);
 assert.deepEqual(mapping.mock.calls[0].arguments,['central-id',['CUSTOM']]);assert.ok(writes[0].rolesValidAfter>0n);
});
test('prevents self deactivation',async()=>{const {users}=setup();await assert.rejects(users.update('actor',{isActive:false},actor),/yourself/);});
test('protects the last administrator',async()=>{
 const {users,db}=setup();db.user.findUnique=async()=>({id:'target',roleNames:['admin'],role:{name:'admin'}});
 await assert.rejects(users.update('target',{roleNames:['CUSTOM']},actor),/at least one/);
});
test('creates custom roles in the configured client',async t=>{
 const {roles}=setup();const ensure=t.mock.method(KeycloakAdmin.prototype,'ensureRole',async()=>{});
 const result=await roles.create({name:'CASE_READER',permissionIds:['traders.read']},actor);
 assert.equal(ensure.mock.calls[0].arguments[0],'CASE_READER');assert.equal(result.rolePermissions.create[0].permissionId,'traders.read');
});
test('imports names without automatic permissions',async t=>{
 const {roles,db}=setup();t.mock.method(KeycloakAdmin.prototype,'roles',async()=>[{id:'x',name:'NEW_ROLE'}]);
 const writes=[];db.role.upsert=async x=>{writes.push(x)};await roles.sync();assert.equal(writes[0].create.rolePermissions,undefined);
});
test('admin editor marks recovery grants as required',async()=>{
 const {roles}=setup();const rows=await roles.findAll();assert.ok(rows.find(r=>r.name==='admin').protectedPermissionNames.includes('roles.update'));assert.deepEqual(rows.find(r=>r.name==='CUSTOM').protectedPermissionNames,[]);
});
test('ordinary permissions can be removed from admin',async()=>{
 const {roles,db}=setup();db.role.findUniqueOrThrow=async()=>row('admin',[...administratorPermissions,'traders.read']);
 db.permission.findMany=async()=>administratorPermissions.map(code=>({id:code,code}));
 let saved;db.$transaction=async fn=>fn({rolePermission:{deleteMany:async()=>{},createMany:async({data})=>{saved=data}},role:{update:async()=>({name:'admin'})}});
 await roles.update('admin',{permissionIds:administratorPermissions},{...actor,permissions:[...administratorPermissions,'traders.read']});assert.equal(saved.some(p=>p.permissionId==='traders.read'),false);
});
test('required admin recovery permissions cannot be removed',async()=>{
 const {roles,db}=setup();db.role.findUniqueOrThrow=async()=>row('admin',[]);db.permission.findMany=async()=>[];
 await assert.rejects(roles.update('admin',{permissionIds:[]},actor),/management permissions/);
});
test('validates email, password and at least one role',async()=>{
 const errors=await validate(plainToInstance(CreateUserDto,{name:'',email:'invalid',password:'1',roleNames:[]}));
 for(const name of ['email','password','roleNames']) assert.ok(errors.some(e=>e.property===name));
});
test('central identity creation verifies email and requires a password change',async()=>{
 const admin=new KeycloakAdmin(new ConfigService());let sent;
 admin.request=async(path,method,body)=>{sent=body;return 'https://auth/users/created'};
 assert.equal(await admin.createIdentity({email:'new@example.com',firstName:'New',lastName:'User',password:'Test-only-example1!'}),'created');
 assert.equal(sent.emailVerified,true);assert.equal(sent.enabled,false);assert.equal(sent.credentials[0].temporary,true);
});
