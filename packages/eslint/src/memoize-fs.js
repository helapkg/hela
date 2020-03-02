// MPL-2.0 License
const crypto = require('crypto');
const meriyah = require('meriyah');
const cacache = require('cacache');
const sasa = require('serialize-javascript');

const DEFAULT_OPTIONS = {
  cacheId: '$$rootId',
  astBody: false,
  serialize,
  deserialize,
};

module.exports = function memoizeFs(options) {
  let opts = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (
    !opts.cachePath ||
    (opts.cachePath && typeof opts.cachePath !== 'string')
  ) {
    throw new TypeError('options.cachePath is expected to be of type string');
  }

  return {
    fn(funcToMemoize, settings) {
      opts = { ...opts, ...settings };

      return async function memoizedFn(...args) {
        const cacheData = generateMeta(funcToMemoize, args, opts);
        const id = cacheData.hashId;
        const res = opts.force ? false : await get(id, opts);

        if (opts.force) {
          await invalidateCache(id, opts);
        }

        if (!res) {
          const fnResult = await funcToMemoize(...args);
          const metadata = { ...cacheData, result: fnResult };
          const dataString = opts.serialize(metadata);

          await cacache.put(opts.cachePath, id, dataString, {
            metadata: {
              contents: dataString,
              cacheId: opts.cacheId,
              salt: opts.salt,
            },
          });

          return fnResult;
        }

        if (opts.maxAge > 0 && Date.now() > res.time + opts.maxAge) {
          await invalidateCache(id, opts);
        }

        const deserializedValue = opts.deserialize(res.metadata.contents);
        return deserializedValue;
      };
    },
    async invalidate(id, settings) {
      const opt = { ...opts, ...settings };

      if (!id) {
        await invalidateCache(id, opt);
        return;
      }

      const info = await getInfo(id, opt);
      const items = [].concat(info).filter(Boolean);

      await Promise.all(
        items.map(async (item) => {
          await invalidateCache(item.key, opt, item.integrity);
        }),
      );
    },

    async getInfo(id, settings) {
      return getInfo(id, { ...opts, ...settings });
    },
  };
};

async function getInfo(id, opts) {
  const cache = await cacache.ls(opts.cachePath);

  const cacheList = Object.keys(cache || {}).map((k) => cache[k]);

  if (!id || (id && typeof id !== 'string')) {
    return cacheList.length === 1 ? cacheList[0] : cacheList;
  }

  const ids = cacheList.filter((x) => x.metadata.cacheId === id);
  if (ids.length === 1) {
    return ids[0];
  }
  if (opts.latest) {
    const desc = ids.sort((a, b) => b.time - a.time);
    return desc[0];
  }
  return ids;
}

async function get(id, opts) {
  const res = await cacache.get.info(opts.cachePath, id);

  if (res) {
    const meta = await cacache.get(opts.cachePath, id);
    return {
      ...res,
      metadata: { ...meta.metadata, contents: meta.data.toString() },
    };
  }

  return null;
}

async function invalidateCache(id, opts, integrity) {
  if (!id) {
    await cacache.rm.all(opts.cachePath);
    await cacache.verify(opts.cachePath);
    return;
  }

  await cacache.rm.entry(opts.cachePath, id);

  const res = integrity
    ? { integrity }
    : await cacache.get.info(opts.cachePath, id);

  if (res) {
    await cacache.rm.content(opts.cachePath, res.integrity);
  }

  await cacache.verify(opts.cachePath);
}

function generateMeta(fn, args, options) {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const salt = opts.salt || '';
  let fnStr = '';
  let fnAst = null;

  if (!opts.noBody) {
    fnStr = String(fn);
    if (opts.astBody) {
      fnAst = meriyah.parse(fnStr, { jsx: true, next: true });
      fnStr = JSON.stringify(fnAst);
    }
  }

  const argsStr = opts.serialize(args);
  const hashId = crypto
    .createHash('sha256')
    .update(fnStr + argsStr + opts.cacheId + salt)
    .digest('hex');

  return {
    fn: fnAst || fn,
    fnStr,
    args,
    argsStr,
    hashId,
  };
}

function serialize(val) {
  const circRefColl = [];
  return JSON.stringify(val, (name, value) => {
    if (typeof value === 'function') {
      return; // ignore arguments and attributes of type function silently
    }
    if (typeof value === 'object' && value !== null) {
      if (circRefColl.includes(value)) {
        // circular reference found, discard key
        return;
      }
      // store value in collection
      circRefColl.push(value);
    }
    // eslint-disable-next-line consistent-return
    return value;
  });
}

function deserialize(str) {
  return JSON.parse(str).result;
}

// (async function main() {
//   const memoizer = memoizeFs({
//     cachePath: './some-cache',
//     // serialize: serializer,
//     // deserialize: (str) => eval(`(${str})`),
//   });

//   let c = 0;
//   const memoizedFn = memoizer.fn(
//     async (a, b) => {
//       c += a + b;
//       setTimeout(() => Promise.resolve(), 1501);

//       return {
//         a,
//         b,
//         c,
//         help() {
//           console.log('with cacheId and salt', a, b, c);
//           return c;
//         },
//       };
//     },
//     { cacheId: 'some-cache-id', salt: 'b', maxAge: 15000 },
//   );

//   // await memoizer.invalidate();
//   // await memoizer.invalidate('$$rootId');
//   // await memoizer.invalidate('some-cache-id');
//   // await memoizer.invalidate('some-cache-id', { latest: true });
//   console.log(await memoizedFn(1, 2));
//   console.log(await memoizedFn(1, 2)); // cache hit, or fresh hit when after maxAge
//   console.log(await memoizedFn(1, 2)); // always cache hit
//   console.log(c);
// })();
