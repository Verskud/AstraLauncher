const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loaderAvailable: backendAvailable } = require('../src/main/game-loader.cjs');

function renderer() {
  const options = ['Vanilla', 'Fabric', 'Quilt', 'Forge', 'NeoForge'].map(value => ({ value, disabled: false }));
  const loader = { options, value: 'Fabric', get selectedOptions() { return options.filter(option => option.value === this.value); } };
  const choice = { value: '26.1' };
  const note = { textContent: '' };
  const context = vm.createContext({ document: {
    addEventListener() {},
    querySelector(selector) { return { '#create-loader': loader, '#version-choice': choice, '#version-note': note }[selector]; },
  } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/renderer/core/versions.js'), 'utf8'), context);
  return { context, loader, choice, options };
}

test('renderer and backend agree on calendar versions and historical compatibility boundaries', () => {
  const { context } = renderer();
  for (const version of ['26.1', '26.1.1', '26.3', '27.1', '25.1', '1.12.2', '1.13.2', '1.14', '1.20.1', '1.20.2', '1.21.1', '26.1-snapshot-1', '24w14a', 'b1.7.3', 'invalid']) {
    for (const name of ['Vanilla', 'Fabric', 'Quilt', 'Forge', 'NeoForge']) {
      assert.equal(context.loaderAvailable(version, name), backendAvailable(version, name), `${version}: ${name}`);
    }
  }
  for (const name of ['Fabric', 'Quilt', 'NeoForge']) assert.equal(context.loaderAvailable('26.1', name), true);
});

test('creation picker allows calendar releases and retains snapshot and legacy restrictions', () => {
  const { context, loader, choice, options } = renderer();
  vm.runInContext("minecraftManifest = { versions: [{ id: '26.1', type: 'release' }, { id: '26.1-snapshot-1', type: 'snapshot' }, { id: '1.12.2', type: 'release' }] };", context);
  context.updateLoaderForVersion();
  assert.equal(loader.value, 'Fabric');
  for (const option of options) assert.equal(option.disabled, false, option.value);
  choice.value = '26.1-snapshot-1';
  context.updateLoaderForVersion();
  assert.equal(loader.value, 'Vanilla');
  for (const option of options) assert.equal(option.disabled, option.value !== 'Vanilla');
  choice.value = '1.12.2';
  context.updateLoaderForVersion();
  assert.deepEqual(options.filter(option => !option.disabled).map(option => option.value), ['Vanilla', 'Forge']);
});
