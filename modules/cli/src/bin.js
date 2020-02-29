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

// Single Command Mode
// const { hela } = require('@hela/core');

// hela({ singleMode: true, argv: { foo: 13 } })
//   .option('-f, --format', 'sasa sasa', true)
//   .action((argv) => {
//     console.log('args', argv);
//   })
//   .parse();
