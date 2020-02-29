#!/usr/bin/env node

const { hela } = require('@hela/core');
const { wrapper } = require('./index');

wrapper(hela('eslint', { singleMode: true, argv: { _selfBin: true } })).parse();
