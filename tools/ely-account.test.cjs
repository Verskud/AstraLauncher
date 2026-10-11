const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),Module=require('node:module');
const originalLoad=Module._load;Module._load=function(name,...args){if(name==='electron')return{app:{},safeStorage:{}};return originalLoad.call(this,name,...args);};
const {createElyAccount}=require('../src/main/ely-account.cjs');Module._load=originalLoad;
const storage={isEncryptionAvailable:()=>true,encryptString:value=>Buffer.from(value.split('').reverse().join('')),decryptString:value=>value.toString().split('').reverse().join('')};
const response=token=>({accessToken:token,clientToken:'client',selectedProfile:{id:'0123456789abcdef0123456789abcdef',name:'ElyPlayer'}});
async function fixture(work){const root=await fs.mkdtemp(path.join(__dirname,'.ely-test-'));try{await work(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
test('sign-in sends 2FA correctly, stores no password, refreshes and disconnects',()=>fixture(async root=>{
 const requests=[],account=createElyAccount(root,{storage,request:async(route,body)=>{requests.push({route,body});return response(route==='/auth/refresh'?'new-token':'session-token');}});
 assert.equal((await account.status()).connected,false);await account.signIn({username:'user@example.com',password:'test-password',totp:'123456'});assert.equal(requests[0].body.password,'test-password:123456');const file=await fs.readFile(path.join(root,'ely-account.json'),'utf8');assert.equal(file.includes('test-password'),false);assert.equal(file.includes('session-token'),false);assert.equal((await account.status()).name,'ElyPlayer');assert.equal((await account.account()).token,'new-token');assert.equal(requests[1].body.accessToken,'session-token');await account.disconnect();assert.equal((await account.status()).connected,false);assert.equal(requests[2].route,'/auth/invalidate');
}));
test('cancelled login cannot restore a logged-out account',()=>fixture(async root=>{
 let finish;const account=createElyAccount(root,{storage,request:()=>new Promise(resolve=>{finish=resolve;})});const pending=account.signIn({username:'user@example.com',password:'test-password'});account.cancel();finish(response('token'));await assert.rejects(()=>pending,/отменён/);assert.equal((await account.status()).connected,false);
}));
