const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {createPlayerSkins,png}=require('../src/main/player-skins.cjs');
const id='00000000-0000-0000-0000-000000000001';
const fixture=(w,h)=>{const bytes=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.write('IHDR',12);bytes.writeUInt32BE(w,16);bytes.writeUInt32BE(h,20);return bytes;};
test('skin dimensions and malformed PNGs rejected',()=>{assert.throws(()=>png(Buffer.from('bad'),'skin'));assert.throws(()=>png(fixture(128,128),'skin'));assert.throws(()=>png(fixture(64,64),'cape'));assert.doesNotThrow(()=>png(fixture(64,32),'skin'));});
test('CustomSkinLoader installation uses correct instance/version and preserves user configuration',async()=>{
 const root=await fs.mkdtemp(path.join(process.cwd(),'tools','.skin-test-'));
 try{
 const requests=[];const skins=createPlayerSkins(root,{download:async request=>{requests.push(request);await fs.mkdir(path.join(root,'instances',id),{recursive:true});return {profileId:id};}});
 const input=path.join(root,'input.png');await fs.writeFile(input,fixture(64,64));await skins.importTexture(input,'skin');await skins.setSource('local','slim');
 const directory=path.join(root,'instances',id,'CustomSkinLoader');await fs.mkdir(directory,{recursive:true});const filename=path.join(directory,'CustomSkinLoader.json');await fs.writeFile(filename,JSON.stringify({cacheExpiry:75,loadlist:[{name:'User server',type:'CustomSkinAPI',root:'https://example.com/'}]}));
 await skins.install({id,version:'1.21.1',loader:'Fabric'},'Player');assert.equal(requests[0].gameVersion,'1.21.1');assert.equal(requests[0].profileId,id);assert.equal(requests[0].loader,'fabric');
 let config=JSON.parse(await fs.readFile(filename));assert.equal(config.cacheExpiry,75);assert.equal(config.loadlist[0].model,'slim');assert.equal(config.loadlist[1].name,'User server');assert.deepEqual(await fs.readFile(path.join(directory,'Astra','skins','Player.png')),fixture(64,64));
 await skins.prepare({id},'Player');config=JSON.parse(await fs.readFile(filename));assert.equal(config.loadlist.filter(item=>item.name==='AstraLocal').length,1);
 await skins.setSource('ely','classic');await skins.prepare({id},'Player');config=JSON.parse(await fs.readFile(filename));assert.equal(config.loadlist[0].name,'AstraEly');assert.equal(config.loadlist.some(item=>item.name==='AstraLocal'),false);
 await assert.rejects(()=>skins.prepare({id},'../escape'));
 await assert.rejects(()=>skins.install({id,version:'1.21.1',loader:'Vanilla'},'Player'));assert.equal(requests.length,1);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
