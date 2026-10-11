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
  window.astraDesktop={setWindowTheme(){},integrationsStatus:async()=>({}),minecraftVersions:async()=>({versions:[{id:'1.21.1',type:'release'}],source:'bundled'}),recoverModpacks:async()=>[],listInstalledFiles:async()=>[],gameStatus:async()=>({running:false}),catalogSearch:async()=>({total:0,items:[]}),minecraftInstallStatus:async()=>({phase:'idle'}),onMinecraftInstallProgress:()=>()=>{},onGameProgress:()=>()=>{},onModpackProgress:()=>()=>{},customFontStatus:async()=>({active:false}),playerSkinStatus:async()=>({source:'local',model:'classic',skin:null,cape:null}),playerSkinPreview:async()=>({source:'local',model:'classic',skin:null,cape:null}),validateServer:async address=>{if(address.includes('/'))throw new Error('Bad address');return{};},serverStatus:async()=>({online:true,players:5,maxPlayers:20,ping:12,motd:'<script>alert(1)</script>',version:'1.21.1'}),playerSkinSource:async(source,model)=>({source,model,skin:null,cape:null}),installPlayerSkins:async profile=>({path:'C:/test/CustomSkinLoader.jar',filename:'CustomSkinLoader.jar',kind:'mods',profileId:profile.id}),selectPlayerTexture:async()=>null};
 });
 await page.goto(pathToFileURL(path.resolve('src/renderer/index.html')).href);
 await page.locator('[data-page=servers]').click();await page.locator('[data-server-add]').click();await page.locator('#server-form [name=name]').fill('Test server');await page.locator('#server-form [name=address]').fill('localhost:25565');await page.locator('#server-form button').click();
 await page.waitForFunction(()=>document.querySelector('.server-meta')?.textContent.includes('12 ms'));
 assert.match(await page.locator('.server-motd').innerText(),/<script>/);assert.equal(await page.locator('.server-motd script').count(),0);
 await page.locator('[data-server-edit]').click();await page.locator('#server-form [name=name]').fill('Updated server');await page.locator('#server-form button').click();assert.equal(await page.locator('.server-detail h2').innerText(),'Updated server');
 await page.locator('[data-page=accounts]').click();await page.locator('#player-skin-canvas').waitFor();
 await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#f00';ctx.fillRect(8,8,8,8);ctx.fillStyle='#00f';ctx.fillRect(24,8,8,8);skinInfo={source:'local',model:'classic',skin:canvas.toDataURL(),cape:null};render();await drawSkin();});
 const pixel=()=>page.evaluate(()=>[...document.querySelector('#player-skin-canvas').getContext('2d').getImageData(90,50,1,1).data]);assert.deepEqual(await pixel(),[255,0,0,255]);
 await page.locator('[data-skin-view=back]').click();await page.evaluate(()=>drawSkin());assert.deepEqual(await pixel(),[0,0,255,255]);
 await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle='#0f0';ctx.fillRect(12,1,10,16);skinInfo={source:'local',model:'classic',skin:null,cape:canvas.toDataURL()};render();await drawSkin();});
 assert.deepEqual(await page.evaluate(()=>[...document.querySelector('#player-skin-canvas').getContext('2d').getImageData(90,110,1,1).data]),[0,255,0,255]);
 await page.evaluate(()=>{window.astraDesktop.listInstalledFiles=async profileId=>[{path:'C:/test/CustomSkinLoader.jar',filename:'CustomSkinLoader.jar',kind:'mods',profileId}];});
 await page.locator('[data-skin-install]').click();await page.waitForFunction(()=>state.downloads?.some(item=>item.name==='CustomSkinLoader'));
 for(const locale of ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb']){
  const gaps=await page.evaluate(locale=>{state.language=locale;render();return networkKeys.filter(key=>networkText(key)===key);},locale);assert.deepEqual(gaps,[]);
 }
 await page.setViewportSize({width:900,height:560});const overflow=await page.evaluate(()=>document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth);assert.equal(overflow,false);
 await page.evaluate(()=>{state.language='ru';go('servers');});await page.locator('[data-server-remove]').click();await page.locator('[data-server-confirm-remove]').click();assert.equal(await page.locator('.server-card').count(),0);
 assert.deepEqual(errors,[]);console.log('UI OK: server CRUD, escaped MOTD, skin front/back, install, 12 languages, 900×560 layout.');
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
