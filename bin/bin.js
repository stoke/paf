#!/usr/bin/env node
var optimist = require('optimist');

optimist.alias('d', 'directory-listing');
optimist.alias('p', 'port');
optimist.alias('D', 'directory');
optimist.alias('h', 'help');

optimist.boolean('d');
optimist.boolean('h');
optimist.string('D');
optimist.string('p');

optimist.describe('d', 'Activate directory listing');
optimist.describe('p', 'Port');
optimist.describe('D', 'Main directory');
optimist.describe('q', 'Quiet');
optimist.describe('h', 'Show help');

optimist.default('d', false);
optimist.default('D', '.');
optimist.default('p', 8000);
optimist.default('q', false);

var argv = optimist.argv;

if (argv.h) {
  optimist.showHelp();
  process.exit(0);
}

require('../')({
  path: argv.D || '.',
  listing: argv.d || false,
  port: argv.p || 8000,
  quiet: argv.q || false
});
