'use strict';

const helaDev = require('@hela/dev');

Object.assign(exports, helaDev);
exports.eslint = require('@hela/eslint').helaCommand();

const foo = 12;
