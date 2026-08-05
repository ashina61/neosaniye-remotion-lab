import assert from 'node:assert/strict';
import {parseProviderJson} from './v9-json-parser.mjs';

assert.deepEqual(
  parseProviderJson('{"scenes":[{"sceneId":1}]}'),
  {scenes: [{sceneId: 1}]},
);
assert.deepEqual(
  parseProviderJson('```json\n{"scenes":[{"sceneId":1,},],}\n```'),
  {scenes: [{sceneId: 1}]},
);
assert.deepEqual(
  parseProviderJson('Here is the JSON:\n{"scenes":[{"sceneId":2}]}\nDone.'),
  {scenes: [{sceneId: 2}]},
);
assert.throws(() => parseProviderJson('not-json'));

console.log('V9 provider JSON parser: PASS');
