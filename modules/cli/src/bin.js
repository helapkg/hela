#!/usr/bin/env node

'use strict';

const cli = require('./index');

(async function runHelaCli() {
  try {
    await cli();
  } catch (err) {
    console.error('[hela] Failure:', err.stack);
  }
})();
