import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
test('opt-in observation returns independent snapshots', async () => {
 assert.ok(existsSync(new URL('../src/exploration.js', import.meta.url)), 'observation feature missing');
 const { installObservation } = await import('../src/exploration.js');
 const target = {}; const state = { x: 1 };
 installObservation(target, '', () => state); assert.equal(target.crystalObservation, undefined);
 installObservation(target, '?exploration=1', () => state);
 target.crystalObservation().x = 99; assert.equal(target.crystalObservation().x, 1);
});
