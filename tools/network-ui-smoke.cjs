const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Verskud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const context=await browser.newContext({viewport:{width:1000,height:700}}), page=await context.newPage(), errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.addInitScript(()=>{
  const profile={id:'00000000-0000-0000-0000-000000000001',name:'Test Fabric',loader:'Fabric',version:'1.21.1',art:'forest',mods:[]};
  localStorage.setItem('astra-v1',JSON.stringify({packs:[profile],profile:'Player',memory:4,theme:'dark',language:'ru'}));
  window.astraDesktop={setWindowTheme(){},integrationsStatus:async()=>({}),minecraftVersions:async()=>({versions:[{id:'1.21.1',type:'release'}],source:'bundled'}),recoverModpacks:async()=>[],listInstalledFiles:async()=>[],gameStatus:async()=>({running:false}),catalogSearch:async()=>({total:0,items:[]}),minecraftInstallStatus:async()=>({phase:'idle'}),onMinecraftInstallProgress:()=>()=>{},onGameProgress:callback=>{window.testGameProgress=callback;return()=>{};},onModpackProgress:()=>()=>{},customFontStatus:async()=>({active:false}),playerSkinStatus:async()=>({source:'local',model:'classic',skin:null,cape:null}),playerSkinPreview:async()=>({source:'local',model:'classic',skin:null,cape:null}),validateServer:async address=>{if(address.includes('/'))throw new Error('Bad address');return{};},serverStatus:async()=>({online:true,players:5,maxPlayers:20,ping:12,motd:'<script>alert(1)</script>',version:'1.21.1'}),playerSkinSource:async(source,model)=>({source,model,skin:null,cape:null}),installPlayerSkins:async profile=>({path:'C:/test/CustomSkinLoader.jar',filename:'CustomSkinLoader.jar',kind:'mods',profileId:profile.id}),selectPlayerTexture:async()=>null};
 });
 await page.goto(pathToFileURL(path.resolve('src/renderer/index.html')).href);
 await page.locator('[data-page=servers]').click();await page.locator('[data-server-add]').click();await page.locator('#server-form [name=name]').fill('Test server');await page.locator('#server-form [name=address]').fill('localhost:25565');await page.locator('#server-form button').click();
 await page.waitForFunction(()=>document.querySelector('.server-meta')?.textContent.includes('12 ms'));
 assert.match(await page.locator('.server-motd').innerText(),/<script>/);assert.equal(await page.locator('.server-motd script').count(),0);
 await page.locator('[data-server-edit]').click();await page.locator('#server-form [name=name]').fill('Updated server');await page.locator('#server-form button').click();assert.equal(await page.locator('.server-detail h2').innerText(),'Updated server');
 await page.locator('[data-page=accounts]').click();await page.locator('#player-skin-canvas').waitFor();
 await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#f00';ctx.fillRect(8,8,8,8);ctx.fillStyle='#00f';ctx.fillRect(24,8,8,8);skinInfo={source:'local',model:'classic',skin:canvas.toDataURL(),cape:null};render();await drawSkin();});
 const hasColor=color=>page.evaluate(color=>{const canvas=document.querySelector('#player-skin-canvas');const bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;const dominant=color.findIndex(value=>value===255);for(let i=0;i<bytes.length;i+=4)if(bytes[i+dominant]>120&&bytes[i+dominant]>bytes[i+(dominant+1)%3]*2&&bytes[i+dominant]>bytes[i+(dominant+2)%3]*2&&bytes[i+3]===255)return true;return false;},color);
 assert.equal(await hasColor([255,0,0]),true);
 const frontImage=await page.locator('#player-skin-canvas').evaluate(canvas=>canvas.toDataURL());
 await page.locator('#player-skin-canvas').dragTo(page.locator('#player-skin-canvas'),{sourcePosition:{x:50,y:150},targetPosition:{x:170,y:150}});
 assert.notEqual(await page.locator('#player-skin-canvas').evaluate(canvas=>canvas.toDataURL()),frontImage);
 await page.locator('[data-skin-view=back]').click();await page.evaluate(()=>drawSkin());assert.equal(await hasColor([0,0,255]),true);
 await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle='#0f0';ctx.fillRect(12,1,10,16);skinInfo={source:'local',model:'classic',skin:null,cape:canvas.toDataURL()};render();await drawSkin();});
 assert.equal(await hasColor([0,255,0]),true);
 await page.evaluate(()=>{window.astraDesktop.listInstalledFiles=async profileId=>[{path:'C:/test/CustomSkinLoader.jar',filename:'CustomSkinLoader.jar',kind:'mods',profileId}];});
 await page.locator('[data-skin-install]').click();await page.waitForFunction(()=>state.downloads?.some(item=>item.name==='CustomSkinLoader'));
 for(const locale of ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb']){
  const gaps=await page.evaluate(locale=>{state.language=locale;render();return networkKeys.filter(key=>networkText(key)===key);},locale);assert.deepEqual(gaps,[]);
 }
 await page.setViewportSize({width:900,height:560});const overflow=await page.evaluate(()=>document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth);assert.equal(overflow,false);
 await page.evaluate(()=>{
  state.language='ru';let file={path:'C:/test/mod.jar',filename:'mod.jar',kind:'mods',profileId:state.packs[0].id,disabled:false};
  window.astraDesktop.listInstalledFiles=async()=>[file];window.astraDesktop.toggleInstanceMod=async()=>{file={...file,disabled:!file.disabled,filename:file.disabled?'mod.jar':'mod.jar.disabled',path:file.disabled?'C:/test/mod.jar':'C:/test/mod.jar.disabled'};return file;};
  window.astraDesktop.checkModUpdates=async()=>({updates:[],unmatched:1,disabled:1});window.astraDesktop.cloneInstance=async(profile,name)=>({...profile,id:crypto.randomUUID(),name});window.astraDesktop.exportInstance=async()=>({files:1});window.astraDesktop.instanceScreenshots=async()=>[];window.astraDesktop.screenshotThumbnail=async()=>null;
  window.astraDesktop.elySignIn=async()=>({connected:true,name:'ElyPlayer'});window.astraDesktop.elyDisconnect=async()=>({connected:false});window.astraDesktop.elyCancel=async()=>{};
  selectedPack=state.packs[0].id;packTab='mods';go('pack');
 });
 await page.evaluate(()=>{
  let installed=false;
  window.astraDesktop.friendsPlayPlan=async()=>({tunnel:{id:'qANg5Jrr',name:'e4mc',version:'5',installed},local:{id:'pimmstPB',name:'OfflineLAN',version:'2',installed}});
  window.astraDesktop.installFriendsPlay=async(profile,localProfiles)=>{window.testFriendsRequest={profile,localProfiles};installed=true;return{ready:true,installed:[{filename:'e4mc.jar',name:'e4mc',kind:'mods',profileId:profile.id}]};};
 });
 await page.locator('[data-friends-play]').click();await page.locator('#friends-install-form').waitFor();assert.equal(await page.locator('#friends-local-profiles').isChecked(),true);
 await page.locator('#friends-install-form button').click();await page.locator('.friends-panel [data-launch]').waitFor();
 if(process.env.ASTRA_FRIENDS_SCREENSHOT)await page.locator('#modal').screenshot({path:process.env.ASTRA_FRIENDS_SCREENSHOT,animations:'disabled'});
 const friendsRequest=await page.evaluate(()=>window.testFriendsRequest);assert.equal(friendsRequest.profile.id,'00000000-0000-0000-0000-000000000001');assert.equal(friendsRequest.localProfiles,true);
 await page.locator('#modal').evaluate(element=>element.close());
 await page.evaluate(()=>{window.astraDesktop.friendsPlayPlan=()=>new Promise(resolve=>window.testFriendsResolve=resolve);});
 await page.locator('[data-friends-play]').click();await page.locator('.friends-panel').waitFor();await page.locator('#modal').evaluate(element=>element.close());
 await page.evaluate(()=>window.testFriendsResolve({reason:'vanilla',tunnel:null,local:null}));await page.waitForFunction(()=>!document.querySelector('#modal').open);
 await page.evaluate(()=>{window.astraDesktop.friendsPlayPlan=async()=>({tunnel:{id:'qANg5Jrr',name:'e4mc',version:'5',installed:false},local:null});});
 await page.locator('[data-friends-play]').click();await page.locator('#friends-local-profiles').waitFor();assert.equal(await page.locator('#friends-local-profiles').isChecked(),false);assert.equal(await page.locator('#friends-local-profiles').isDisabled(),true);
 await page.locator('#modal').evaluate(element=>element.close());await page.waitForFunction(()=>!document.querySelector('#modal').open);
 for(const locale of ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb']){
  const missing=await page.evaluate(locale=>{state.language=locale;return friendsKeys.filter(key=>friendsText(key)===key);},locale);assert.deepEqual(missing,[]);
 }
 await page.evaluate(()=>{state.language='ru';render();});
 await page.evaluate(()=>refreshInstalled(selectedPack));await page.evaluate(()=>render());await page.locator('[data-instance-toggle]').click();await page.waitForFunction(()=>document.querySelector('.mod-list-item.is-disabled'));assert.equal(await page.locator('[data-instance-toggle]').isEnabled(),true);await page.locator('[data-instance-toggle]').click();await page.waitForFunction(()=>!document.querySelector('.mod-list-item.is-disabled'));
 await page.locator('[data-instance-updates]').click();await page.locator('.updates-list').waitFor();await page.locator('#modal').evaluate(element=>element.close());
 await page.locator('[data-instance-clone]').click();await page.locator('#clone-instance-form [name=name]').fill('Cloned instance');await page.locator('#clone-instance-form button').click();await page.waitForFunction(()=>state.packs.some(pack=>pack.name==='Cloned instance'));
 await page.locator('[data-instance-export]').click();await page.locator('#export-instance-form button').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);
 await page.locator('[data-pack-tab=screenshots]').click();await page.waitForFunction(()=>document.querySelector('[data-screenshots-folder]'));assert.equal(await page.locator('[data-screenshots-folder]').count(),1);
 await page.locator('[data-page=accounts]').click();await page.locator('[data-ely-login]').click();await page.locator('#ely-login-form [name=username]').fill('example@example.com');await page.locator('#ely-login-form [name=password]').fill('test-only-password');await page.locator('#ely-login-form button').click();await page.waitForFunction(()=>state.accountMode==='ely');assert.equal(await page.locator('[data-skin-import]').count(),0);assert.equal(await page.locator('[data-ely-manage]').count(),1);await page.locator('[data-ely-disconnect]').click();await page.waitForFunction(()=>state.accountMode==='local');await page.locator('[data-skin-import=skin]').waitFor();
 await page.evaluate(()=>{state.theme='ocean';render();});await page.locator('[data-action=notifications]').click();const colors=await page.evaluate(()=>{const probe=document.createElement('span');probe.style.color='var(--purple)';document.body.append(probe);const result={actual:getComputedStyle(document.querySelector('.modal-mark')).color,expected:getComputedStyle(probe).color};probe.remove();return result;});assert.equal(colors.actual,colors.expected);await page.locator('#modal').evaluate(element=>element.close());
 for(const locale of ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb']){const gaps=await page.evaluate(locale=>{state.language=locale;render();return [...instanceKeys.filter(key=>instanceText(key)===key),...accountKeys.filter(key=>accountText(key)===key)];},locale);assert.deepEqual(gaps,[]);}
 await page.evaluate(()=>{state.language='ru';go('servers');});await page.locator('[data-server-remove]').click();await page.locator('[data-server-confirm-remove]').click();assert.equal(await page.locator('.server-card').count(),0);
 await page.evaluate(()=>{
  modpackPending=true;
  showModal('<p id="modpack-status"></p><div id="modpack-progress-bar"></div>');
  modpackProgressView({phase:'archive',receivedBytes:5242880,totalBytes:10485760,bytesPerSecond:1048576,message:'pack.mrpack'});
 });
 const archiveStatus=await page.locator('#modpack-status').innerText();assert.match(archiveStatus,/5\.0 МБ \/ 10\.0 МБ/);assert.match(archiveStatus,/1\.0 МБ\/с/);assert.doesNotMatch(archiveStatus,/0 из 0/);assert.equal(await page.locator('#modpack-progress-bar').evaluate(element=>element.style.width),'50%');
 await page.evaluate(()=>{modpackProgressView({phase:'resolving',message:'Получаем список файлов…'});});assert.doesNotMatch(await page.locator('#modpack-status').innerText(),/0 из 0/);
 await page.evaluate(()=>{modpackPending=false;modal.close();});
 await page.evaluate(()=>{state.consoleMode='manual';window.astraDesktop.openGameLog=async id=>{window.openedGameLog=id;};window.testGameProgress({phase:'error',profileId:state.packs[0].id,message:'Игра завершилась с кодом 1.',detail:'Exception: <script>alert(1)</script>'});});
 assert.match(await page.locator('#modal pre').innerText(),/<script>/);assert.equal(await page.locator('#modal pre script').count(),0);await page.locator('[data-launch-log]').click();assert.equal(await page.evaluate(()=>window.openedGameLog),await page.evaluate(()=>state.packs[0].id));await page.locator('#modal').evaluate(element=>element.close());
 await page.waitForFunction(()=>!document.querySelector('#modal').open);
 await require('./design-ui-check.cjs')(page);
 assert.deepEqual(errors,[]);console.log('UI OK: server CRUD, escaped MOTD, skin front/back, install, 12 languages, 900×560 layout, archive progress and speed.');
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
