import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
test('held key is released on window focus loss', () => {
 const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
 const listeners = source.slice(source.indexOf("window.addEventListener('keydown'"), source.indexOf("document.querySelectorAll('.mobile-controls"));
 const window = new EventTarget(); const keys = new Set();
 vm.runInNewContext(listeners, { window, keys });
 const down = new Event('keydown'); Object.defineProperty(down, 'code', {value:'KeyW'});
 window.dispatchEvent(down); assert.equal(keys.has('KeyW'), true);
 window.dispatchEvent(new Event('blur')); assert.equal(keys.size, 0, 'held key persists after blur');
});
