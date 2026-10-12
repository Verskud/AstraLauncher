const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createFriendsPlay } = require('../src/main/friends-play.cjs');
(async () => {
  const workspace = path.resolve(__dirname), root = await fs.mkdtemp(path.join(workspace,'.friends-network-'));
  if (!root.startsWith(workspace + path.sep)) throw new Error('Unexpected temporary path');
  try {

    const electronPath = require.resolve('electron');
    require.cache[electronPath] = { id:electronPath,filename:electronPath,loaded:true,exports:{app:{getPath:()=>root},shell:{}} };
    const downloads = require('../src/main/download.cjs');
    const friends = createFriendsPlay({resolve:downloads.resolveModrinth,download:downloads.download,listInstalled:downloads.listInstalled});
    const base = {id:'00000000-0000-0000-0000-000000000001'};
    for (const [version,loader] of [['1.21.1','Fabric'],['1.21.1','Quilt'],['1.20.1','Forge'],['1.21.1','NeoForge'],['1.12.2','Forge']]) {
      const plan = await friends.plan({...base,version,loader});
      console.log(JSON.stringify({version,loader,tunnel:plan.tunnel?.version,local:plan.local?.name,reason:plan.reason}));
      if(version==='1.12.2') assert.equal(plan.reason,'unsupported');
      else { assert.ok(plan.tunnel);assert.ok(plan.local); }
    }
    const profile={...base,version:'1.21.1',loader:'Fabric'};
    const result=await friends.install(profile,true);
    assert.equal(result.ready,true,result.error);assert.ok(result.installed.length>=2);
    const files=await downloads.listInstalled(profile.id);
    assert.ok(files.some(file=>file.filename.includes('modrinth-qANg5Jrr-')));
    assert.ok(files.some(file=>file.filename.includes('modrinth-pimmstPB-')));
    assert.ok(files.every(file=>file.path.startsWith(root+path.sep)));
    assert.equal((await friends.install(profile,true)).installed.length,0);
    console.log('Network OK: real matching releases, verified JARs and dependencies, repeat installation is idempotent.');
  } finally { await fs.rm(root,{recursive:true,force:true}); }
})().catch(error=>{console.error(error);process.exitCode=1;});
