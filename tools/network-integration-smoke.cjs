// Uses official services and an isolated, temporary instance; never the user's game folders.
const fs=require('node:fs/promises'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const {createPlayerSkins}=require('../src/main/player-skins.cjs');
async function run(){
 const workspace=path.resolve(__dirname),root=await fs.mkdtemp(path.join(workspace,'.skin-live-'));
 try{
 const originalLoad=Module._load;
 Module._load=function(name,...args){if(name==='electron')return{app:{getPath:()=>root},shell:{},safeStorage:{}};return originalLoad.call(this,name,...args);};
 const download=require('../src/main/download.cjs');Module._load=originalLoad;
 const skins=createPlayerSkins(root,{download:request=>download.download(request)});
 await skins.setSource('ely','classic');const appearance=await skins.remote('ErickSkrauch');assert.ok(appearance.skin?.startsWith('data:image/png;base64,'));
 const profile={id:'00000000-0000-0000-0000-000000000001',loader:'Fabric',version:'1.21.1'};
 const result=await skins.install(profile,'Player');assert.equal(result.profileId,profile.id);assert.equal(result.kind,'mods');assert.ok(result.path.startsWith(path.join(root,'instances',profile.id,'mods')+path.sep));
 await fs.access(result.path);console.log('Official Ely.by skin and Modrinth installation OK:',result.filename);
 }finally{if(!path.resolve(root).startsWith(workspace+path.sep))throw new Error('Unsafe temporary path');await fs.rm(root,{recursive:true,force:true});}
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
