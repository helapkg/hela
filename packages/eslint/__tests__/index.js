'use strict';

const mod = require('../src/index');

test('todo test for mod', () => {
  expect(typeof mod).toStrictEqual('object');
  expect(typeof mod.helaCommand).toStrictEqual('function');
});
