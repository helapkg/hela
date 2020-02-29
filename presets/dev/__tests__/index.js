'use strict';

const mod = require('../src/index');

test('todo test for mod', () => {
  expect(typeof mod).toStrictEqual('object');
  expect(typeof mod.createJestCommand).toStrictEqual('function');
  expect(typeof mod.build).toStrictEqual('function');
  expect(typeof mod.bundle).toStrictEqual('function');
  expect(typeof mod.docs).toStrictEqual('function');
  expect(typeof mod.lint).toStrictEqual('function');
  expect(typeof mod.test).toStrictEqual('function');
});
