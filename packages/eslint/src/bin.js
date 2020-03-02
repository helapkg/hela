#!/usr/bin/env node

const { hela } = require('@hela/core');
const { wrapper } = require('./index.js');

const prog = wrapper(hela('eslint', { singleMode: true }).usage('[...files]'));

prog.parse();
