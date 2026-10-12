const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function checkDesign(page) {
  const screenshots = process.env.ASTRA_DESIGN_SHOTS;
  if (screenshots) fs.mkdirSync(screenshots, { recursive:true });
  const capture = async name => {
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().map(a => a.finished.catch(()=>{}))); });
    if (screenshots) await page.screenshot({path:path.join(screenshots,`${name}.png`)});
  };
  await page.evaluate(() => {
    state.packs = ['Тихая долина', 'Мир с друзьями', 'Create & Explore'].map((name,i)=>({id:`00000000-0000-0000-0000-00000000000${i+1}`,name,art:['forest','cherry','night'][i],loader:'Fabric',version:'1.21.1',mods:[]}));
    state.homeInstanceId = state.packs[0].id;
    window.astraDesktop.minecraftVersions=async()=>({versions:[{id:'1.21.1',type:'release',releaseTime:'2024-08-08T00:00:00Z'}],latest:{release:'1.21.1',snapshot:'1.21.1'},source:'live'});
    window.astraDesktop.launchGame=async args=>{window.designLaunch=args;};
    document.querySelector('#toast').classList.remove('show');
    state.language='ru';state.theme='dark';state.consoleMode='manual';go('discover');
  });
  await page.setViewportSize({width:1180,height:760});
  await capture('home-dark');
  assert.equal(await page.locator('.play-primary[data-launch]').count(),1);
  await page.locator('.play-primary').click();
  assert.equal(await page.evaluate(()=>window.designLaunch.id), '00000000-0000-0000-0000-000000000001');
  await page.evaluate(()=>document.querySelector('#toast').classList.remove('show'));
  await page.locator('.scene-secondary').click();
  assert.equal(await page.evaluate(()=>page),'pack');
  await page.evaluate(()=>go('library'));
  await capture('library-dark');
  await page.locator('#main [data-action=create]').first().click();
  await page.waitForFunction(()=>document.querySelector('#version-choice')?.value==='1.21.1');
  await capture('create-dark');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!modal.open);

  for (const theme of ['frost','sand','glass','ocean']) {
    await page.evaluate(theme=>{state.theme=theme;go('discover');},theme);
    await capture(`home-${theme}`);
  }
  await page.evaluate(()=>{state.theme='sand';settingsTab='appearance';go('settings');});
  await capture('appearance-sand');

  const colors = await page.evaluate(()=>({scheme:getComputedStyle(document.body).colorScheme,text:getComputedStyle(document.querySelector('h1')).color}));
  assert.equal(colors.scheme,'light');
  assert.equal(colors.text,'rgb(41, 50, 53)');
  await page.setViewportSize({width:900,height:560});
  for (const destination of ['discover','library','pack','settings','accounts','servers','downloads','mods']) {
    await page.evaluate(destination=>{selectedPack=state.packs[0].id;go(destination);},destination);
    assert.equal(await page.locator('#main').evaluate(el=>el.scrollWidth>el.clientWidth),false,`Overflow: ${destination}`);
  }
  await page.evaluate(()=>{go('accounts');});await capture('accounts-small');
  await page.evaluate(()=>{state.packs=[];go('discover');});
  assert.equal(await page.locator('.play-primary[data-action=create]').count(),1);
  assert.equal(await page.locator('[data-launch]').count(),0);
  await capture('empty-small');


  assert.equal(await page.evaluate(()=>{go('library');const animation=pageEntrance;render();return pageEntrance===animation;}),true);
  await page.evaluate(()=>{for(const view of ['settings','library','downloads','discover'])go(view);});
  assert.equal(await page.locator('#main').evaluate(el=>el.getAnimations().length<=1),true);

  await page.evaluate(()=>{showModal('<h2>First</h2>');modal.close();showModal('<h2>Second</h2>');});
  await capture('dialog-reopened');
  assert.equal(await page.locator('#modal').evaluate(el=>el.open),true);
  assert.equal(await page.locator('#modal h2').innerText(),'Second');
  await page.evaluate(()=>{modpackPending=true;});
  await page.keyboard.press('Escape');
  await capture('cancel-confirmation');
  assert.equal(await page.locator('[data-modpack-confirm-cancel]').isVisible(),true);
  await page.evaluate(()=>{modpackPending=false;modal.close();});
  await page.waitForFunction(()=>!modal.open);

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{go('library');showModal('<h2>Reduced</h2>');});
  assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
  assert.equal(await page.evaluate(()=>{modal.close();return modal.open;}),false);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{state.animations=false;go('settings');});
  assert.equal(await page.evaluate(()=>document.getAnimations().length),0);

  await page.evaluate(()=>{state.animations=true;state.theme='dark';});
  for (const locale of ['ru','en','de','fr','es','ko','ja','zh-CN','zh-TW','ar','de-CH','nb']) {
    await page.evaluate(locale=>{state.language=locale;go('discover');},locale);
    assert.equal(await page.evaluate(()=>homeCopy[currentLanguage()].length),7);
    assert.equal(await page.locator('#main').evaluate(el=>el.scrollWidth>el.clientWidth),false,`Home overflow: ${locale}`);
    if(locale==='ar')await capture('home-arabic');
  }
  console.log('Design OK: 900×560 layouts, themes, home actions, rapid navigation, modal reopen/cancel, reduced motion, 12 locales.');
};
