#!/usr/bin/env node
const path = require('path');
const child = require('child_process');

// Try to require the trace script in-process first
try {
  require(path.resolve(__dirname, './trace-repeat.js'));
} catch (err) {
  console.error('Could not preload trace-repeat.js in-process:', err && err.stack || err);
}

// Find next binary
let nextBin;
try {
  nextBin = require.resolve('next/dist/bin/next');
} catch (e) {
  // fallback to local next
  nextBin = path.resolve(__dirname, 'node_modules', '.bin', 'next');
}

const args = process.argv.slice(2);

if (!args.length) args.push('dev');

// Spawn a child process so exit codes are preserved
const p = child.spawn(process.execPath, [nextBin, ...args], {
  stdio: 'inherit',
  env: process.env,
});

p.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code);
});
// next-with-trace.js
// Wrapper to require the repeat tracer before starting Next.js
require('./trace-repeat.js');
// hand off to Next's CLI
require('./node_modules/next/dist/bin/next');
