// async function pFlatten(arr, ...args) {
//   const items = await (await arr).reduce(async (acc, e) => {
//     const accum = await acc;

//     let item = await e;

//     if (typeof item === 'function') {
//       item = await item(...args);
//     }
//     if (!item) {
//       return accum;
//     }
//     if (Array.isArray(item)) {
//       // if the element is an array, fall flatten on it again and then take the returned value and concat it.
//       return accum.concat(await pFlatten(item));
//     }
//     // otherwise just concat the value.
//     return accum.concat(item);
//   }, Promise.resolve([])); // initial value for the accumulator is []

//   return Promise.all(items);
// }

// pFlatten(
//   Promise.resolve([
//     null,
//     { foo: 1 },
//     () => null,
//     (ctx) => [
//       null,
//       ctx.arr,
//       { z: 4 },
//       [null, { sasa: 33 }, async () => ({ as: 2 })],
//       async () => ({ dada: 22 }),
//     ],
//     async (ctx) => ({ a: 1, ...ctx.asyncFn }),
//     [
//       null,
//       { qux: 2 },
//       [null, { zaz: 3 }, () => ({ f: 123 })],
//       async () => [null, { qw: 534 }],
//     ],
//   ]),
//   {
//     arr: { ok: 123 },
//     asyncFn: { zazzz: 888 },
//   },
// ).then(console.log);

const defaultsDeep = require('defaults-deep');
const mergeDeep = require('merge-deep');
const mixinDeep = require('mixin-deep');

console.log(
  mixinDeep(
    {
      settings: {},
      languageOptions: {
        globals: {
          sas: 'ok',
        },
        parser: 'str',
        parserOptions: {},
        linterOptions: {
          reportUnusedDisableDirectives: 'string',
        },
      },
      plugins: {
        react: {
          rules: {
            jsx: () => {},
          },
        },
      },
      rules: {
        'react/jsx': 'error',
        semi: 'error',
      },
    },
    {
      settings: { foo: 123 },
      processor: 'md',
      languageOptions: {
        globals: {
          win: 1,
          sas: 'yep',
        },
        ecmaVersion: 2020,
        sourceType: 'module',
        parser: 'babel-eslint',
      },
      plugins: {
        unicorn: {
          rules: {
            'foo-bar': () => {},
            'qux-zaz': () => {},
          },
        },
      },
      rules: {
        'unicorn/foo-bar': 'off',
        'unicorn/qux-zaz': 'error',
        semi: 'off',
        foobie: 'error',
      },
    },
  ),
);
