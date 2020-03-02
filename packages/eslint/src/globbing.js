/* eslint-disable max-statements */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable no-underscore-dangle */

'use strict';

const fs = require('fs');
const util = require('util');
const crypto = require('crypto');
const { Transform } = require('stream');
const fg = require('fast-glob');
const nanoid = require('nanoid');
const cacache = require('cacache');
const memoizeFs = require('memoize-fs');
const { toReadable } = require('stream-iterators-utils');
const serialize = require('serialize-javascript');
const { cosmiconfig } = require('cosmiconfig');

module.exports = async function* globChanged(options) {
  const { include, globOptions, ...opts } = options;
  const cfg = { cacheLocation: './.cache/globbing', hooks: {}, ...opts };

  const {
    changed = () => {},
    notChanged = () => {},
    found = () => {},
    notFound = async (file) => {
      await cacache.put(opts.cacheLocation, file.path, file.contents);
    },
  } = opts.hooks;

  const config = {
    ...globOptions,
    unique: true,
    absolute: true,
    objectMode: true,
    ignore: opts.exclude,
  };

  // const argsContents = JSON.stringify({ patterns, config });
  // const argsCachePath = './.cache/glob-args';
  // const idItegrity = integrityFromContents(argsContents);
  // const idInfo = await cacache.get.hasContent(argsCachePath, idItegrity);

  // if (idInfo === null) {
  //   await cacache.put(argsCachePath, idItegrity, argsContents);
  // }

  const globStream = fg.stream(include, config);

  for await (const data of globStream) {
    const contents = await util.promisify(fs.readFile)(data.path);
    const integrity = integrityFromContents(contents);
    const info = await cacache.get.info(opts.cacheLocation, data.path);
    const hash = await cacache.get.hasContent(opts.cacheLocation, integrity);

    const file = {
      ...data,
      changed: hash === false,
      notFound: info === null,
      contents,
      size: contents.length,
      integrity,
    };

    if (file.changed) {
      if (file.notFound) {
        await notFound(file, opts);
      } else {
        await found(file, opts);
      }
      await changed(file, opts);
      yield file;
    } else {
      await notChanged(file, opts);
    }
  }
};

function hasha(value, { algorithm = 'sha512', digest = 'base64' }) {
  return crypto
    .createHash(algorithm)
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest(digest);
}

function integrityFromContents(contents, hash = 'sha512') {
  const id = hasha(contents, { algorithm: hash });

  return `${hash}-${id}`;
}
