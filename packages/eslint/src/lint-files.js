'use strict';

const { constants } = require('./utils');
const { lintFiles } = require('./api');

module.exports = async (files, options) => {
  const opts = { ...constants.DEFAULT_OPTIONS, ...options };
  const mapper = (x) => opts.mapper(x, {}) || x;

  await lintFiles(files, { ...opts, mapper });
};
