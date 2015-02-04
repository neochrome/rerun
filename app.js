#!/usr/bin/env node
/* eslint-disable no-process-exit */
'use strict';
var program  = require('commander');
var util     = require('util');
var chokidar = require('chokidar');
var exec     = require('child_process').exec;

var displayErrorAndExit = function () {
	console.error();
	console.error('  error: %s', util.format.apply(undefined, arguments));
	console.error();
	process.exit(1);
};

program
	.version(require('./package.json').version)
	.usage('[options] <command> [patterns]')
	.option('-i, --ignore <pattern>', 'ignore <pattern>, multiple allowed', function (pattern, ignored) {
		ignored.push(pattern);
		return ignored;
	}, [])
	.option('-v, --verbose', 'display additional information')
	.parse(process.argv);

if (program.args.length < 1) {
	displayErrorAndExit('Must supply a <command>.');
}
var command = program.args.shift();
var patterns = program.args.length ? program.args : ['.'];

var info = function () {
	if (!program.verbose) { return; }
	console.log.apply(console, arguments);
};

var runCommand = function () {
	exec(command, function (err, stdout, stderr) {
		if (err) { console.log(err); }
		if (stdout) { process.stdout.write(stdout); }
		if (stderr) { process.stderr.write(stderr); }
	});
};

process.on('SIGINT', function () {
	info('got ctrl+c, exiting...');
	process.exit();
});

info('watching: %s', patterns);
if (program.ignore) { info('ignoring: %s', program.ignore); }

chokidar
	.watch(patterns)
	.unwatch(program.ignore)
	.on('error', function (err) {
		console.error('error: %s', err.toString());
		process.exit(1);
	})
	.on('change', function (path) {
		info('changed: %s', path);
		runCommand();
	})
	.on('ready', function () {
		info('ready.');
		runCommand();
	});
