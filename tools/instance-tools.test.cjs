const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createInstanceTools}=require('../src/main/instance-tools.cjs');
const {openZip}=require('../src/main/zip-reader.cjs');
const profile={id:'00000000-0000-0000-0000-000000000001',name:'Test',version:'1.21.1',loader:'Fabric',art:'forest'};
async function fixture(work){const root=await fs.mkdtemp(path.join(__dirname,'.instance-test-'));try{const dir=path.join(root,'instances',profile.id);await fs.mkdir(path.join(dir,'mods'),{recursive:true});await fs.writeFile(path.join(dir,'mods','mod.jar'),'original');await work(root,dir);}finally{await fs.rm(root,{recursive:true,force:true});}}
test('toggle preserves bytes and rejects collisions/traversal',()=>fixture(async(root,dir)=>{
 const tools=createInstanceTools(root);const disabled=await tools.toggle(profile.id,'mod.jar');assert.equal(disabled.disabled,true);assert.equal(await fs.readFile(disabled.path,'utf8'),'original');await tools.toggle(profile.id,disabled.filename);await fs.writeFile(path.join(dir,'mods','mod.jar.disabled'),'other');await assert.rejects(()=>tools.toggle(profile.id,'mod.jar'));assert.equal(await fs.readFile(path.join(dir,'mods','mod.jar'),'utf8'),'original');await assert.rejects(()=>tools.toggle(profile.id,'../mod.jar'));
}));
test('clone is independent; ZIP roundtrip includes settings and optional worlds, excludes credentials',()=>fixture(async(root,dir)=>{
 await fs.mkdir(path.join(dir,'config'));await fs.writeFile(path.join(dir,'config','settings.json'),'{}');await fs.mkdir(path.join(dir,'saves','World'),{recursive:true});await fs.writeFile(path.join(dir,'saves','World','level.dat'),'world');await fs.writeFile(path.join(dir,'integrations.json'),'secret');
 const tools=createInstanceTools(root),clone=await tools.clone(profile,'Clone',true),copy=path.join(root,'instances',clone.id);await fs.writeFile(path.join(copy,'mods','mod.jar'),'changed');assert.equal(await fs.readFile(path.join(dir,'mods','mod.jar'),'utf8'),'original');assert.equal(await fs.readFile(path.join(copy,'saves','World','level.dat'),'utf8'),'world');
 const filename=path.join(root,'pack.zip');await tools.exportZip(profile,filename,false);const zip=await openZip(filename);try{assert.ok(zip.entries.some(entry=>entry.name==='instance/config/settings.json'));assert.equal(zip.entries.some(entry=>entry.name.includes('saves/')),false);assert.equal(zip.entries.some(entry=>entry.name.includes('integrations.json')),false);}finally{await zip.close();}
 const imported=await tools.importZip(filename);assert.notEqual(imported.id,profile.id);assert.equal(await fs.readFile(path.join(root,'instances',imported.id,'mods','mod.jar'),'utf8'),'original');
}));
test('updates are version-filtered and failures preserve original mods; successful swap replaces old file',()=>fixture(async(root,dir)=>{
 const hash=crypto.createHash('sha512').update('original').digest('hex'),version={project_id:'project',id:'new-version',name:'New',game_versions:['1.21.1'],loaders:['fabric'],files:[{hashes:{sha512:'new'}}]};
 let fail=true;
 const tools=createInstanceTools(root,{api:async(_route,body)=>{assert.deepEqual(body.loaders,['fabric']);assert.deepEqual(body.game_versions,['1.21.1']);return{[hash]:version};},download:async request=>{assert.equal(request.versionId,'new-version');if(fail)throw new Error('Download failed');await fs.writeFile(path.join(root,'instances',request.profileId,'mods','new.jar'),'new');}});
 const result=await tools.checkUpdates(profile);assert.equal(result.updates.length,1);await assert.rejects(()=>tools.update(profile,result.updates[0]),/Download failed/);assert.equal(await fs.readFile(path.join(dir,'mods','mod.jar'),'utf8'),'original');fail=false;await tools.update(profile,result.updates[0]);assert.deepEqual(await fs.readdir(path.join(dir,'mods')),['new.jar']);
}));
