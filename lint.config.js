'use strict';

const { resolveConfig } = require('./packages/eslint/src/api');

// const config = resolveConfig(__filename);

module.exports = resolveConfig(__filename);
