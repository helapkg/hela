'use strict';

const mod = require('../src/index');

test('todo test for mod', () => {
  const foo = 123;
  expect(typeof mod).toStrictEqual('object');
  expect(typeof mod.helaCommand).toStrictEqual('function');
});
