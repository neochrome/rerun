# Re-run
Runs the specified command when watched files changes.

Press `ctrl+c` to exit.

## Installation
```
$ npm install --global neochrome/rerun
```

## Usage
#### Basic usage
```
$ rerun 'gulp lint'
```
Watches `cwd` by default.

#### With ignored pattern(s)
```
$ rerun --ignore '*.json' 'gulp lint'
```
Watches everything in current directory, except files matching `*.json`.
Multiple ignore options may be used.

#### With specific watch pattern(s)
```
$ rerun 'gulp lint' **/*.js package.json
```


## Release notes
1. make sure wc is clean and all commited
2. execute: `npm version major | minor | patch`
3. execute: `git push; git push --tags`
4. profit
