const test = require('node:test');
const assert = require('node:assert/strict');
const { args, expand, matchesRules, LAUNCH_FEATURES } = require('../src/main/game-launch.cjs');

test('legacy and loader launch placeholders expand without aborting', () => {
  const substitutions = {
    auth_session: 'token:access-token:player-uuid', client: '', user_properties_map: '{}',
    quickPlayPath: '', quickPlaySingleplayer: '', quickPlayMultiplayer: '', quickPlayRealms: '',
  };
  assert.equal(expand('${auth_session}|${client}|${user_properties_map}', substitutions), 'token:access-token:player-uuid||{}');
  assert.deepEqual(args(['--quickPlaySingleplayer', '${quickPlaySingleplayer}'], substitutions), ['--quickPlaySingleplayer', '']);
});

test('manifest feature rules honor enabled flags and ordered allow or disallow rules', () => {
  assert.equal(LAUNCH_FEATURES.has_custom_resolution, true);
  assert.deepEqual(args([
    { rules: [{ action: 'allow', features: { has_custom_resolution: true } }], value: '--width' },
    { rules: [{ action: 'allow', features: { is_demo_user: true } }], value: '--demo' },
    { rules: [{ action: 'allow' }, { action: 'disallow', features: { has_quick_plays_support: true } }], value: '--legacy-quick-play' },
  ], {}), ['--width']);
  assert.equal(matchesRules({ rules: [{ action: 'allow' }, { action: 'disallow', features: { has_custom_resolution: true } }] }), false);
});

test('truly unknown argument placeholders still fail with a clear error', () => {
  assert.throws(() => expand('${unsupported}', {}), /Неизвестный параметр запуска: unsupported/);
});
