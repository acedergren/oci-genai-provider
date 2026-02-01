import { z } from 'zod';
import { v4 } from 'uuid';
import * as require$$0 from 'fs';
import require$$0__default from 'fs';
import * as require$$1 from 'path';
import require$$1__default from 'path';
import require$$2 from 'util';
import * as os from 'os';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var lib = {exports: {}};

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var util = {};

var hasRequiredUtil;

function requireUtil () {
	if (hasRequiredUtil) return util;
	hasRequiredUtil = 1;

	util.getBooleanOption = (options, key) => {
		let value = false;
		if (key in options && typeof (value = options[key]) !== 'boolean') {
			throw new TypeError(`Expected the "${key}" option to be a boolean`);
		}
		return value;
	};

	util.cppdb = Symbol();
	util.inspect = Symbol.for('nodejs.util.inspect.custom');
	return util;
}

var sqliteError;
var hasRequiredSqliteError;

function requireSqliteError () {
	if (hasRequiredSqliteError) return sqliteError;
	hasRequiredSqliteError = 1;
	const descriptor = { value: 'SqliteError', writable: true, enumerable: false, configurable: true };

	function SqliteError(message, code) {
		if (new.target !== SqliteError) {
			return new SqliteError(message, code);
		}
		if (typeof code !== 'string') {
			throw new TypeError('Expected second argument to be a string');
		}
		Error.call(this, message);
		descriptor.value = '' + message;
		Object.defineProperty(this, 'message', descriptor);
		Error.captureStackTrace(this, SqliteError);
		this.code = code;
	}
	Object.setPrototypeOf(SqliteError, Error);
	Object.setPrototypeOf(SqliteError.prototype, Error.prototype);
	Object.defineProperty(SqliteError.prototype, 'name', descriptor);
	sqliteError = SqliteError;
	return sqliteError;
}

var bindings = {exports: {}};

var fileUriToPath_1;
var hasRequiredFileUriToPath;

function requireFileUriToPath () {
	if (hasRequiredFileUriToPath) return fileUriToPath_1;
	hasRequiredFileUriToPath = 1;
	/**
	 * Module dependencies.
	 */

	var sep = require$$1__default.sep || '/';

	/**
	 * Module exports.
	 */

	fileUriToPath_1 = fileUriToPath;

	/**
	 * File URI to Path function.
	 *
	 * @param {String} uri
	 * @return {String} path
	 * @api public
	 */

	function fileUriToPath (uri) {
	  if ('string' != typeof uri ||
	      uri.length <= 7 ||
	      'file://' != uri.substring(0, 7)) {
	    throw new TypeError('must pass in a file:// URI to convert to a file path');
	  }

	  var rest = decodeURI(uri.substring(7));
	  var firstSlash = rest.indexOf('/');
	  var host = rest.substring(0, firstSlash);
	  var path = rest.substring(firstSlash + 1);

	  // 2.  Scheme Definition
	  // As a special case, <host> can be the string "localhost" or the empty
	  // string; this is interpreted as "the machine from which the URL is
	  // being interpreted".
	  if ('localhost' == host) host = '';

	  if (host) {
	    host = sep + sep + host;
	  }

	  // 3.2  Drives, drive letters, mount points, file system root
	  // Drive letters are mapped into the top of a file URI in various ways,
	  // depending on the implementation; some applications substitute
	  // vertical bar ("|") for the colon after the drive letter, yielding
	  // "file:///c|/tmp/test.txt".  In some cases, the colon is left
	  // unchanged, as in "file:///c:/tmp/test.txt".  In other cases, the
	  // colon is simply omitted, as in "file:///c/tmp/test.txt".
	  path = path.replace(/^(.+)\|/, '$1:');

	  // for Windows, we need to invert the path separators from what a URI uses
	  if (sep == '\\') {
	    path = path.replace(/\//g, '\\');
	  }

	  if (/^.+\:/.test(path)) ; else {
	    // unix path…
	    path = sep + path;
	  }

	  return host + path;
	}
	return fileUriToPath_1;
}

/**
 * Module dependencies.
 */

var hasRequiredBindings;

function requireBindings () {
	if (hasRequiredBindings) return bindings.exports;
	hasRequiredBindings = 1;
	(function (module, exports$1) {
		var fs = require$$0__default,
		  path = require$$1__default,
		  fileURLToPath = requireFileUriToPath(),
		  join = path.join,
		  dirname = path.dirname,
		  exists =
		    (fs.accessSync &&
		      function(path) {
		        try {
		          fs.accessSync(path);
		        } catch (e) {
		          return false;
		        }
		        return true;
		      }) ||
		    fs.existsSync ||
		    path.existsSync,
		  defaults = {
		    arrow: process.env.NODE_BINDINGS_ARROW || ' → ',
		    compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled',
		    platform: process.platform,
		    arch: process.arch,
		    nodePreGyp:
		      'node-v' +
		      process.versions.modules +
		      '-' +
		      process.platform +
		      '-' +
		      process.arch,
		    version: process.versions.node,
		    bindings: 'bindings.node',
		    try: [
		      // node-gyp's linked version in the "build" dir
		      ['module_root', 'build', 'bindings'],
		      // node-waf and gyp_addon (a.k.a node-gyp)
		      ['module_root', 'build', 'Debug', 'bindings'],
		      ['module_root', 'build', 'Release', 'bindings'],
		      // Debug files, for development (legacy behavior, remove for node v0.9)
		      ['module_root', 'out', 'Debug', 'bindings'],
		      ['module_root', 'Debug', 'bindings'],
		      // Release files, but manually compiled (legacy behavior, remove for node v0.9)
		      ['module_root', 'out', 'Release', 'bindings'],
		      ['module_root', 'Release', 'bindings'],
		      // Legacy from node-waf, node <= 0.4.x
		      ['module_root', 'build', 'default', 'bindings'],
		      // Production "Release" buildtype binary (meh...)
		      ['module_root', 'compiled', 'version', 'platform', 'arch', 'bindings'],
		      // node-qbs builds
		      ['module_root', 'addon-build', 'release', 'install-root', 'bindings'],
		      ['module_root', 'addon-build', 'debug', 'install-root', 'bindings'],
		      ['module_root', 'addon-build', 'default', 'install-root', 'bindings'],
		      // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
		      ['module_root', 'lib', 'binding', 'nodePreGyp', 'bindings']
		    ]
		  };

		/**
		 * The main `bindings()` function loads the compiled bindings for a given module.
		 * It uses V8's Error API to determine the parent filename that this function is
		 * being invoked from, which is then used to find the root directory.
		 */

		function bindings(opts) {
		  // Argument surgery
		  if (typeof opts == 'string') {
		    opts = { bindings: opts };
		  } else if (!opts) {
		    opts = {};
		  }

		  // maps `defaults` onto `opts` object
		  Object.keys(defaults).map(function(i) {
		    if (!(i in opts)) opts[i] = defaults[i];
		  });

		  // Get the module root
		  if (!opts.module_root) {
		    opts.module_root = exports$1.getRoot(exports$1.getFileName());
		  }

		  // Ensure the given bindings name ends with .node
		  if (path.extname(opts.bindings) != '.node') {
		    opts.bindings += '.node';
		  }

		  // https://github.com/webpack/webpack/issues/4175#issuecomment-342931035
		  var requireFunc =
		    typeof __webpack_require__ === 'function'
		      ? __non_webpack_require__
		      : commonjsRequire;

		  var tries = [],
		    i = 0,
		    l = opts.try.length,
		    n,
		    b,
		    err;

		  for (; i < l; i++) {
		    n = join.apply(
		      null,
		      opts.try[i].map(function(p) {
		        return opts[p] || p;
		      })
		    );
		    tries.push(n);
		    try {
		      b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
		      if (!opts.path) {
		        b.path = n;
		      }
		      return b;
		    } catch (e) {
		      if (e.code !== 'MODULE_NOT_FOUND' &&
		          e.code !== 'QUALIFIED_PATH_RESOLUTION_FAILED' &&
		          !/not find/i.test(e.message)) {
		        throw e;
		      }
		    }
		  }

		  err = new Error(
		    'Could not locate the bindings file. Tried:\n' +
		      tries
		        .map(function(a) {
		          return opts.arrow + a;
		        })
		        .join('\n')
		  );
		  err.tries = tries;
		  throw err;
		}
		module.exports = exports$1 = bindings;

		/**
		 * Gets the filename of the JavaScript file that invokes this function.
		 * Used to help find the root directory of a module.
		 * Optionally accepts an filename argument to skip when searching for the invoking filename
		 */

		exports$1.getFileName = function getFileName(calling_file) {
		  var origPST = Error.prepareStackTrace,
		    origSTL = Error.stackTraceLimit,
		    dummy = {},
		    fileName;

		  Error.stackTraceLimit = 10;

		  Error.prepareStackTrace = function(e, st) {
		    for (var i = 0, l = st.length; i < l; i++) {
		      fileName = st[i].getFileName();
		      if (fileName !== __filename) {
		        if (calling_file) {
		          if (fileName !== calling_file) {
		            return;
		          }
		        } else {
		          return;
		        }
		      }
		    }
		  };

		  // run the 'prepareStackTrace' function above
		  Error.captureStackTrace(dummy);
		  dummy.stack;

		  // cleanup
		  Error.prepareStackTrace = origPST;
		  Error.stackTraceLimit = origSTL;

		  // handle filename that starts with "file://"
		  var fileSchema = 'file://';
		  if (fileName.indexOf(fileSchema) === 0) {
		    fileName = fileURLToPath(fileName);
		  }

		  return fileName;
		};

		/**
		 * Gets the root directory of a module, given an arbitrary filename
		 * somewhere in the module tree. The "root directory" is the directory
		 * containing the `package.json` file.
		 *
		 *   In:  /home/nate/node-native-module/lib/index.js
		 *   Out: /home/nate/node-native-module
		 */

		exports$1.getRoot = function getRoot(file) {
		  var dir = dirname(file),
		    prev;
		  while (true) {
		    if (dir === '.') {
		      // Avoids an infinite loop in rare cases, like the REPL
		      dir = process.cwd();
		    }
		    if (
		      exists(join(dir, 'package.json')) ||
		      exists(join(dir, 'node_modules'))
		    ) {
		      // Found the 'package.json' file or 'node_modules' dir; we're done
		      return dir;
		    }
		    if (prev === dir) {
		      // Got to the top
		      throw new Error(
		        'Could not find module root given file: "' +
		          file +
		          '". Do you have a `package.json` file? '
		      );
		    }
		    // Try the parent dir next
		    prev = dir;
		    dir = join(dir, '..');
		  }
		}; 
	} (bindings, bindings.exports));
	return bindings.exports;
}

var wrappers = {};

var hasRequiredWrappers;

function requireWrappers () {
	if (hasRequiredWrappers) return wrappers;
	hasRequiredWrappers = 1;
	const { cppdb } = requireUtil();

	wrappers.prepare = function prepare(sql) {
		return this[cppdb].prepare(sql, this, false);
	};

	wrappers.exec = function exec(sql) {
		this[cppdb].exec(sql);
		return this;
	};

	wrappers.close = function close() {
		this[cppdb].close();
		return this;
	};

	wrappers.loadExtension = function loadExtension(...args) {
		this[cppdb].loadExtension(...args);
		return this;
	};

	wrappers.defaultSafeIntegers = function defaultSafeIntegers(...args) {
		this[cppdb].defaultSafeIntegers(...args);
		return this;
	};

	wrappers.unsafeMode = function unsafeMode(...args) {
		this[cppdb].unsafeMode(...args);
		return this;
	};

	wrappers.getters = {
		name: {
			get: function name() { return this[cppdb].name; },
			enumerable: true,
		},
		open: {
			get: function open() { return this[cppdb].open; },
			enumerable: true,
		},
		inTransaction: {
			get: function inTransaction() { return this[cppdb].inTransaction; },
			enumerable: true,
		},
		readonly: {
			get: function readonly() { return this[cppdb].readonly; },
			enumerable: true,
		},
		memory: {
			get: function memory() { return this[cppdb].memory; },
			enumerable: true,
		},
	};
	return wrappers;
}

var transaction;
var hasRequiredTransaction;

function requireTransaction () {
	if (hasRequiredTransaction) return transaction;
	hasRequiredTransaction = 1;
	const { cppdb } = requireUtil();
	const controllers = new WeakMap();

	transaction = function transaction(fn) {
		if (typeof fn !== 'function') throw new TypeError('Expected first argument to be a function');

		const db = this[cppdb];
		const controller = getController(db, this);
		const { apply } = Function.prototype;

		// Each version of the transaction function has these same properties
		const properties = {
			default: { value: wrapTransaction(apply, fn, db, controller.default) },
			deferred: { value: wrapTransaction(apply, fn, db, controller.deferred) },
			immediate: { value: wrapTransaction(apply, fn, db, controller.immediate) },
			exclusive: { value: wrapTransaction(apply, fn, db, controller.exclusive) },
			database: { value: this, enumerable: true },
		};

		Object.defineProperties(properties.default.value, properties);
		Object.defineProperties(properties.deferred.value, properties);
		Object.defineProperties(properties.immediate.value, properties);
		Object.defineProperties(properties.exclusive.value, properties);

		// Return the default version of the transaction function
		return properties.default.value;
	};

	// Return the database's cached transaction controller, or create a new one
	const getController = (db, self) => {
		let controller = controllers.get(db);
		if (!controller) {
			const shared = {
				commit: db.prepare('COMMIT', self, false),
				rollback: db.prepare('ROLLBACK', self, false),
				savepoint: db.prepare('SAVEPOINT `\t_bs3.\t`', self, false),
				release: db.prepare('RELEASE `\t_bs3.\t`', self, false),
				rollbackTo: db.prepare('ROLLBACK TO `\t_bs3.\t`', self, false),
			};
			controllers.set(db, controller = {
				default: Object.assign({ begin: db.prepare('BEGIN', self, false) }, shared),
				deferred: Object.assign({ begin: db.prepare('BEGIN DEFERRED', self, false) }, shared),
				immediate: Object.assign({ begin: db.prepare('BEGIN IMMEDIATE', self, false) }, shared),
				exclusive: Object.assign({ begin: db.prepare('BEGIN EXCLUSIVE', self, false) }, shared),
			});
		}
		return controller;
	};

	// Return a new transaction function by wrapping the given function
	const wrapTransaction = (apply, fn, db, { begin, commit, rollback, savepoint, release, rollbackTo }) => function sqliteTransaction() {
		let before, after, undo;
		if (db.inTransaction) {
			before = savepoint;
			after = release;
			undo = rollbackTo;
		} else {
			before = begin;
			after = commit;
			undo = rollback;
		}
		before.run();
		try {
			const result = apply.call(fn, this, arguments);
			if (result && typeof result.then === 'function') {
				throw new TypeError('Transaction function cannot return a promise');
			}
			after.run();
			return result;
		} catch (ex) {
			if (db.inTransaction) {
				undo.run();
				if (undo !== rollback) after.run();
			}
			throw ex;
		}
	};
	return transaction;
}

var pragma;
var hasRequiredPragma;

function requirePragma () {
	if (hasRequiredPragma) return pragma;
	hasRequiredPragma = 1;
	const { getBooleanOption, cppdb } = requireUtil();

	pragma = function pragma(source, options) {
		if (options == null) options = {};
		if (typeof source !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
		const simple = getBooleanOption(options, 'simple');

		const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true);
		return simple ? stmt.pluck().get() : stmt.all();
	};
	return pragma;
}

var backup;
var hasRequiredBackup;

function requireBackup () {
	if (hasRequiredBackup) return backup;
	hasRequiredBackup = 1;
	const fs = require$$0__default;
	const path = require$$1__default;
	const { promisify } = require$$2;
	const { cppdb } = requireUtil();
	const fsAccess = promisify(fs.access);

	backup = async function backup(filename, options) {
		if (options == null) options = {};

		// Validate arguments
		if (typeof filename !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');

		// Interpret options
		filename = filename.trim();
		const attachedName = 'attached' in options ? options.attached : 'main';
		const handler = 'progress' in options ? options.progress : null;

		// Validate interpreted options
		if (!filename) throw new TypeError('Backup filename cannot be an empty string');
		if (filename === ':memory:') throw new TypeError('Invalid backup filename ":memory:"');
		if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
		if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
		if (handler != null && typeof handler !== 'function') throw new TypeError('Expected the "progress" option to be a function');

		// Make sure the specified directory exists
		await fsAccess(path.dirname(filename)).catch(() => {
			throw new TypeError('Cannot save backup because the directory does not exist');
		});

		const isNewFile = await fsAccess(filename).then(() => false, () => true);
		return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
	};

	const runBackup = (backup, handler) => {
		let rate = 0;
		let useDefault = true;

		return new Promise((resolve, reject) => {
			setImmediate(function step() {
				try {
					const progress = backup.transfer(rate);
					if (!progress.remainingPages) {
						backup.close();
						resolve(progress);
						return;
					}
					if (useDefault) {
						useDefault = false;
						rate = 100;
					}
					if (handler) {
						const ret = handler(progress);
						if (ret !== undefined) {
							if (typeof ret === 'number' && ret === ret) rate = Math.max(0, Math.min(0x7fffffff, Math.round(ret)));
							else throw new TypeError('Expected progress callback to return a number or undefined');
						}
					}
					setImmediate(step);
				} catch (err) {
					backup.close();
					reject(err);
				}
			});
		});
	};
	return backup;
}

var serialize;
var hasRequiredSerialize;

function requireSerialize () {
	if (hasRequiredSerialize) return serialize;
	hasRequiredSerialize = 1;
	const { cppdb } = requireUtil();

	serialize = function serialize(options) {
		if (options == null) options = {};

		// Validate arguments
		if (typeof options !== 'object') throw new TypeError('Expected first argument to be an options object');

		// Interpret and validate options
		const attachedName = 'attached' in options ? options.attached : 'main';
		if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
		if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');

		return this[cppdb].serialize(attachedName);
	};
	return serialize;
}

var _function;
var hasRequired_function;

function require_function () {
	if (hasRequired_function) return _function;
	hasRequired_function = 1;
	const { getBooleanOption, cppdb } = requireUtil();

	_function = function defineFunction(name, options, fn) {
		// Apply defaults
		if (options == null) options = {};
		if (typeof options === 'function') { fn = options; options = {}; }

		// Validate arguments
		if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof fn !== 'function') throw new TypeError('Expected last argument to be a function');
		if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
		if (!name) throw new TypeError('User-defined function name cannot be an empty string');

		// Interpret options
		const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
		const deterministic = getBooleanOption(options, 'deterministic');
		const directOnly = getBooleanOption(options, 'directOnly');
		const varargs = getBooleanOption(options, 'varargs');
		let argCount = -1;

		// Determine argument count
		if (!varargs) {
			argCount = fn.length;
			if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError('Expected function.length to be a positive integer');
			if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
		}

		this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
		return this;
	};
	return _function;
}

var aggregate;
var hasRequiredAggregate;

function requireAggregate () {
	if (hasRequiredAggregate) return aggregate;
	hasRequiredAggregate = 1;
	const { getBooleanOption, cppdb } = requireUtil();

	aggregate = function defineAggregate(name, options) {
		// Validate arguments
		if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof options !== 'object' || options === null) throw new TypeError('Expected second argument to be an options object');
		if (!name) throw new TypeError('User-defined function name cannot be an empty string');

		// Interpret options
		const start = 'start' in options ? options.start : null;
		const step = getFunctionOption(options, 'step', true);
		const inverse = getFunctionOption(options, 'inverse', false);
		const result = getFunctionOption(options, 'result', false);
		const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
		const deterministic = getBooleanOption(options, 'deterministic');
		const directOnly = getBooleanOption(options, 'directOnly');
		const varargs = getBooleanOption(options, 'varargs');
		let argCount = -1;

		// Determine argument count
		if (!varargs) {
			argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
			if (argCount > 0) argCount -= 1;
			if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
		}

		this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
		return this;
	};

	const getFunctionOption = (options, key, required) => {
		const value = key in options ? options[key] : null;
		if (typeof value === 'function') return value;
		if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
		if (required) throw new TypeError(`Missing required option "${key}"`);
		return null;
	};

	const getLength = ({ length }) => {
		if (Number.isInteger(length) && length >= 0) return length;
		throw new TypeError('Expected function.length to be a positive integer');
	};
	return aggregate;
}

var table;
var hasRequiredTable;

function requireTable () {
	if (hasRequiredTable) return table;
	hasRequiredTable = 1;
	const { cppdb } = requireUtil();

	table = function defineTable(name, factory) {
		// Validate arguments
		if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
		if (!name) throw new TypeError('Virtual table module name cannot be an empty string');

		// Determine whether the module is eponymous-only or not
		let eponymous = false;
		if (typeof factory === 'object' && factory !== null) {
			eponymous = true;
			factory = defer(parseTableDefinition(factory, 'used', name));
		} else {
			if (typeof factory !== 'function') throw new TypeError('Expected second argument to be a function or a table definition object');
			factory = wrapFactory(factory);
		}

		this[cppdb].table(factory, name, eponymous);
		return this;
	};

	function wrapFactory(factory) {
		return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
			const thisObject = {
				module: moduleName,
				database: databaseName,
				table: tableName,
			};

			// Generate a new table definition by invoking the factory
			const def = apply.call(factory, thisObject, args);
			if (typeof def !== 'object' || def === null) {
				throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
			}

			return parseTableDefinition(def, 'returned', moduleName);
		};
	}

	function parseTableDefinition(def, verb, moduleName) {
		// Validate required properties
		if (!hasOwnProperty.call(def, 'rows')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
		}
		if (!hasOwnProperty.call(def, 'columns')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
		}

		// Validate "rows" property
		const rows = def.rows;
		if (typeof rows !== 'function' || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
		}

		// Validate "columns" property
		let columns = def.columns;
		if (!Array.isArray(columns) || !(columns = [...columns]).every(x => typeof x === 'string')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
		}
		if (columns.length !== new Set(columns).size) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
		}
		if (!columns.length) {
			throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
		}

		// Validate "parameters" property
		let parameters;
		if (hasOwnProperty.call(def, 'parameters')) {
			parameters = def.parameters;
			if (!Array.isArray(parameters) || !(parameters = [...parameters]).every(x => typeof x === 'string')) {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
			}
		} else {
			parameters = inferParameters(rows);
		}
		if (parameters.length !== new Set(parameters).size) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
		}
		if (parameters.length > 32) {
			throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
		}
		for (const parameter of parameters) {
			if (columns.includes(parameter)) {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
			}
		}

		// Validate "safeIntegers" option
		let safeIntegers = 2;
		if (hasOwnProperty.call(def, 'safeIntegers')) {
			const bool = def.safeIntegers;
			if (typeof bool !== 'boolean') {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
			}
			safeIntegers = +bool;
		}

		// Validate "directOnly" option
		let directOnly = false;
		if (hasOwnProperty.call(def, 'directOnly')) {
			directOnly = def.directOnly;
			if (typeof directOnly !== 'boolean') {
				throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
			}
		}

		// Generate SQL for the virtual table definition
		const columnDefinitions = [
			...parameters.map(identifier).map(str => `${str} HIDDEN`),
			...columns.map(identifier),
		];
		return [
			`CREATE TABLE x(${columnDefinitions.join(', ')});`,
			wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName),
			parameters,
			safeIntegers,
			directOnly,
		];
	}

	function wrapGenerator(generator, columnMap, moduleName) {
		return function* virtualTable(...args) {
			/*
				We must defensively clone any buffers in the arguments, because
				otherwise the generator could mutate one of them, which would cause
				us to return incorrect values for hidden columns, potentially
				corrupting the database.
			 */
			const output = args.map(x => Buffer.isBuffer(x) ? Buffer.from(x) : x);
			for (let i = 0; i < columnMap.size; ++i) {
				output.push(null); // Fill with nulls to prevent gaps in array (v8 optimization)
			}
			for (const row of generator(...args)) {
				if (Array.isArray(row)) {
					extractRowArray(row, output, columnMap.size, moduleName);
					yield output;
				} else if (typeof row === 'object' && row !== null) {
					extractRowObject(row, output, columnMap, moduleName);
					yield output;
				} else {
					throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
				}
			}
		};
	}

	function extractRowArray(row, output, columnCount, moduleName) {
		if (row.length !== columnCount) {
			throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
		}
		const offset = output.length - columnCount;
		for (let i = 0; i < columnCount; ++i) {
			output[i + offset] = row[i];
		}
	}

	function extractRowObject(row, output, columnMap, moduleName) {
		let count = 0;
		for (const key of Object.keys(row)) {
			const index = columnMap.get(key);
			if (index === undefined) {
				throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
			}
			output[index] = row[key];
			count += 1;
		}
		if (count !== columnMap.size) {
			throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
		}
	}

	function inferParameters({ length }) {
		if (!Number.isInteger(length) || length < 0) {
			throw new TypeError('Expected function.length to be a positive integer');
		}
		const params = [];
		for (let i = 0; i < length; ++i) {
			params.push(`$${i + 1}`);
		}
		return params;
	}

	const { hasOwnProperty } = Object.prototype;
	const { apply } = Function.prototype;
	const GeneratorFunctionPrototype = Object.getPrototypeOf(function*(){});
	const identifier = str => `"${str.replace(/"/g, '""')}"`;
	const defer = x => () => x;
	return table;
}

var inspect;
var hasRequiredInspect;

function requireInspect () {
	if (hasRequiredInspect) return inspect;
	hasRequiredInspect = 1;
	const DatabaseInspection = function Database() {};

	inspect = function inspect(depth, opts) {
		return Object.assign(new DatabaseInspection(), this);
	};
	return inspect;
}

var database;
var hasRequiredDatabase;

function requireDatabase () {
	if (hasRequiredDatabase) return database;
	hasRequiredDatabase = 1;
	const fs = require$$0__default;
	const path = require$$1__default;
	const util = requireUtil();
	const SqliteError = requireSqliteError();

	let DEFAULT_ADDON;

	function Database(filenameGiven, options) {
		if (new.target == null) {
			return new Database(filenameGiven, options);
		}

		// Apply defaults
		let buffer;
		if (Buffer.isBuffer(filenameGiven)) {
			buffer = filenameGiven;
			filenameGiven = ':memory:';
		}
		if (filenameGiven == null) filenameGiven = '';
		if (options == null) options = {};

		// Validate arguments
		if (typeof filenameGiven !== 'string') throw new TypeError('Expected first argument to be a string');
		if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
		if ('readOnly' in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
		if ('memory' in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');

		// Interpret options
		const filename = filenameGiven.trim();
		const anonymous = filename === '' || filename === ':memory:';
		const readonly = util.getBooleanOption(options, 'readonly');
		const fileMustExist = util.getBooleanOption(options, 'fileMustExist');
		const timeout = 'timeout' in options ? options.timeout : 5000;
		const verbose = 'verbose' in options ? options.verbose : null;
		const nativeBinding = 'nativeBinding' in options ? options.nativeBinding : null;

		// Validate interpreted options
		if (readonly && anonymous && !buffer) throw new TypeError('In-memory/temporary databases cannot be readonly');
		if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
		if (timeout > 0x7fffffff) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
		if (verbose != null && typeof verbose !== 'function') throw new TypeError('Expected the "verbose" option to be a function');
		if (nativeBinding != null && typeof nativeBinding !== 'string' && typeof nativeBinding !== 'object') throw new TypeError('Expected the "nativeBinding" option to be a string or addon object');

		// Load the native addon
		let addon;
		if (nativeBinding == null) {
			addon = DEFAULT_ADDON || (DEFAULT_ADDON = requireBindings()('better_sqlite3.node'));
		} else if (typeof nativeBinding === 'string') {
			// See <https://webpack.js.org/api/module-variables/#__non_webpack_require__-webpack-specific>
			const requireFunc = typeof __non_webpack_require__ === 'function' ? __non_webpack_require__ : commonjsRequire;
			addon = requireFunc(path.resolve(nativeBinding).replace(/(\.node)?$/, '.node'));
		} else {
			// See <https://github.com/WiseLibs/better-sqlite3/issues/972>
			addon = nativeBinding;
		}

		if (!addon.isInitialized) {
			addon.setErrorConstructor(SqliteError);
			addon.isInitialized = true;
		}

		// Make sure the specified directory exists
		if (!anonymous && !fs.existsSync(path.dirname(filename))) {
			throw new TypeError('Cannot open database because the directory does not exist');
		}

		Object.defineProperties(this, {
			[util.cppdb]: { value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null) },
			...wrappers.getters,
		});
	}

	const wrappers = requireWrappers();
	Database.prototype.prepare = wrappers.prepare;
	Database.prototype.transaction = requireTransaction();
	Database.prototype.pragma = requirePragma();
	Database.prototype.backup = requireBackup();
	Database.prototype.serialize = requireSerialize();
	Database.prototype.function = require_function();
	Database.prototype.aggregate = requireAggregate();
	Database.prototype.table = requireTable();
	Database.prototype.loadExtension = wrappers.loadExtension;
	Database.prototype.exec = wrappers.exec;
	Database.prototype.close = wrappers.close;
	Database.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
	Database.prototype.unsafeMode = wrappers.unsafeMode;
	Database.prototype[util.inspect] = requireInspect();

	database = Database;
	return database;
}

var hasRequiredLib;

function requireLib () {
	if (hasRequiredLib) return lib.exports;
	hasRequiredLib = 1;
	lib.exports = requireDatabase();
	lib.exports.SqliteError = requireSqliteError();
	return lib.exports;
}

var libExports = requireLib();
var Database = /*@__PURE__*/getDefaultExportFromCjs(libExports);

const SessionStatusSchema = z.enum(["active", "completed", "error"]);
const ToolCallStatusSchema = z.enum(["pending", "running", "completed", "error"]);
const SessionConfigSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  agentRole: z.string().optional(),
  systemPrompt: z.string().optional()
}).passthrough();
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  reasoning: z.string().optional()
});
const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
  status: ToolCallStatusSchema,
  startedAt: z.number(),
  completedAt: z.number().optional(),
  error: z.string().optional()
});
const SessionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.number(),
  updatedAt: z.number(),
  title: z.string().optional(),
  model: z.string(),
  region: z.string(),
  status: SessionStatusSchema,
  config: SessionConfigSchema.optional()
});
const TurnSchema = z.object({
  id: z.string(),
  sessionId: z.string().uuid(),
  turnNumber: z.number().int().positive(),
  createdAt: z.number(),
  userMessage: MessageSchema,
  assistantResponse: MessageSchema.optional(),
  toolCalls: z.array(ToolCallSchema),
  tokensUsed: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative().optional(),
  error: z.string().nullable()
});
const SCHEMA_VERSION = 1;
function initializeSchema(db) {
  db.exec(`
    -- Schema version tracking
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      title         TEXT,
      model         TEXT NOT NULL,
      region        TEXT NOT NULL,
      status        TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'error')),
      config        TEXT
    );

    -- Turns table
    CREATE TABLE IF NOT EXISTS turns (
      id              TEXT PRIMARY KEY,
      session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      turn_number     INTEGER NOT NULL,
      created_at      INTEGER NOT NULL,
      user_message    TEXT NOT NULL,
      assistant_response TEXT,
      tool_calls      TEXT,
      tokens_used     INTEGER,
      cost_usd        REAL,
      error           TEXT,
      UNIQUE(session_id, turn_number)
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_turns_session ON turns(session_id, turn_number);
    CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  `);
  const existing = db.prepare("SELECT version FROM schema_version").get();
  if (!existing) {
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(SCHEMA_VERSION);
  }
}
function parseJson(json, schema) {
  return schema.parse(JSON.parse(json));
}
function parseJsonOrUndefined(json, schema) {
  if (!json)
    return void 0;
  return schema.parse(JSON.parse(json));
}
function parseJsonOrDefault(json, schema, defaultValue) {
  if (!json)
    return defaultValue;
  return schema.parse(JSON.parse(json));
}
function buildUpdateQuery(table, id, fields, baseUpdates = []) {
  const updates = baseUpdates.map((u) => `${u.column} = ?`);
  const params = baseUpdates.map((u) => u.value);
  for (const field of fields) {
    if (field.value !== void 0) {
      updates.push(`${field.column} = ?`);
      const serialized = field.serialize ? field.serialize(field.value) : field.value;
      params.push(serialized);
    }
  }
  if (updates.length === 0)
    return null;
  params.push(id);
  return {
    sql: `UPDATE ${table} SET ${updates.join(", ")} WHERE id = ?`,
    params
  };
}
class StateRepository {
  db;
  constructor(db) {
    this.db = db;
  }
  // ============================================================================
  // Private Row Mapping Helpers
  // ============================================================================
  /**
   * Map a database row to a validated Session domain object.
   * Uses Zod schema for runtime validation of parsed JSON.
   */
  mapRowToSession(row) {
    return SessionSchema.parse({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      title: row.title ?? void 0,
      model: row.model,
      region: row.region,
      status: row.status,
      config: parseJsonOrUndefined(row.config, SessionConfigSchema)
    });
  }
  /**
   * Map a database row to a validated Turn domain object.
   * Uses Zod schema for runtime validation of parsed JSON.
   */
  mapRowToTurn(row) {
    return TurnSchema.parse({
      id: row.id,
      sessionId: row.session_id,
      turnNumber: row.turn_number,
      createdAt: row.created_at,
      userMessage: parseJson(row.user_message, MessageSchema),
      assistantResponse: parseJsonOrUndefined(row.assistant_response, MessageSchema),
      toolCalls: parseJsonOrDefault(row.tool_calls, z.array(ToolCallSchema), []),
      tokensUsed: row.tokens_used ?? void 0,
      costUsd: row.cost_usd ?? void 0,
      error: row.error
    });
  }
  // ============================================================================
  // Session Methods
  // ============================================================================
  createSession(input) {
    const now = Date.now();
    const id = input.id ?? v4();
    this.db.prepare(`
      INSERT INTO sessions (id, created_at, updated_at, title, model, region, status, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, now, now, input.title ?? null, input.model, input.region, input.status ?? "active", input.config ? JSON.stringify(input.config) : null);
    return this.getSession(id);
  }
  getSession(id) {
    const row = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
    return row ? this.mapRowToSession(row) : null;
  }
  listSessions(options = {}) {
    const limit = options.limit ?? 50;
    let query = "SELECT * FROM sessions";
    const params = [];
    if (options.status) {
      query += " WHERE status = ?";
      params.push(options.status);
    }
    query += " ORDER BY updated_at DESC LIMIT ?";
    params.push(limit);
    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => this.mapRowToSession(row));
  }
  updateSession(id, input) {
    const query = buildUpdateQuery("sessions", id, [
      { column: "title", value: input.title },
      { column: "status", value: input.status },
      {
        column: "config",
        value: input.config,
        serialize: (v) => JSON.stringify(v)
      }
    ], [{ column: "updated_at", value: Date.now() }]);
    if (query) {
      this.db.prepare(query.sql).run(...query.params);
    }
    return this.getSession(id);
  }
  // ============================================================================
  // Turn Methods
  // ============================================================================
  addTurn(sessionId, input) {
    const id = `turn_${v4().slice(0, 8)}`;
    const now = Date.now();
    this.db.prepare(`
      INSERT INTO turns (id, session_id, turn_number, created_at, user_message, tool_calls, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, sessionId, input.turnNumber, now, JSON.stringify(input.userMessage), "[]", null);
    this.db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(now, sessionId);
    return this.getTurn(id);
  }
  getTurn(id) {
    const row = this.db.prepare("SELECT * FROM turns WHERE id = ?").get(id);
    return row ? this.mapRowToTurn(row) : null;
  }
  updateTurn(id, input) {
    const query = buildUpdateQuery("turns", id, [
      {
        column: "assistant_response",
        value: input.assistantResponse,
        serialize: (v) => JSON.stringify(v)
      },
      {
        column: "tool_calls",
        value: input.toolCalls,
        serialize: (v) => JSON.stringify(v)
      },
      { column: "tokens_used", value: input.tokensUsed },
      { column: "cost_usd", value: input.costUsd },
      { column: "error", value: input.error }
    ]);
    if (!query)
      return this.getTurn(id);
    this.db.prepare(query.sql).run(...query.params);
    return this.getTurn(id);
  }
  getSessionTurns(sessionId) {
    const rows = this.db.prepare("SELECT * FROM turns WHERE session_id = ? ORDER BY turn_number ASC").all(sessionId);
    return rows.map((row) => this.mapRowToTurn(row));
  }
  // ============================================================================
  // Session Resume Methods
  // ============================================================================
  /**
   * Get the most recent active session.
   * Used for `--continue` flag functionality.
   */
  getMostRecentSession() {
    const row = this.db.prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1").get();
    return row ? this.mapRowToSession(row) : null;
  }
  /**
   * Restore a complete session with all its turns.
   * Returns session + turns for full context restoration.
   */
  restoreSession(id) {
    const session = this.getSession(id);
    if (!session)
      return null;
    const turns = this.getSessionTurns(id);
    return { session, turns };
  }
}
const state = {
  db: null,
  path: null
};
const DEFAULT_DB_DIR = require$$1.join(os.homedir(), ".oci-provider-examples");
const DEFAULT_DB_PATH = require$$1.join(DEFAULT_DB_DIR, "agent-state.db");
function getDatabasePath() {
  return process.env.AGENT_STATE_DB_PATH ?? DEFAULT_DB_PATH;
}
function ensureDirectory(dbPath) {
  const dir = require$$1.dirname(dbPath);
  if (!require$$0.existsSync(dir)) {
    require$$0.mkdirSync(dir, { recursive: true });
  }
}
function getConnection(customPath) {
  const requestedPath = getDatabasePath();
  if (state.db) {
    if (state.path && requestedPath !== state.path) {
      throw new Error(`Connection already exists to "${state.path}". Cannot connect to "${requestedPath}". Call resetConnection() first to connect to a different database.`);
    }
    return state.db;
  }
  ensureDirectory(requestedPath);
  state.db = new Database(requestedPath);
  state.path = requestedPath;
  state.db.pragma("journal_mode = WAL");
  state.db.pragma("foreign_keys = ON");
  initializeSchema(state.db);
  return state.db;
}
let repository = null;
function getRepository() {
  if (!repository) {
    const db = getConnection();
    repository = new StateRepository(db);
  }
  return repository;
}

export { commonjsGlobal as a, getDefaultExportFromCjs as b, commonjsRequire as c, getAugmentedNamespace as d, getRepository as g };
//# sourceMappingURL=db-BQTIxghw.js.map
