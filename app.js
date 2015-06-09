#!/usr/bin/env node
/* eslint-disable no-process-exit */
'use strict';
var program   = require('commander');
var util      = require('util');
var chokidar  = require('chokidar');
var exec      = require('child_process').exec;
var fs        = require('fs');
var glob      = require('glob');
var minimatch = require('minimatch');

var displayErrorAndExit = function () {
	console.error();
	console.error('  error: %s', util.format.apply(undefined, arguments));
	console.error();
	process.exit(1);
};

var increaseVerbosity = function (v, total) {
	return total + 1;
};

program
	.version(require('./package.json').version)
	.usage('[options] "<command>" [patterns]')
	.option('-d, --dot', 'allow matching files starting with a dot (.)')
	.option('-G, --no-gitignore', 'do not use ignore patterns from .gitignore')
	.option('-b, --bell', 'emit a bell (\\u0007) character when command exits with non-zero code')
	.option('-i, --initial', 'run command immediately after initializing')
	.option('-v, --verbose', 'display additional information (use multiple time to increase)', increaseVerbosity, 0)
	.parse(process.argv);

if (program.args.length < 1) {
	displayErrorAndExit('Must supply a <command>.');
}
var command  = program.args.shift();

var includePattern = function (p) { return p[0] !== '!'; };
var excludePattern = function (p) { return p[0] === '!'; };
var included = program.args.length ? program.args : ['**'];
var excluded  = included.filter(excludePattern);
included = included.filter(includePattern);
if (program.gitignore && fs.existsSync('.gitignore')) {
	excluded = excluded.concat(
		fs.readFileSync('.gitignore')
			.toString()
			.split('\n')
			.filter(function (pattern) { return pattern.length; })
			.map(function (pattern) { return pattern[pattern.length - 1] === '/' ? pattern + '**' : pattern; })
	);
}

var info = function () {
	if (program.verbose > 0) {
		console.log.apply(console, arguments);
	}
};

var debug = function () {
	if (program.verbose > 1) {
		console.log.apply(console, arguments);
	}
};

var trace = function () {
	if (program.verbose > 2) {
		console.log.apply(console, arguments);
	}
};

process.on('SIGINT', function () {
	info('got ctrl+c, exiting...');
	process.exit();
});

var runCommand = function () {
	exec(command, function (err, stdout, stderr) {
		if (err && program.bell) { console.log('\u0007'); }
		if (stdout) { process.stdout.write(stdout); }
		if (stderr) { process.stderr.write(stderr); }
	});
};

debug('watching: %s', included);
debug('ignoring: %s', excluded);

included = included.map(function (pattern) { return minimatch.filter(pattern); });
excluded = excluded.map(function (pattern) { return minimatch.filter(pattern, { flipNegate: true }); });

var files =	glob.sync('**', { dot: program.dot, mark: true })
	.filter(function (file) {
		return included.some(function (match) { return match(file); }) && !excluded.some(function (match) { return match(file); });
	});

trace('files being watched: %s', files);

chokidar
	.watch(files)
	.on('error', function (err) {
		console.error('error: %s', err.toString());
		process.exit(1);
	})
	.on('change', function (path) {
		info('changed: %s', path);
		runCommand();
	})
	.on('ready', function () {
		info('watching: %s file(s)', files.length);
		console.log('ready.');
		if (program.initial) { runCommand(); }
	});
