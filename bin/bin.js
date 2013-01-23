#!/usr/bin/env node
var optimist = require('optimist');

optimist.alias('d', 'directory-listing');
optimist.alias('p', 'port');
optimist.alias('D', 'directory');
optimist.alias('i', 'index');
optimist.alias('h', 'help');
optimist.alias('u', 'username');
optimist.alias('P', 'password');

optimist.boolean('d');
optimist.boolean('h');
optimist.string('D');
optimist.string('p');
optimist.string('i');
optimist.string('u');
optimist.string('P');

optimist.describe('d', 'Activate directory listing');
optimist.describe('p', 'Port');
optimist.describe('D', 'Main directory');
optimist.describe('q', 'Quiet');
optimist.describe('h', 'Show help');
optimist.describe('i', 'Index file (e.g. index.html)');
optimist.describe('u', 'Username [default: none]');
optimist.describe('P', 'Password [default: none]');

optimist.default('d', false);
optimist.default('D', '.');
optimist.default('p', 8000);
optimist.default('q', false);
optimist.default('i', 'index.html');

var argv = optimist.argv;

if (argv.h) {
  optimist.showHelp();
  process.exit(0);
}

var middlewares = require('../lib/middlewares'),
    mids = [];

if (argv.u && argv.p)
  mids.push(middlewares.auth(argv.u, argv.P));
    
argv.i = argv.i || 'index.html';
mids.push(middlewares.index(argv.i));

if (argv.d)
  mids.push(middlewares.listing);

require('../')({
  path: argv.D || '.',
  port: argv.p || 8000,
  quiet: argv.q || false,
  middlewares: mids
});
