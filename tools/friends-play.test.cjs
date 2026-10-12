const test = require('node:test');
const assert = require('node:assert/strict');
const { createFriendsPlay } = require('../src/main/friends-play.cjs');
const profile = { id: '00000000-0000-0000-0000-000000000001', version: '1.21.1', loader: 'Fabric' };
const unsupported = () => { throw Object.assign(new Error('No matching release'), { code: 'NO_COMPATIBLE_VERSION' }); };

test('host mods are pinned to the selected Minecraft/loader and dependencies are returned', async () => {
  const requests = [], progress = [];
  const friends = createFriendsPlay({
    resolve: async request => ({ versionId: 'v-'+request.id, version: '1.0' }), listInstalled: async () => [],
    download: async request => { requests.push(request);return { profileId: request.profileId, filename: request.id+'.jar', installedDependencies: request.id==='pimmstPB'?[{filename:'fabric-api.jar',profileId:profile.id}]:[] }; },
    onProgress: value => progress.push(value.name),
  });
  const result = await friends.install(profile, true);
  assert.equal(result.ready,true);assert.equal(result.installed.length,3);
  assert.deepEqual(requests.map(request=>[request.id,request.gameVersion,request.loader,request.profileId,request.versionId]),[
    ['qANg5Jrr','1.21.1','fabric',profile.id,'v-qANg5Jrr'],['pimmstPB','1.21.1','fabric',profile.id,'v-pimmstPB'],
  ]);
  assert.deepEqual(progress,['e4mc','OfflineLAN']);
});
test('unsupported or Vanilla profiles never install an arbitrary version', async () => {
  let writes=0;
  const friends=createFriendsPlay({resolve:async()=>unsupported(),listInstalled:async()=>[],download:async()=>{writes++;}});
  assert.equal((await friends.plan({...profile,loader:'Vanilla'})).reason,'vanilla');
  assert.equal((await friends.plan({...profile,version:'1.12.2',loader:'Forge'})).reason,'unsupported');
  await assert.rejects(friends.install(profile,true));assert.equal(writes,0);
});
test('missing local-profile support is checked before installing e4mc', async () => {
  let writes=0;
  const friends=createFriendsPlay({resolve:async request=>request.id==='qANg5Jrr'?{versionId:'exact',version:'1'}:unsupported(),listInstalled:async()=>[],download:async()=>{writes++;return{};}});
  await assert.rejects(friends.install(profile,true),/LAN/);assert.equal(writes,0);
  assert.equal((await friends.install(profile,false)).ready,true);assert.equal(writes,1);
});
test('existing settings mod is reused and disabled JARs do not count as installed', async () => {
  const files=[{filename:'modrinth-deYSo63V-lan-properties.jar',kind:'mods'}, {filename:'modrinth-qANg5Jrr-e4mc.jar.disabled',kind:'mods',disabled:true}];
  const requests=[];
  const friends=createFriendsPlay({resolve:async()=>({versionId:'exact',version:'1'}),listInstalled:async()=>files,download:async request=>{requests.push(request.id);return{};}});
  const plan=await friends.plan(profile);assert.equal(plan.local.id,'deYSo63V');assert.equal(plan.tunnel.installed,false);
  await friends.install(profile,true);assert.deepEqual(requests,['qANg5Jrr']);
});
test('connection failures are shown as errors and partial installation remains recoverable', async () => {
  const broken=createFriendsPlay({resolve:async()=>{throw new Error('HTTP 503');},listInstalled:async()=>[],download:async()=>{throw new Error('unexpected');}});
  await assert.rejects(broken.plan(profile),/HTTP 503/);
  const friends=createFriendsPlay({resolve:async()=>({versionId:'exact',version:'1'}),listInstalled:async()=>[],download:async request=>{if(request.id==='pimmstPB')throw new Error('Network interrupted');return{filename:'e4mc.jar'};}});
  const result=await friends.install(profile,true);assert.equal(result.ready,false);assert.equal(result.installed[0].name,'e4mc');assert.match(result.error,/Network/);
});
test('metadata cache does not share the installed state between instances', async () => {
  const friends=createFriendsPlay({resolve:async()=>({versionId:'exact',version:'1'}),listInstalled:async id=>id===profile.id?[{filename:'e4mc-fabric.jar',kind:'mods'}]:[],download:async()=>({})});
  const first=await friends.plan(profile),second=await friends.plan({...profile,id:'00000000-0000-0000-0000-000000000002'});
  assert.equal(first.tunnel.installed,true);assert.equal(second.tunnel.installed,false);assert.equal(first.tunnel.installed,true);
});
