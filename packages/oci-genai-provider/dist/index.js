'use strict';

var provider = require('@ai-sdk/provider');
var ociGenerativeaiinference = require('oci-generativeaiinference');
var common2 = require('oci-common');
var eventsourceParser = require('eventsource-parser');
var zod = require('zod');
var ociAispeech = require('oci-aispeech');
var ociObjectstorage = require('oci-objectstorage');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var common2__namespace = /*#__PURE__*/_interopNamespace(common2);

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  __defProp(target, "default", { value: mod, enumerable: true }) ,
  mod
));

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/constants.js"(exports$1, module) {
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/buffer-util.js"(exports$1, module) {
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/limiter.js"(exports$1, module) {
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/permessage-deflate.js"(exports$1, module) {
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/validation.js"(exports$1, module) {
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/receiver.js"(exports$1, module) {
    var { Writable } = __require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/sender.js"(exports$1, module) {
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/event-target.js"(exports$1, module) {
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/extension.js"(exports$1, module) {
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse };
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket.js"(exports$1, module) {
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes, createHash } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch (e) {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/stream.js"(exports$1, module) {
    require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/subprotocol.js"(exports$1, module) {
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse };
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket-server.js"(exports$1, module) {
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/wrapper.mjs
var wrapper_exports = {};
__export(wrapper_exports, {
  Receiver: () => import_receiver.default,
  Sender: () => import_sender.default,
  WebSocket: () => import_websocket.default,
  WebSocketServer: () => import_websocket_server.default,
  createWebSocketStream: () => import_stream.default,
  default: () => wrapper_default
});
var import_stream, import_receiver, import_sender, import_websocket, import_websocket_server, wrapper_default;
var init_wrapper = __esm({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/wrapper.mjs"() {
    import_stream = __toESM(require_stream());
    import_receiver = __toESM(require_receiver());
    import_sender = __toESM(require_sender());
    import_websocket = __toESM(require_websocket());
    import_websocket_server = __toESM(require_websocket_server());
    wrapper_default = import_websocket.default;
  }
});

// src/language-models/registry.ts
var GROK_REGIONS = ["us-chicago-1", "us-ashburn-1"];
var GEMINI_REGIONS = ["us-chicago-1", "eu-frankfurt-1", "us-ashburn-1"];
var COHERE_REGIONS = [
  "us-chicago-1",
  "eu-frankfurt-1",
  "ap-osaka-1",
  "uk-london-1",
  "us-ashburn-1",
  "ap-mumbai-1",
  "us-sanjose-1",
  "ap-singapore-1",
  "ap-seoul-1",
  "sa-saopaulo-1",
  "ap-sydney-1",
  "ap-tokyo-1",
  "ca-toronto-1"
];
var LLAMA_REGIONS = [
  "us-chicago-1",
  "eu-frankfurt-1",
  "ap-osaka-1",
  "uk-london-1",
  "us-ashburn-1",
  "ap-mumbai-1",
  "us-sanjose-1",
  "ap-singapore-1",
  "ap-seoul-1",
  "sa-saopaulo-1",
  "ap-sydney-1",
  "ap-tokyo-1",
  "ca-toronto-1"
];
var OPENAI_REGIONS = ["us-chicago-1", "eu-frankfurt-1", "us-ashburn-1"];
var MODEL_CATALOG = [
  // ==========================================================================
  // xAI Grok models (US regions only)
  // ==========================================================================
  {
    id: "xai.grok-code-fast-1",
    name: "Grok Code Fast 1",
    family: "grok",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: GROK_REGIONS,
    codingRecommended: true,
    codingNote: "Purpose-built for code generation and understanding"
  },
  {
    id: "xai.grok-4-1-fast-reasoning",
    name: "Grok 4.1 Fast Reasoning",
    family: "grok",
    // Note: Grok models don't support reasoningEffort parameter despite the "-reasoning" name
    // They throw: "This model does not support `reasoning_effort`"
    // Reasoning is built-in but not controllable via API parameter
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 2e6,
    speed: "very-fast",
    regions: GROK_REGIONS,
    codingRecommended: true,
    codingNote: "Built-in reasoning always active - 2M context window ideal for large codebases"
  },
  {
    id: "xai.grok-4-1-fast-non-reasoning",
    name: "Grok 4.1 Fast (Non-Reasoning)",
    family: "grok",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 2e6,
    speed: "very-fast",
    regions: GROK_REGIONS
  },
  {
    id: "xai.grok-4-fast-reasoning",
    name: "Grok 4 Fast Reasoning",
    family: "grok",
    // Note: Grok models don't support reasoningEffort parameter (see xai.grok-4-1-fast-reasoning)
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: GROK_REGIONS,
    codingRecommended: true,
    codingNote: "Built-in reasoning always active"
  },
  {
    id: "xai.grok-4-fast-non-reasoning",
    name: "Grok 4 Fast (Non-Reasoning)",
    family: "grok",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: GROK_REGIONS
  },
  {
    id: "xai.grok-4",
    name: "Grok 4",
    family: "grok",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "fast",
    regions: GROK_REGIONS
  },
  {
    id: "xai.grok-3",
    name: "Grok 3",
    family: "grok",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "fast",
    regions: GROK_REGIONS
  },
  {
    id: "xai.grok-3-fast",
    name: "Grok 3 Fast",
    family: "grok",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: GROK_REGIONS
  },
  {
    id: "xai.grok-3-mini",
    name: "Grok 3 Mini",
    family: "grok",
    capabilities: { streaming: true, tools: false, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: GROK_REGIONS,
    codingNote: "No tool support - not recommended for coding agents"
  },
  {
    id: "xai.grok-3-mini-fast",
    name: "Grok 3 Mini Fast",
    family: "grok",
    capabilities: { streaming: true, tools: false, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: GROK_REGIONS,
    codingNote: "No tool support - not recommended for coding agents"
  },
  // ==========================================================================
  // Meta Llama models
  // ==========================================================================
  {
    id: "meta.llama-4-maverick-17b-128e-instruct-fp8",
    name: "Llama 4 Maverick",
    family: "llama",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: ["us-chicago-1", "us-ashburn-1"],
    codingRecommended: true,
    codingNote: "Latest Llama with excellent code capabilities"
  },
  {
    id: "meta.llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout",
    family: "llama",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "very-fast",
    regions: ["us-chicago-1", "us-ashburn-1"]
  },
  {
    id: "meta.llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    family: "llama",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "fast",
    regions: LLAMA_REGIONS,
    codingRecommended: true,
    codingNote: "Best general-purpose coding model, widely available"
  },
  {
    id: "meta.llama-3.2-90b-vision-instruct",
    name: "Llama 3.2 Vision 90B",
    family: "llama",
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 131072,
    speed: "medium",
    regions: ["us-chicago-1", "us-ashburn-1"],
    codingNote: "Vision support for analyzing screenshots/diagrams"
  },
  {
    id: "meta.llama-3.2-11b-vision-instruct",
    name: "Llama 3.2 Vision 11B",
    family: "llama",
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 131072,
    speed: "fast",
    regions: ["us-chicago-1", "us-ashburn-1"],
    codingNote: "Lightweight vision model for screenshots"
  },
  {
    id: "meta.llama-3.1-405b-instruct",
    name: "Llama 3.1 405B Instruct",
    family: "llama",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "slow",
    regions: LLAMA_REGIONS,
    dedicatedOnly: true,
    codingNote: "Dedicated clusters only - expensive but powerful"
  },
  {
    id: "meta.llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct",
    family: "llama",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "fast",
    regions: LLAMA_REGIONS
  },
  // ==========================================================================
  // Google Gemini models
  // ==========================================================================
  {
    id: "google.gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    family: "gemini",
    capabilities: { streaming: true, tools: true, vision: true, reasoning: true },
    contextWindow: 1048576,
    speed: "fast",
    regions: GEMINI_REGIONS,
    codingRecommended: true,
    codingNote: "1M context, fast, vision for screenshots - best balance"
  },
  {
    id: "google.gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    family: "gemini",
    capabilities: { streaming: true, tools: true, vision: true, reasoning: true },
    contextWindow: 1048576,
    speed: "medium",
    regions: GEMINI_REGIONS,
    codingNote: "1M context, higher quality but slower than Flash"
  },
  {
    id: "google.gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    family: "gemini",
    capabilities: { streaming: true, tools: false, vision: true },
    contextWindow: 1048576,
    speed: "very-fast",
    regions: GEMINI_REGIONS,
    codingNote: "No tool support - not recommended for coding agents"
  },
  // ==========================================================================
  // Cohere Command models
  // ==========================================================================
  {
    id: "cohere.command-a-03-2025",
    name: "Command A (Mar 2025)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 256e3,
    speed: "fast",
    regions: COHERE_REGIONS,
    codingRecommended: true,
    codingNote: "256K context, latest Cohere model with tool support"
  },
  {
    id: "cohere.command-plus-latest",
    name: "Command+ (Latest)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 128e3,
    speed: "fast",
    regions: COHERE_REGIONS
  },
  {
    id: "cohere.command-latest",
    name: "Command (Latest)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 128e3,
    speed: "fast",
    regions: COHERE_REGIONS
  },
  {
    id: "cohere.command-r-plus-08-2024",
    name: "Command R+ (Aug 2024)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 128e3,
    speed: "fast",
    regions: COHERE_REGIONS
  },
  {
    id: "cohere.command-r-08-2024",
    name: "Command R (Aug 2024)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 128e3,
    speed: "fast",
    regions: COHERE_REGIONS
  },
  {
    id: "cohere.command-a-reasoning-08-2025",
    name: "Command A Reasoning",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false, reasoning: true },
    contextWindow: 256e3,
    speed: "medium",
    regions: COHERE_REGIONS,
    codingNote: "Enhanced reasoning for complex logic"
  },
  {
    id: "cohere.command-a-vision-07-2025",
    name: "Command A Vision",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 128e3,
    speed: "medium",
    regions: COHERE_REGIONS,
    dedicatedOnly: true
  },
  {
    id: "cohere.command-a-reasoning",
    name: "Command A Reasoning (Legacy)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false, reasoning: true },
    contextWindow: 256e3,
    speed: "medium",
    regions: COHERE_REGIONS,
    dedicatedOnly: true
  },
  {
    id: "cohere.command-a-vision",
    name: "Command A Vision (Legacy)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 131072,
    speed: "medium",
    regions: COHERE_REGIONS,
    dedicatedOnly: true
  },
  {
    id: "cohere.command-r-plus",
    name: "Command R+ (Latest)",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 128e3,
    speed: "fast",
    regions: COHERE_REGIONS
  },
  {
    id: "cohere.command-r-16k",
    name: "Command R 16K",
    family: "cohere",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 16e3,
    speed: "fast",
    regions: COHERE_REGIONS,
    codingNote: "Small context - not ideal for large codebases"
  },
  // ==========================================================================
  // OpenAI GPT-OSS models
  // ==========================================================================
  {
    id: "openai.gpt-oss-120b",
    name: "GPT-OSS 120B",
    family: "openai",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "medium",
    regions: OPENAI_REGIONS,
    codingNote: "OpenAI open-source model - less proven for code"
  },
  {
    id: "openai.gpt-oss-20b",
    name: "GPT-OSS 20B",
    family: "openai",
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: "fast",
    regions: OPENAI_REGIONS,
    codingNote: "Lightweight OpenAI model"
  }
];
function isValidModelId(modelId) {
  return MODEL_CATALOG.some((m) => m.id === modelId);
}
function getModelMetadata(modelId) {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}
function getAllModels() {
  return MODEL_CATALOG;
}
function getModelsByFamily(family) {
  return MODEL_CATALOG.filter((m) => m.family === family);
}
function getModelsByRegion(region, includeDedicatedOnly = false) {
  return MODEL_CATALOG.filter(
    (m) => m.regions.includes(region) && (includeDedicatedOnly || !m.dedicatedOnly)
  );
}
function getCodingRecommendedModels(region) {
  return MODEL_CATALOG.filter(
    (m) => m.regions.includes(region) && !m.dedicatedOnly && m.capabilities.tools && m.codingRecommended === true
  );
}
function isCodingSuitable(modelId) {
  const model = MODEL_CATALOG.find((m) => m.id === modelId);
  if (!model) return false;
  return model.capabilities.tools;
}
function supportsReasoning(modelId) {
  const model = MODEL_CATALOG.find((m) => m.id === modelId);
  return model?.capabilities.reasoning ?? false;
}

// src/language-models/converters/messages.ts
var ROLE_MAP = {
  user: "USER",
  assistant: "ASSISTANT",
  system: "SYSTEM",
  tool: "TOOL"
};
function convertToOCIMessages(prompt) {
  return prompt.map((message) => {
    const role = message.role;
    if (!ROLE_MAP[role]) {
      throw new Error(`Unsupported role: ${role}`);
    }
    const ociRole = ROLE_MAP[role];
    if (typeof message.content === "string") {
      return {
        role: ociRole,
        content: [{ type: "TEXT", text: message.content }]
      };
    }
    if (Array.isArray(message.content)) {
      if (role === "tool") {
        const toolResultPart = message.content.find(
          (part) => part.type === "tool-result"
        );
        if (toolResultPart) {
          const outputText = extractToolResultText(toolResultPart);
          return {
            role: ociRole,
            toolCallId: toolResultPart.toolCallId,
            content: [{ type: "TEXT", text: outputText }]
          };
        }
      }
      let toolCalls = void 0;
      if (role === "assistant") {
        const toolCallParts = message.content.filter(
          (part) => part.type === "tool-call"
        );
        if (toolCallParts.length > 0) {
          toolCalls = toolCallParts.map((part) => ({
            id: part.toolCallId,
            type: "FUNCTION",
            function: {
              name: part.toolName,
              arguments: typeof part.input === "string" ? part.input : JSON.stringify(part.input ?? {})
            }
          }));
        }
      }
      const content = message.content.map((part) => {
        if (part.type === "text") {
          return convertTextPartToOCIContent(part);
        }
        if (part.type === "file") {
          return convertFilePartToOCIContent(part);
        }
        return null;
      }).filter((part) => part !== null);
      const result = {
        role: ociRole,
        content
      };
      if (toolCalls) {
        result.toolCalls = toolCalls;
      }
      return result;
    }
    return {
      role: ociRole,
      content: []
    };
  });
}
function convertTextPartToOCIContent(part) {
  return { type: "TEXT", text: part.text };
}
function convertFilePartToOCIContent(part) {
  if (part.mediaType && part.mediaType.startsWith("image/")) {
    let url = "";
    if (part.data instanceof Uint8Array) {
      const base64 = Buffer.from(part.data).toString("base64");
      url = `data:${part.mediaType};base64,${base64}`;
    } else if (typeof part.data === "string") {
      url = part.data.startsWith("data:") ? part.data : `data:${part.mediaType};base64,${part.data}`;
    } else if (part.data instanceof URL) {
      url = part.data.toString();
    }
    return { type: "IMAGE", imageUrl: { url } };
  }
  return null;
}
function extractToolResultText(part) {
  const output = part.output;
  if (output.type === "text") {
    return output.value;
  }
  return JSON.stringify(output);
}

// src/language-models/converters/cohere-messages.ts
function convertToCohereFormat(messages) {
  if (messages.length === 0) {
    throw new Error("At least one message is required");
  }
  const lastUserIndex = messages.map((m) => m.role).lastIndexOf("USER");
  if (lastUserIndex === -1) {
    throw new Error("At least one USER message is required");
  }
  const systemMessages = messages.filter((m) => m.role === "SYSTEM").map((m) => m.content.filter((c) => c.type === "TEXT").map((c) => c.text)).flat().join("\n");
  const currentMessage = messages[lastUserIndex];
  const messageText = currentMessage.content.filter((c) => c.type === "TEXT").map((c) => c.text).join("\n");
  const toolCallsById = /* @__PURE__ */ new Map();
  const chatHistory = [];
  const toolResults = [];
  for (let i = 0; i < lastUserIndex; i++) {
    const msg = messages[i];
    if (msg.role === "SYSTEM") {
      continue;
    }
    if (msg.role === "TOOL") {
      const resultText = msg.content.filter((c) => c.type === "TEXT").map((c) => c.text).join("\n");
      const toolCallId = msg.toolCallId;
      if (toolCallId) {
        const toolCall = toolCallsById.get(toolCallId);
        if (toolCall) {
          toolResults.push({
            call: {
              name: toolCall.name,
              parameters: toolCall.parameters
            },
            outputs: [{ result: resultText }]
          });
        }
      }
      continue;
    }
    const text = msg.content.filter((c) => c.type === "TEXT").map((c) => c.text).join("\n");
    if (msg.role === "ASSISTANT") {
      const cohereMessage = {
        role: "CHATBOT",
        message: text
      };
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        const cohereToolCalls = msg.toolCalls.map((tc) => {
          let parameters = {};
          try {
            if (tc.function.arguments) {
              parameters = JSON.parse(tc.function.arguments);
            }
          } catch {
            parameters = {};
          }
          toolCallsById.set(tc.id, {
            name: tc.function.name,
            parameters
          });
          return {
            name: tc.function.name,
            parameters
          };
        });
        cohereMessage.toolCalls = cohereToolCalls;
      }
      chatHistory.push(cohereMessage);
      continue;
    }
    if (msg.role === "USER") {
      chatHistory.push({
        role: "USER",
        message: text
      });
    }
  }
  const hasToolResults = toolResults.length > 0;
  return {
    message: messageText,
    ...chatHistory.length > 0 ? { chatHistory } : {},
    ...systemMessages ? { preambleOverride: systemMessages } : {},
    ...hasToolResults ? { toolResults } : {},
    hasToolResults
  };
}

// src/language-models/converters/tools.ts
function convertToOCITools(tools, apiFormat) {
  if (apiFormat === "COHERE" || apiFormat === "COHEREV2") {
    return tools.map((tool) => convertToCohereToolFormat(tool));
  }
  return tools.map((tool) => convertToGenericToolFormat(tool));
}
function sanitizeSchema(schema) {
  if (!schema || typeof schema !== "object") {
    return schema;
  }
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchema);
  }
  const sanitized = { ...schema };
  delete sanitized.$schema;
  delete sanitized["$ref"];
  for (const [key, value] of Object.entries(sanitized)) {
    sanitized[key] = sanitizeSchema(value);
  }
  return sanitized;
}
function convertToGenericToolFormat(tool) {
  const parameters = sanitizeSchema(tool.inputSchema) || {};
  if (!parameters.type) {
    parameters.type = "object";
  }
  return {
    type: "FUNCTION",
    name: tool.name,
    description: tool.description ?? "",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    parameters
  };
}
function convertToCohereToolFormat(tool) {
  const schema = tool.inputSchema;
  const parameterDefinitions = {};
  if (schema?.properties) {
    const required = schema.required ?? [];
    for (const [key, value] of Object.entries(schema.properties)) {
      parameterDefinitions[key] = {
        type: value.type || "string",
        // Default to string if type is missing
        description: value.description,
        isRequired: required.includes(key)
        // Cohere uses isRequired, not required
      };
    }
  }
  return {
    name: tool.name,
    description: tool.description ?? "",
    parameterDefinitions: Object.keys(parameterDefinitions).length > 0 ? parameterDefinitions : void 0
  };
}
function convertToOCIToolChoice(choice) {
  switch (choice.type) {
    case "auto":
      return { type: "AUTO" };
    case "required":
      return { type: "REQUIRED" };
    case "none":
      return { type: "NONE" };
    case "tool":
      return {
        type: "FUNCTION",
        function: { name: choice.toolName }
      };
    default:
      return { type: "AUTO" };
  }
}
function supportsToolCalling(modelId) {
  const supportedPatterns = [
    /^meta\.llama-3\.[1-9]/,
    // Llama 3.1+
    /^cohere\.command-r/,
    // Cohere Command R and R+
    /^xai\.grok/,
    // Grok models
    /^google\.gemini/
    // Gemini models
  ];
  return supportedPatterns.some((pattern) => pattern.test(modelId));
}
var FINISH_REASON_MAP = {
  STOP: "stop",
  LENGTH: "length",
  CONTENT_FILTER: "content-filter",
  TOOL_CALLS: "tool-calls",
  ERROR: "error"
};
async function* parseSSEStream(input, options) {
  const stream = input instanceof ReadableStream ? input : input.body;
  if (!stream) {
    throw new Error("Response body is not readable");
  }
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parts = [];
  let yieldedIndex = 0;
  let lastFinishReason = "stop";
  let lastRawFinishReason = "STOP";
  let lastUsage = { promptTokens: 0, completionTokens: 0 };
  let hasFinishOrUsage = false;
  const includeRawChunks = options?.includeRawChunks ?? false;
  const parser = eventsourceParser.createParser({
    onEvent: (event) => {
      const data = event.data;
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        if (includeRawChunks) {
          parts.push({
            type: "raw",
            rawValue: parsed
          });
        }
        if (parsed.message?.reasoningContent) {
          parts.push({
            type: "reasoning-delta",
            reasoningDelta: parsed.message.reasoningContent
          });
        }
        const topLevelText = parsed.text || parsed.textDelta;
        if (topLevelText) {
          parts.push({
            type: "text-delta",
            textDelta: topLevelText
          });
        }
        if (parsed.message?.content) {
          for (const part of parsed.message.content) {
            if (part.type === "THINKING" && part.thinking) {
              parts.push({
                type: "reasoning-delta",
                reasoningDelta: part.thinking
              });
            }
          }
        }
        const contentParts = parsed.message?.content;
        if (contentParts) {
          for (const part of contentParts) {
            if ((part.type === "TEXT" || !part.type) && part.text) {
              parts.push({
                type: "text-delta",
                textDelta: part.text
              });
            }
          }
        }
        const toolCalls = parsed.message?.toolCalls ?? parsed.toolCalls;
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            if (toolCall.function?.name) {
              parts.push({
                type: "tool-call",
                toolCallId: toolCall.id ?? `tool-call-${Date.now()}`,
                toolName: toolCall.function.name,
                input: toolCall.function.arguments ?? "{}"
              });
            } else if (toolCall.name) {
              parts.push({
                type: "tool-call",
                toolCallId: `tool-call-${Date.now()}`,
                toolName: toolCall.name,
                input: JSON.stringify(toolCall.parameters ?? {})
              });
            }
          }
        }
        if (parsed.finishReason || parsed.usage) {
          hasFinishOrUsage = true;
          if (parsed.finishReason) {
            lastRawFinishReason = parsed.finishReason.toUpperCase();
            lastFinishReason = FINISH_REASON_MAP[lastRawFinishReason] ?? "stop";
          }
          if (parsed.usage) {
            const usage = parsed.usage;
            const tokenDetails = usage.completionTokensDetails;
            lastUsage = {
              promptTokens: usage.promptTokens ?? usage.promptTokenCount ?? lastUsage.promptTokens,
              completionTokens: usage.completionTokens ?? usage.completionTokenCount ?? lastUsage.completionTokens,
              reasoningTokens: tokenDetails?.reasoningTokens ?? lastUsage.reasoningTokens,
              acceptedPredictionTokens: tokenDetails?.acceptedPredictionTokens ?? lastUsage.acceptedPredictionTokens,
              rejectedPredictionTokens: tokenDetails?.rejectedPredictionTokens ?? lastUsage.rejectedPredictionTokens
            };
          }
        }
      } catch {
        if (includeRawChunks) {
          parts.push({
            type: "raw",
            rawValue: data
          });
        }
      }
    }
  });
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    parser.feed(decoder.decode(result.value, { stream: true }));
    while (yieldedIndex < parts.length) {
      yield parts[yieldedIndex++];
    }
  }
  if (hasFinishOrUsage) {
    yield {
      type: "finish",
      finishReason: {
        unified: lastFinishReason,
        raw: lastRawFinishReason
      },
      usage: lastUsage
    };
  }
  while (yieldedIndex < parts.length) {
    yield parts[yieldedIndex++];
  }
}
async function createAuthProvider(config) {
  const authMethod = config.auth || "config_file";
  switch (authMethod) {
    case "config_file": {
      const configPath = config.configPath || void 0;
      const profile = config.profile || "DEFAULT";
      return new common2__namespace.ConfigFileAuthenticationDetailsProvider(configPath, profile);
    }
    case "instance_principal": {
      const builder = new common2__namespace.InstancePrincipalsAuthenticationDetailsProviderBuilder();
      return await builder.build();
    }
    case "resource_principal": {
      return common2__namespace.ResourcePrincipalAuthenticationDetailsProvider.builder();
    }
    default:
      throw new Error(
        `Unsupported authentication method: ${authMethod}. Supported methods: config_file, instance_principal, resource_principal`
      );
  }
}
function getCompartmentId(config) {
  const compartmentId = config.compartmentId || process.env.OCI_COMPARTMENT_ID;
  if (!compartmentId) {
    throw new Error(
      "Compartment ID not found. Provide via config.compartmentId or OCI_COMPARTMENT_ID environment variable."
    );
  }
  return compartmentId;
}
function getRegion(config) {
  return config.region || process.env.OCI_REGION || "eu-frankfurt-1";
}
var OCIGenAIError = class extends Error {
  constructor(message, statusCodeOrOptions, retryable = false) {
    super(message);
    this.name = "OCIGenAIError";
    if (typeof statusCodeOrOptions === "number") {
      this.statusCode = statusCodeOrOptions;
      this.retryable = retryable;
    } else {
      this.cause = statusCodeOrOptions?.cause;
      this.retryable = retryable;
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var NetworkError = class extends OCIGenAIError {
  constructor(message, options) {
    super(message, options, true);
    this.name = "NetworkError";
    this.retryable = true;
    this.code = options?.code;
  }
};
var RateLimitError = class extends OCIGenAIError {
  constructor(message, options) {
    super(message, options, true);
    this.name = "RateLimitError";
    this.retryable = true;
    this.retryAfterMs = options?.retryAfterMs;
  }
};
var AuthenticationError = class extends OCIGenAIError {
  constructor(message, options) {
    super(message, options, false);
    this.name = "AuthenticationError";
    this.retryable = false;
    this.authType = options?.authType;
  }
};
var ModelNotFoundError = class extends OCIGenAIError {
  constructor(modelId, options) {
    super(
      `Model not found: ${modelId}. Check that the model ID is correct and available in your region.`,
      options,
      false
    );
    this.name = "ModelNotFoundError";
    this.retryable = false;
    this.modelId = modelId;
  }
};
var OCIValidationError = class extends OCIGenAIError {
  constructor(message, details) {
    super(message, void 0, false);
    this.name = "OCIValidationError";
    this.retryable = false;
    this.details = details;
  }
};
function isRetryableStatusCode(statusCode) {
  return statusCode === 429 || statusCode >= 500;
}
function handleOCIError(error) {
  if (provider.AISDKError.isInstance(error)) {
    return error;
  }
  if (error instanceof OCIGenAIError) {
    if (error instanceof OCIValidationError) {
      return new provider.InvalidResponseDataError({
        message: error.message,
        data: error.details
      });
    }
    return new provider.APICallError({
      message: error.message,
      url: "oci-genai",
      requestBodyValues: void 0,
      statusCode: error.statusCode,
      responseHeaders: error.statusCode ? { status: String(error.statusCode) } : void 0,
      responseBody: void 0,
      cause: error.cause,
      isRetryable: error.retryable
    });
  }
  const statusCode = error?.statusCode ?? error?.status;
  const retryable = statusCode ? isRetryableStatusCode(statusCode) : false;
  const responseHeaders = error?.responseHeaders;
  const opcRequestId = error?.opcRequestId;
  const responseBody = error?.responseBody;
  const url = error?.url ?? "oci-genai";
  let message = error instanceof Error ? error.message : String(error);
  if (statusCode === 401) {
    message += "\nCheck OCI authentication configuration.";
  } else if (statusCode === 403) {
    message += "\nCheck IAM policies and compartment access.";
  } else if (statusCode === 404) {
    message += "\nCheck model ID and regional availability.";
  } else if (statusCode === 429) {
    message += "\nRate limit exceeded. Implement retry with backoff.";
  }
  return new provider.APICallError({
    message,
    url,
    requestBodyValues: void 0,
    statusCode,
    responseHeaders: responseHeaders ?? (opcRequestId ? { "opc-request-id": opcRequestId } : void 0),
    responseBody,
    cause: error,
    isRetryable: retryable
  });
}

// src/shared/utils/retry.ts
var DEFAULT_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 1e4
};
var RETRYABLE_ERROR_CODES = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ECONNREFUSED", "EAI_AGAIN"];
var RETRYABLE_ERROR_MESSAGES = ["socket hang up", "network error", "fetch failed"];
function isRetryableError(error) {
  if (!(error instanceof Error)) {
    return false;
  }
  const status = error.status ?? error.statusCode;
  if (typeof status === "number") {
    if (status === 429 || status >= 500 && status < 600) {
      return true;
    }
    if (status >= 400 && status < 500) {
      return false;
    }
  }
  const code = error.code;
  if (code && RETRYABLE_ERROR_CODES.includes(code)) {
    return true;
  }
  const message = error.message.toLowerCase();
  for (const pattern of RETRYABLE_ERROR_MESSAGES) {
    if (message.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  for (const errorCode of RETRYABLE_ERROR_CODES) {
    if (error.message.includes(errorCode)) {
      return true;
    }
  }
  return false;
}
function calculateDelay(attempt, baseDelayMs, maxDelayMs) {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}
async function withRetry(fn, options) {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    baseDelayMs = DEFAULT_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_OPTIONS.maxDelayMs,
    isRetryable = isRetryableError
  } = options ?? {};
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryable(error)) {
        throw error;
      }
      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// src/shared/utils/timeout.ts
var TimeoutError = class _TimeoutError extends Error {
  constructor(timeoutMs, operation) {
    const message = operation ? `${operation} timed out after ${timeoutMs}ms` : `Operation timed out after ${timeoutMs}ms`;
    super(message);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
    this.operation = operation;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _TimeoutError);
    }
  }
};
function withTimeout(promise, timeoutMs, operation) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(timeoutMs, operation));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
var OnDemandServingModeSchema = zod.z.object({
  type: zod.z.literal("ON_DEMAND"),
  modelId: zod.z.string().min(1, { message: "modelId is required for ON_DEMAND serving" }),
  endpointId: zod.z.string().optional()
});
var DedicatedServingModeSchema = zod.z.object({
  type: zod.z.literal("DEDICATED"),
  modelId: zod.z.string().optional(),
  endpointId: zod.z.string().min(1, { message: "endpointId is required for DEDICATED serving" })
});
var ServingModeSchema = zod.z.discriminatedUnion("type", [OnDemandServingModeSchema, DedicatedServingModeSchema]).describe("Model serving mode configuration");
var OCIProviderOptionsSchema = zod.z.object({
  /**
   * Reasoning effort level for models that support extended thinking.
   * Only applies to Generic API format models (e.g., Grok, Gemini).
   */
  reasoningEffort: zod.z.enum(["none", "minimal", "low", "medium", "high"]).optional().describe("Reasoning effort level for Generic API format models"),
  /**
   * Enable thinking/reasoning for Cohere models.
   */
  thinking: zod.z.boolean().optional().describe("Enable thinking mode for Cohere models"),
  /**
   * Token budget for thinking/reasoning.
   * Limits the number of tokens used for extended reasoning.
   * Requires thinking: true to be set.
   */
  tokenBudget: zod.z.number().int().positive().optional().describe("Maximum tokens for reasoning (must be positive integer)"),
  /**
   * Serving mode for the model using discriminated union.
   * ON_DEMAND requires modelId, DEDICATED requires endpointId.
   */
  servingMode: ServingModeSchema.optional(),
  /**
   * Custom compartment ID to use for this request.
   * Overrides the default compartment from config.
   */
  compartmentId: zod.z.string().optional().describe("Compartment ID override"),
  /**
   * Custom endpoint URL to use for this request.
   * Overrides the default endpoint from config.
   */
  endpoint: zod.z.string().url().optional().describe("Endpoint URL override"),
  /**
   * Per-request options for timeout and retry configuration.
   */
  requestOptions: zod.z.object({
    timeoutMs: zod.z.number().int().positive().optional(),
    retry: zod.z.object({
      enabled: zod.z.boolean().optional(),
      maxRetries: zod.z.number().int().nonnegative().optional(),
      baseDelayMs: zod.z.number().int().positive().optional(),
      maxDelayMs: zod.z.number().int().positive().optional()
    }).strict().optional()
  }).strict().optional().describe("Per-request timeout and retry configuration")
}).strict().refine((data) => !data.tokenBudget || data.thinking === true, {
  message: "tokenBudget requires thinking to be enabled",
  path: ["tokenBudget"]
});
function parseProviderOptions(options) {
  if (options === void 0 || options === null) {
    return {};
  }
  const result = OCIProviderOptionsSchema.safeParse(options);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new OCIValidationError(`Invalid OCI provider options: ${issues}`, {
      issues: result.error.issues
    });
  }
  return result.data;
}
var regionPattern = /^[a-z]{2,3}-[a-z]+-\d+$/;
var OCID_PATTERNS = {
  /** Pattern for compartment OCIDs */
  compartment: /^ocid1\.compartment\.[a-z0-9]+\.[a-z0-9-]*\.[a-z0-9]+$/i,
  /** Pattern for generative AI endpoint OCIDs */
  generativeaiendpoint: /^ocid1\.generativeaiendpoint\.[a-z0-9]+\.[a-z0-9-]*\.[a-z0-9]+$/i,
  /** Pattern for any OCI resource OCID */
  generic: /^ocid1\.[a-z0-9]+\.[a-z0-9]+\.[a-z0-9-]*\.[a-z0-9]+$/i
};
zod.z.string().regex(OCID_PATTERNS.generic, {
  message: "Invalid OCID format. Expected format: ocid1.<resource-type>.<realm>.[region.]<id>"
}).describe("An OCI resource identifier (OCID)");
var CompartmentIdSchema = zod.z.string().regex(OCID_PATTERNS.compartment, {
  message: "Invalid compartment ID format. Expected OCID format: ocid1.compartment.oc1..xxxxx"
}).describe("The compartment OCID for OCI GenAI requests");
var RegionSchema = zod.z.string().regex(regionPattern, {
  message: "Invalid region format. Expected format: <geo>-<city>-<number> (e.g., us-chicago-1)"
}).describe("The OCI region identifier");
var ConfigProfileSchema = zod.z.string().min(1, { message: "Config profile cannot be empty" }).default("DEFAULT").describe("The OCI config profile name from ~/.oci/config");
var ServingModeSchema2 = zod.z.enum(["on-demand", "dedicated"], {
  errorMap: () => ({ message: "Serving mode must be either 'on-demand' or 'dedicated'" })
}).default("on-demand").describe("The serving mode for model inference");
var EndpointIdSchema = zod.z.string().regex(OCID_PATTERNS.generativeaiendpoint, {
  message: "Invalid endpoint ID format. Expected OCID format: ocid1.generativeaiendpoint.oc1..xxxxx"
}).describe("The endpoint OCID for dedicated serving mode");
var OCIProviderSettingsSchema = zod.z.object({
  compartmentId: CompartmentIdSchema.optional(),
  region: RegionSchema.optional(),
  configProfile: ConfigProfileSchema.optional(),
  servingMode: ServingModeSchema2.optional(),
  endpointId: EndpointIdSchema.optional()
}).refine(
  (data) => {
    if (data.servingMode === "dedicated" && !data.endpointId) {
      return false;
    }
    return true;
  },
  {
    message: "endpointId is required when servingMode is 'dedicated'",
    path: ["endpointId"]
  }
).describe("Configuration settings for the OCI GenAI provider");
function validateProviderSettings(settings) {
  return OCIProviderSettingsSchema.safeParse(settings);
}
function parseProviderSettings(settings) {
  const result = OCIProviderSettingsSchema.safeParse(settings);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new OCIValidationError(`Invalid OCI provider settings: ${issues}`, {
      issues: result.error.issues
    });
  }
  return result.data;
}
var ModelIdSchema = zod.z.string().min(1, { message: "Model ID cannot be empty" }).describe("The model ID or endpoint OCID");
var OCIChatModelIdSchema = zod.z.object({
  modelId: ModelIdSchema,
  isDedicatedEndpoint: zod.z.boolean().optional().default(false)
});

// src/shared/provider-options.ts
function getOCIProviderOptions(providerOptions) {
  if (!providerOptions) {
    return void 0;
  }
  const raw = providerOptions.oci;
  if (!raw || typeof raw !== "object") {
    return void 0;
  }
  return parseProviderOptions(raw);
}
function resolveServingMode(modelId, configMode, overrideMode) {
  const mode = overrideMode ?? configMode;
  if (!mode || mode.type === "ON_DEMAND") {
    return {
      servingType: "ON_DEMAND",
      modelId: mode?.modelId ?? modelId
    };
  }
  if (!mode.endpointId) {
    throw new provider.InvalidArgumentError({
      argument: "providerOptions.oci.servingMode.endpointId",
      message: "Dedicated serving requires an endpointId."
    });
  }
  return {
    servingType: "DEDICATED",
    endpointId: mode.endpointId
  };
}
function resolveCompartmentId(configCompartmentId, overrideCompartmentId) {
  return overrideCompartmentId ?? configCompartmentId;
}
function resolveEndpoint(configEndpoint, overrideEndpoint) {
  return overrideEndpoint ?? configEndpoint;
}

// src/shared/request-options.ts
var DEFAULT_REQUEST_OPTIONS = {
  timeoutMs: 3e4,
  retry: {
    enabled: true,
    maxRetries: 3,
    baseDelayMs: 100,
    maxDelayMs: 1e4
  }
};
function resolveRequestOptions(configOptions, perRequestOptions) {
  return {
    timeoutMs: perRequestOptions?.timeoutMs ?? configOptions?.timeoutMs ?? DEFAULT_REQUEST_OPTIONS.timeoutMs,
    retry: {
      ...DEFAULT_REQUEST_OPTIONS.retry,
      ...configOptions?.retry,
      ...perRequestOptions?.retry
    }
  };
}

// src/shared/oci-sdk-types.ts
function toOCIReasoningEffort(effort) {
  const upper = effort.toUpperCase();
  switch (upper) {
    case "NONE":
      return "NONE";
    case "MINIMAL":
      return "MINIMAL";
    case "LOW":
      return "LOW";
    case "MEDIUM":
      return "MEDIUM";
    case "HIGH":
      return "HIGH";
    default:
      return "MEDIUM";
  }
}
function createThinkingConfig(enabled, tokenBudget) {
  return {
    type: enabled ? "ENABLED" : "DISABLED",
    tokenBudget
  };
}

// src/language-models/OCILanguageModel.ts
var OCILanguageModel = class {
  constructor(modelId, config) {
    this.modelId = modelId;
    this.config = config;
    this.specificationVersion = "v3";
    this.provider = "oci-genai";
    this.defaultObjectGenerationMode = "tool";
    this.supportedUrls = {};
    if (!isValidModelId(modelId)) {
      throw new provider.NoSuchModelError({
        modelId,
        modelType: "languageModel"
      });
    }
  }
  async getClient(endpointOverride) {
    const resolvedEndpoint = resolveEndpoint(this.config.endpoint, endpointOverride);
    if (!this._client || endpointOverride && endpointOverride !== this.config.endpoint) {
      try {
        const authProvider = await createAuthProvider(this.config);
        const regionId = getRegion(this.config);
        const client = new ociGenerativeaiinference.GenerativeAiInferenceClient({
          authenticationDetailsProvider: authProvider
        });
        client.region = common2.Region.fromRegionId(regionId);
        if (resolvedEndpoint) {
          client.endpoint = resolvedEndpoint;
        }
        if (!endpointOverride || endpointOverride === this.config.endpoint) {
          this._client = client;
        }
        return client;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error during client initialization";
        throw new Error(
          `Failed to initialize OCI client: ${message}. Check your OCI configuration (config file, credentials, region).`
        );
      }
    }
    return this._client;
  }
  getRequestOptions(perRequestOptions) {
    return resolveRequestOptions(this.config.requestOptions, perRequestOptions);
  }
  getApiFormat() {
    const metadata = getModelMetadata(this.modelId);
    if (metadata?.family === "cohere") {
      if (metadata.capabilities?.vision) {
        return "COHEREV2";
      }
      return "COHERE";
    }
    return "GENERIC";
  }
  async executeWithResilience(operation, operationName, requestOptions) {
    const options = this.getRequestOptions(requestOptions);
    const withTimeoutOperation = () => withTimeout(operation(), options.timeoutMs, operationName);
    if (options.retry.enabled) {
      return withRetry(withTimeoutOperation, {
        maxRetries: options.retry.maxRetries,
        baseDelayMs: options.retry.baseDelayMs,
        maxDelayMs: options.retry.maxDelayMs,
        isRetryable: isRetryableError
      });
    }
    return withTimeoutOperation();
  }
  async doGenerate(options) {
    const { stream, response, request } = await this.doStream(options);
    const reader = stream.getReader();
    const warnings = [];
    const content = [];
    let usage = {
      inputTokens: {
        total: 0,
        noCache: void 0,
        cacheRead: void 0,
        cacheWrite: void 0
      },
      outputTokens: {
        total: 0,
        text: void 0,
        reasoning: void 0
      }
    };
    let finishReason = {
      unified: "other",
      raw: "initializing"
    };
    let providerMetadata;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        switch (value.type) {
          case "text-delta": {
            const last = content[content.length - 1];
            if (last?.type === "text") {
              last.text += value.delta;
            } else {
              content.push({ type: "text", text: value.delta });
            }
            break;
          }
          case "reasoning-delta": {
            const last = content[content.length - 1];
            if (last?.type === "reasoning") {
              last.text += value.delta;
            } else {
              content.push({ type: "reasoning", text: value.delta });
            }
            break;
          }
          case "tool-call":
            content.push({
              type: "tool-call",
              toolCallId: value.toolCallId,
              toolName: value.toolName,
              input: value.input
            });
            break;
          case "finish":
            finishReason = value.finishReason;
            usage = value.usage;
            providerMetadata = value.providerMetadata;
            break;
          case "error":
            throw value.error;
        }
      }
    } finally {
      reader.releaseLock();
    }
    return {
      content,
      usage,
      finishReason,
      request,
      response,
      warnings,
      providerMetadata
    };
  }
  async doStream(options) {
    const messages = convertToOCIMessages(options.prompt);
    const ociOptions = getOCIProviderOptions(options.providerOptions);
    const client = await this.getClient(ociOptions?.endpoint);
    const compartmentId = resolveCompartmentId(
      getCompartmentId(this.config),
      ociOptions?.compartmentId
    );
    const apiFormat = this.getApiFormat();
    const warnings = [];
    if (options.responseFormat?.type === "json") {
      warnings.push({
        type: "unsupported",
        feature: "responseFormat.json",
        details: "OCI response format JSON is not supported in this provider."
      });
    }
    const modelSupportsTools = supportsToolCalling(this.modelId);
    const modelSupportsReasoning = supportsReasoning(this.modelId);
    const hasTools = options.tools && options.tools.length > 0;
    const functionTools = hasTools ? options.tools.filter((t) => t.type === "function") : [];
    if (hasTools && !modelSupportsTools) {
      warnings.push({
        type: "unsupported",
        feature: "tools",
        details: `Model ${this.modelId} does not support tool calling. Supported: Llama 3.1+, Cohere Command R/R+, Grok, Gemini.`
      });
    }
    if (ociOptions?.reasoningEffort && !modelSupportsReasoning) {
      warnings.push({
        type: "unsupported",
        feature: "reasoningEffort",
        details: `Model ${this.modelId} does not support reasoning. Use a reasoning model like xai.grok-4-1-fast-reasoning or cohere.command-a-reasoning-08-2025.`
      });
    }
    if (ociOptions?.thinking && !modelSupportsReasoning) {
      warnings.push({
        type: "unsupported",
        feature: "thinking",
        details: `Model ${this.modelId} does not support thinking/reasoning. Use a reasoning model like cohere.command-a-reasoning-08-2025.`
      });
    }
    try {
      const commonParams = {
        maxTokens: options.maxOutputTokens ? Math.min(options.maxOutputTokens, 4e3) : void 0,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK ? Math.min(options.topK, 40) : void 0,
        isStream: true
      };
      const toolParams = modelSupportsTools && functionTools.length > 0 ? {
        tools: convertToOCITools(functionTools, apiFormat),
        ...options.toolChoice ? { toolChoice: convertToOCIToolChoice(options.toolChoice) } : {}
      } : {};
      let chatRequest;
      if (apiFormat === "COHEREV2") {
        chatRequest = {
          apiFormat,
          messages: messages.map((m) => {
            const content = m.content.map((c) => {
              if (c.type === "IMAGE") {
                return {
                  type: "IMAGE_URL",
                  imageUrl: c.imageUrl
                };
              }
              return { type: "TEXT", text: c.text ?? "" };
            });
            return {
              role: m.role,
              content
            };
          }),
          ...commonParams,
          ...toolParams
        };
      } else if (apiFormat === "COHERE") {
        const cohereFormat = convertToCohereFormat(messages);
        chatRequest = {
          apiFormat,
          ...cohereFormat,
          ...commonParams,
          ...toolParams,
          // Cohere requires isForceSingleStep=true when tool results are present
          // This ensures multi-step tool use works correctly
          ...cohereFormat.hasToolResults ? { isForceSingleStep: true } : {}
        };
      } else {
        chatRequest = {
          apiFormat,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            toolCalls: m.toolCalls,
            toolCallId: m.toolCallId
          })),
          ...commonParams,
          ...toolParams,
          stop: options.stopSequences
        };
      }
      if (ociOptions?.reasoningEffort && apiFormat === "GENERIC") {
        const genericReq = chatRequest;
        genericReq.reasoningEffort = toOCIReasoningEffort(ociOptions.reasoningEffort);
      }
      if (ociOptions?.thinking && (apiFormat === "COHEREV2" || apiFormat === "COHERE")) {
        const cohereReq = chatRequest;
        cohereReq.thinking = createThinkingConfig(true, ociOptions.tokenBudget);
      }
      if (options.seed !== void 0) chatRequest.seed = options.seed;
      const response = await this.executeWithResilience(
        () => client.chat({
          chatDetails: {
            compartmentId,
            servingMode: resolveServingMode(
              this.modelId,
              this.config.servingMode,
              ociOptions?.servingMode
            ),
            chatRequest
          }
        }),
        "OCI chat stream",
        ociOptions?.requestOptions
      );
      const streamInput = response.body ?? response;
      if (!streamInput) {
        throw new Error("No stream received from OCI.");
      }
      const stream = parseSSEStream(streamInput, {
        includeRawChunks: options.includeRawChunks
      });
      const headers = response.headers ? Object.fromEntries(response.headers.entries()) : void 0;
      return {
        stream: new ReadableStream({
          async start(controller) {
            controller.enqueue({ type: "stream-start", warnings });
            let hasText = false;
            let hasReasoning = false;
            const textId = `text-${Date.now()}`;
            const reasoningId = `reasoning-${Date.now()}`;
            try {
              for await (const part of stream) {
                switch (part.type) {
                  case "text-delta":
                    if (!hasText) {
                      controller.enqueue({ type: "text-start", id: textId });
                      hasText = true;
                    }
                    controller.enqueue({
                      type: "text-delta",
                      delta: part.textDelta,
                      id: textId
                    });
                    break;
                  case "reasoning-delta":
                    if (!hasReasoning) {
                      controller.enqueue({ type: "reasoning-start", id: reasoningId });
                      hasReasoning = true;
                    }
                    controller.enqueue({
                      type: "reasoning-delta",
                      delta: part.reasoningDelta,
                      id: reasoningId
                    });
                    break;
                  case "tool-call":
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: part.toolCallId,
                      toolName: part.toolName,
                      input: part.input
                    });
                    break;
                  case "finish":
                    if (hasText) {
                      controller.enqueue({ type: "text-end", id: textId });
                    }
                    if (hasReasoning) {
                      controller.enqueue({ type: "reasoning-end", id: reasoningId });
                    }
                    controller.enqueue({
                      type: "finish",
                      finishReason: part.finishReason,
                      usage: {
                        inputTokens: {
                          total: part.usage.promptTokens,
                          noCache: void 0,
                          cacheRead: void 0,
                          cacheWrite: void 0
                        },
                        outputTokens: {
                          total: part.usage.completionTokens,
                          text: part.usage.reasoningTokens !== void 0 ? part.usage.completionTokens - part.usage.reasoningTokens : part.usage.completionTokens,
                          reasoning: part.usage.reasoningTokens
                        }
                      },
                      providerMetadata: {
                        oci: { requestId: headers?.["opc-request-id"] }
                      }
                    });
                    break;
                  case "raw":
                    controller.enqueue({ type: "raw", rawValue: part.rawValue });
                    break;
                }
              }
            } catch (error) {
              controller.enqueue({ type: "error", error });
            } finally {
              controller.close();
            }
          }
        }),
        request: { body: JSON.stringify(messages) },
        response: {
          headers
        }
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }
};

// src/embedding-models/registry.ts
var EMBEDDING_MODELS = [
  {
    id: "cohere.embed-multilingual-v3.0",
    name: "Cohere Embed Multilingual v3.0",
    family: "cohere",
    dimensions: 1024,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512
  },
  {
    id: "cohere.embed-english-v3.0",
    name: "Cohere Embed English v3.0",
    family: "cohere",
    dimensions: 1024,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512
  },
  {
    id: "cohere.embed-english-light-v3.0",
    name: "Cohere Embed English Light v3.0",
    family: "cohere",
    dimensions: 384,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512
  }
];
function isValidEmbeddingModelId(modelId) {
  return EMBEDDING_MODELS.some((m) => m.id === modelId);
}
function getEmbeddingModelMetadata(modelId) {
  return EMBEDDING_MODELS.find((m) => m.id === modelId);
}
function getAllEmbeddingModels() {
  return EMBEDDING_MODELS;
}

// src/embedding-models/OCIEmbeddingModel.ts
var OCIEmbeddingModel = class {
  constructor(modelId, config) {
    this.modelId = modelId;
    this.config = config;
    this.specificationVersion = "v3";
    this.provider = "oci-genai";
    this.maxEmbeddingsPerCall = 96;
    this.supportsParallelCalls = true;
    if (!isValidEmbeddingModelId(modelId)) {
      throw new provider.NoSuchModelError({
        modelId,
        modelType: "embeddingModel"
      });
    }
  }
  async getClient(endpointOverride) {
    const resolvedEndpoint = resolveEndpoint(this.config.endpoint, endpointOverride);
    if (!this._client || endpointOverride && endpointOverride !== this.config.endpoint) {
      const authProvider = await createAuthProvider(this.config);
      const regionId = getRegion(this.config);
      const client = new ociGenerativeaiinference.GenerativeAiInferenceClient({
        authenticationDetailsProvider: authProvider
      });
      client.region = common2.Region.fromRegionId(regionId);
      if (resolvedEndpoint) {
        client.endpoint = resolvedEndpoint;
      }
      if (!endpointOverride || endpointOverride === this.config.endpoint) {
        this._client = client;
      }
      return client;
    }
    return this._client;
  }
  getRequestOptions(perRequestOptions) {
    return resolveRequestOptions(this.config.requestOptions, perRequestOptions);
  }
  async executeWithResilience(operation, operationName, requestOptions) {
    const options = this.getRequestOptions(requestOptions);
    const withTimeoutOperation = () => withTimeout(operation(), options.timeoutMs, operationName);
    if (options.retry.enabled) {
      return withRetry(withTimeoutOperation, {
        maxRetries: options.retry.maxRetries,
        baseDelayMs: options.retry.baseDelayMs,
        maxDelayMs: options.retry.maxDelayMs,
        isRetryable: isRetryableError
      });
    }
    return withTimeoutOperation();
  }
  async doEmbed(options) {
    const { values } = options;
    if (values.length > this.maxEmbeddingsPerCall) {
      throw new provider.TooManyEmbeddingValuesForCallError({
        provider: this.provider,
        modelId: this.modelId,
        maxEmbeddingsPerCall: this.maxEmbeddingsPerCall,
        values
      });
    }
    const ociOptions = getOCIProviderOptions(options.providerOptions);
    const client = await this.getClient(ociOptions?.endpoint);
    const compartmentId = resolveCompartmentId(
      getCompartmentId(this.config),
      ociOptions?.compartmentId
    );
    try {
      const response = await this.executeWithResilience(
        () => client.embedText({
          embedTextDetails: {
            servingMode: resolveServingMode(
              this.modelId,
              this.config.servingMode,
              ociOptions?.servingMode
            ),
            compartmentId,
            inputs: values,
            truncate: this.config.truncate ?? "END",
            inputType: this.config.inputType ?? "SEARCH_DOCUMENT"
          }
        }),
        "OCI embed request",
        ociOptions?.requestOptions
      );
      const embeddings = response.embedTextResult.embeddings;
      const usage = response.embedTextResult.usage;
      const tokenEstimate = values.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0);
      return {
        embeddings,
        usage: {
          tokens: usage?.promptTokens ?? usage?.totalTokens ?? tokenEstimate
        },
        providerMetadata: {
          oci: {
            requestId: response.opcRequestId,
            modelId: response.embedTextResult.modelId ?? this.modelId
          }
        },
        response: {
          headers: response.opcRequestId ? { "opc-request-id": response.opcRequestId } : void 0,
          body: response
        },
        warnings: []
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }
};

// src/speech-models/registry.ts
var TTS_2_NATURAL_LANGUAGES = [
  "en-US",
  "en-GB",
  "es-ES",
  "pt-BR",
  "hi-IN",
  "fr-FR",
  "it-IT",
  "ja-JP",
  "cmn-CN"
];
var TTS_1_STANDARD_LANGUAGES = ["en-US"];
var SPEECH_MODELS = [
  {
    id: "TTS_2_NATURAL",
    name: "OCI TTS Natural",
    family: "oci-speech",
    modelName: "TTS_2_NATURAL",
    supportedFormats: ["mp3", "ogg", "pcm"],
    maxTextLength: 5e3,
    supportedLanguages: [...TTS_2_NATURAL_LANGUAGES]
  },
  {
    id: "TTS_1_STANDARD",
    name: "OCI TTS Standard",
    family: "oci-speech",
    modelName: "TTS_1_STANDARD",
    supportedFormats: ["mp3", "ogg", "pcm"],
    maxTextLength: 5e3,
    supportedLanguages: [...TTS_1_STANDARD_LANGUAGES]
  }
];
function isValidSpeechModelId(modelId) {
  return SPEECH_MODELS.some((m) => m.id === modelId);
}
function getSpeechModelMetadata(modelId) {
  return SPEECH_MODELS.find((m) => m.id === modelId);
}
function getAllSpeechModels() {
  return SPEECH_MODELS;
}
var AVAILABLE_VOICES = [
  // TTS_2_NATURAL voices
  { id: "en-US-AriaNeural", name: "Aria (US English)", language: "en-US", model: "TTS_2_NATURAL" },
  { id: "en-US-GuyNeural", name: "Guy (US English)", language: "en-US", model: "TTS_2_NATURAL" },
  {
    id: "en-GB-LibbyNeural",
    name: "Libby (UK English)",
    language: "en-GB",
    model: "TTS_2_NATURAL"
  },
  { id: "en-GB-RyanNeural", name: "Ryan (UK English)", language: "en-GB", model: "TTS_2_NATURAL" },
  { id: "es-ES-AlvaroNeural", name: "Alvaro (Spanish)", language: "es-ES", model: "TTS_2_NATURAL" },
  {
    id: "pt-BR-FranciscaNeural",
    name: "Francisca (Portuguese BR)",
    language: "pt-BR",
    model: "TTS_2_NATURAL"
  },
  { id: "fr-FR-DeniseNeural", name: "Denise (French)", language: "fr-FR", model: "TTS_2_NATURAL" },
  {
    id: "it-IT-IsabellaNeural",
    name: "Isabella (Italian)",
    language: "it-IT",
    model: "TTS_2_NATURAL"
  },
  {
    id: "ja-JP-NanamiNeural",
    name: "Nanami (Japanese)",
    language: "ja-JP",
    model: "TTS_2_NATURAL"
  },
  {
    id: "cmn-CN-XiaoxuanNeural",
    name: "Xiaoxuan (Mandarin)",
    language: "cmn-CN",
    model: "TTS_2_NATURAL"
  },
  // TTS_1_STANDARD voices
  {
    id: "en-US-Standard-A",
    name: "Standard A (US English)",
    language: "en-US",
    model: "TTS_1_STANDARD"
  }
];
function getAllVoices() {
  return AVAILABLE_VOICES;
}

// src/speech-models/OCISpeechModel.ts
var OCISpeechModel = class {
  constructor(modelId, config) {
    this.modelId = modelId;
    this.specificationVersion = "v3";
    this.provider = "oci-genai";
    if (!isValidSpeechModelId(modelId)) {
      throw new provider.NoSuchModelError({
        modelId,
        modelType: "speechModel"
      });
    }
    const metadata = getSpeechModelMetadata(modelId);
    const defaultVoice = metadata?.defaultVoice;
    this.voice = config.voice ?? defaultVoice ?? "en-US-AriaNeural";
    this._config = config;
  }
  async getClient(endpointOverride) {
    const resolvedEndpoint = resolveEndpoint(this._config.endpoint, endpointOverride);
    if (!this._client || endpointOverride && endpointOverride !== this._config.endpoint) {
      const authProvider = await createAuthProvider(this._config);
      const region = getRegion(this._config);
      const client = new ociAispeech.AIServiceSpeechClient({
        authenticationDetailsProvider: authProvider
      });
      client.region = common2.Region.fromRegionId(region);
      if (resolvedEndpoint) {
        client.endpoint = resolvedEndpoint;
      }
      if (!endpointOverride || endpointOverride === this._config.endpoint) {
        this._client = client;
      }
      return client;
    }
    return this._client;
  }
  getVoice() {
    return this.voice;
  }
  async doGenerate(options) {
    const startTime = /* @__PURE__ */ new Date();
    const { text } = options;
    const warnings = [];
    if (options.instructions) {
      warnings.push({
        type: "unsupported",
        feature: "instructions",
        details: "OCI speech does not support instruction prompts."
      });
    }
    if (options.speed !== void 0) {
      warnings.push({
        type: "unsupported",
        feature: "speed",
        details: "OCI speech does not support speed adjustments."
      });
    }
    if (options.language) {
      warnings.push({
        type: "unsupported",
        feature: "language",
        details: "OCI speech does not support language override per request."
      });
    }
    const metadata = getSpeechModelMetadata(this.modelId);
    if (!metadata) throw new Error("Invalid model metadata");
    if (text.length > metadata.maxTextLength) {
      throw new Error(
        "Text length (" + text.length + ") exceeds maximum allowed (" + metadata.maxTextLength + ")"
      );
    }
    const ociOptions = getOCIProviderOptions(options.providerOptions);
    const client = await this.getClient(ociOptions?.endpoint);
    const compartmentId = resolveCompartmentId(
      getCompartmentId(this._config),
      ociOptions?.compartmentId
    );
    const voice = options.voice ?? this.voice;
    const outputFormat = this.mapOutputFormat(options.outputFormat ?? this._config.format);
    const synthesizeSpeechDetails = {
      text,
      isStreamEnabled: false,
      compartmentId,
      configuration: {
        modelFamily: "ORACLE",
        modelDetails: {
          modelName: metadata.modelName,
          voiceId: voice
        },
        speechSettings: {
          outputFormat
        }
      }
    };
    try {
      const response = await client.synthesizeSpeech({
        synthesizeSpeechDetails
      });
      const audioData = await this.streamToUint8Array(response.value);
      return {
        audio: audioData,
        warnings,
        request: {
          body: synthesizeSpeechDetails
        },
        response: {
          timestamp: startTime,
          modelId: this.modelId,
          headers: response.opcRequestId ? { "opc-request-id": response.opcRequestId } : {}
        },
        providerMetadata: {
          oci: {
            compartmentId,
            voice,
            format: (options.outputFormat ?? this._config.format) || "mp3",
            requestId: response.opcRequestId
          }
        }
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }
  /**
   * Map user-friendly format names to OCI OutputFormat enum
   */
  mapOutputFormat(format) {
    switch (format) {
      case "wav":
      case "pcm":
        return ociAispeech.models.TtsOracleSpeechSettings.OutputFormat.Pcm;
      case "ogg":
        return ociAispeech.models.TtsOracleSpeechSettings.OutputFormat.Ogg;
      case "mp3":
      default:
        return ociAispeech.models.TtsOracleSpeechSettings.OutputFormat.Mp3;
    }
  }
  /**
   * Convert a Web Streams API ReadableStream or Node.js stream to Uint8Array
   */
  async streamToUint8Array(stream) {
    if (stream && typeof stream.getReader === "function") {
      return this.webStreamToUint8Array(stream);
    }
    return this.nodeStreamToUint8Array(stream);
  }
  /**
   * Convert Web Streams API ReadableStream to Uint8Array
   */
  async webStreamToUint8Array(stream) {
    const reader = stream.getReader();
    const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } finally {
      reader.releaseLock();
    }
  }
  /**
   * Convert Node.js readable stream to Uint8Array
   */
  async nodeStreamToUint8Array(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => {
        chunks.push(chunk);
      });
      stream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(new Uint8Array(buffer));
      });
      stream.on("error", (error) => {
        reject(error);
      });
    });
  }
};

// src/reranking-models/registry.ts
var RERANKING_MODELS = [
  {
    id: "cohere.rerank-v3.5",
    name: "Cohere Rerank v3.5",
    family: "cohere",
    maxDocuments: 1e3,
    maxQueryLength: 2048,
    supportsMultilingual: true
  }
];
function isValidRerankingModelId(modelId) {
  return RERANKING_MODELS.some((m) => m.id === modelId);
}
function getRerankingModelMetadata(modelId) {
  return RERANKING_MODELS.find((m) => m.id === modelId);
}
function getAllRerankingModels() {
  return RERANKING_MODELS;
}

// src/reranking-models/OCIRerankingModel.ts
var OCIRerankingModel = class {
  constructor(modelId, config) {
    this.modelId = modelId;
    this.config = config;
    this.specificationVersion = "v3";
    this.provider = "oci-genai";
    if (!isValidRerankingModelId(modelId)) {
      throw new provider.NoSuchModelError({
        modelId,
        modelType: "rerankingModel"
      });
    }
  }
  async getClient(endpointOverride) {
    const resolvedEndpoint = resolveEndpoint(this.config.endpoint, endpointOverride);
    if (!this._client || endpointOverride && endpointOverride !== this.config.endpoint) {
      const authProvider = await createAuthProvider(this.config);
      const regionId = getRegion(this.config);
      const client = new ociGenerativeaiinference.GenerativeAiInferenceClient({
        authenticationDetailsProvider: authProvider
      });
      client.region = common2.Region.fromRegionId(regionId);
      if (resolvedEndpoint) {
        client.endpoint = resolvedEndpoint;
      }
      if (!endpointOverride || endpointOverride === this.config.endpoint) {
        this._client = client;
      }
      return client;
    }
    return this._client;
  }
  getRequestOptions(perRequestOptions) {
    return resolveRequestOptions(this.config.requestOptions, perRequestOptions);
  }
  async executeWithResilience(operation, operationName, requestOptions) {
    const options = this.getRequestOptions(requestOptions);
    const withTimeoutOperation = () => withTimeout(operation(), options.timeoutMs, operationName);
    if (options.retry.enabled) {
      return withRetry(withTimeoutOperation, {
        maxRetries: options.retry.maxRetries,
        baseDelayMs: options.retry.baseDelayMs,
        maxDelayMs: options.retry.maxDelayMs,
        isRetryable: isRetryableError
      });
    }
    return withTimeoutOperation();
  }
  async doRerank(options) {
    const { query, documents, topN } = options;
    if (documents.type !== "text") {
      throw new provider.InvalidArgumentError({
        argument: "documents",
        message: `OCI reranking only supports text documents, got: ${documents.type}`
      });
    }
    const documentTexts = documents.values;
    const metadata = getRerankingModelMetadata(this.modelId);
    if (metadata && documentTexts.length > metadata.maxDocuments) {
      throw new Error(
        `Document count (${documentTexts.length}) exceeds maximum allowed (${metadata.maxDocuments})`
      );
    }
    const ociOptions = getOCIProviderOptions(options.providerOptions);
    const client = await this.getClient(ociOptions?.endpoint);
    const compartmentId = resolveCompartmentId(
      getCompartmentId(this.config),
      ociOptions?.compartmentId
    );
    const warnings = [];
    try {
      const response = await this.executeWithResilience(
        () => client.rerankText({
          rerankTextDetails: {
            servingMode: resolveServingMode(
              this.modelId,
              this.config.servingMode,
              ociOptions?.servingMode
            ),
            compartmentId,
            input: query,
            documents: documentTexts,
            topN: topN ?? this.config.topN,
            isEcho: this.config.returnDocuments ?? false
          }
        }),
        "OCI rerank request",
        ociOptions?.requestOptions
      );
      const ranking = response.rerankTextResult.documentRanks.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rank) => ({
          index: rank.index ?? 0,
          relevanceScore: rank.relevanceScore ?? 0
        })
      );
      return {
        ranking,
        warnings,
        providerMetadata: {
          oci: {
            requestId: response.opcRequestId,
            modelId: response.rerankTextResult.modelId ?? this.modelId
          }
        },
        response: {
          id: response.rerankTextResult.id,
          modelId: response.rerankTextResult.modelId,
          headers: response.opcRequestId ? { "opc-request-id": response.opcRequestId } : void 0,
          body: response
        }
      };
    } catch (error) {
      throw handleOCIError(error);
    }
  }
};

// src/transcription-models/registry.ts
var TRANSCRIPTION_MODELS = [
  {
    id: "ORACLE",
    name: "OCI Speech Oracle",
    family: "oci-speech",
    modelType: "ORACLE",
    maxLanguages: 10,
    supportsCustomVocabulary: true,
    supportedFormats: ["wav", "mp3", "flac", "ogg"],
    maxFileSizeMB: 2048
  },
  {
    id: "WHISPER_MEDIUM",
    name: "OCI Speech Whisper Medium",
    family: "oci-speech",
    modelType: "WHISPER_MEDIUM",
    maxLanguages: 50,
    supportsCustomVocabulary: false,
    supportedFormats: ["wav", "mp3", "flac", "ogg", "m4a", "webm"],
    maxFileSizeMB: 2048
  },
  {
    id: "WHISPER_LARGE_V2",
    name: "OCI Speech Whisper Large V2",
    family: "oci-speech",
    modelType: "WHISPER_LARGE_V2",
    maxLanguages: 50,
    supportsCustomVocabulary: false,
    supportedFormats: ["wav", "mp3", "flac", "ogg", "m4a", "webm"],
    maxFileSizeMB: 2048
  }
];
var ORACLE_LANGUAGES = [
  "en-US",
  // English (US)
  "es-ES",
  // Spanish (Spain)
  "pt-BR",
  // Portuguese (Brazil)
  "en-GB",
  // English (UK)
  "en-AU",
  // English (Australia)
  "en-IN",
  // English (India)
  "hi-IN",
  // Hindi
  "fr-FR",
  // French
  "de-DE",
  // German
  "it-IT"
  // Italian
];
var WHISPER_LANGUAGES = [
  "en",
  // English
  "es",
  // Spanish
  "pt",
  // Portuguese
  "fr",
  // French
  "de",
  // German
  "it",
  // Italian
  "ja",
  // Japanese
  "ko",
  // Korean
  "zh",
  // Chinese
  "nl",
  // Dutch
  "pl",
  // Polish
  "ru",
  // Russian
  "tr",
  // Turkish
  "hi",
  // Hindi
  "ar"
  // Arabic
];
function isValidTranscriptionModelId(modelId) {
  return TRANSCRIPTION_MODELS.some((m) => m.id === modelId);
}
function getTranscriptionModelMetadata(modelId) {
  return TRANSCRIPTION_MODELS.find((m) => m.id === modelId);
}
function getAllTranscriptionModels() {
  return TRANSCRIPTION_MODELS;
}
function getSupportedLanguages() {
  return [...ORACLE_LANGUAGES, ...WHISPER_LANGUAGES];
}
async function uploadAudioToObjectStorage(config, bucketName, objectName, audioData, contentType) {
  const authProvider = await createAuthProvider(config);
  const region = getRegion(config);
  const client = new ociObjectstorage.ObjectStorageClient({
    authenticationDetailsProvider: authProvider
  });
  client.region = common2.Region.fromRegionId(region);
  const namespaceResponse = await client.getNamespace({});
  const namespaceName = namespaceResponse.value;
  await client.putObject({
    namespaceName,
    bucketName,
    objectName,
    putObjectBody: audioData,
    contentLength: audioData.byteLength,
    contentType: contentType ?? "audio/wav"
  });
  return { namespaceName, bucketName, objectName };
}
async function deleteFromObjectStorage(config, namespaceName, bucketName, objectName) {
  const authProvider = await createAuthProvider(config);
  const region = getRegion(config);
  const client = new ociObjectstorage.ObjectStorageClient({
    authenticationDetailsProvider: authProvider
  });
  client.region = common2.Region.fromRegionId(region);
  await client.deleteObject({
    namespaceName,
    bucketName,
    objectName
  });
}
function generateAudioObjectName() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `audio-${timestamp}-${random}.wav`;
}
function groupTokensIntoSegments(tokens) {
  if (!tokens || tokens.length === 0) {
    return [];
  }
  const segments = [];
  let currentSegment = [tokens[0]];
  for (let i = 1; i < tokens.length; i++) {
    const prevToken = tokens[i - 1];
    const currentToken = tokens[i];
    const gap = currentToken.startTime - prevToken.endTime;
    if (gap > 1) {
      segments.push({
        text: currentSegment.map((t) => t.token).join(" "),
        startSecond: currentSegment[0].startTime,
        endSecond: currentSegment[currentSegment.length - 1].endTime
      });
      currentSegment = [currentToken];
    } else {
      currentSegment.push(currentToken);
    }
  }
  if (currentSegment.length > 0) {
    segments.push({
      text: currentSegment.map((t) => t.token).join(" "),
      startSecond: currentSegment[0].startTime,
      endSecond: currentSegment[currentSegment.length - 1].endTime
    });
  }
  return segments;
}
async function downloadTranscriptionResult(config, namespaceName, bucketName, objectName) {
  const authProvider = await createAuthProvider(config);
  const region = getRegion(config);
  const client = new ociObjectstorage.ObjectStorageClient({
    authenticationDetailsProvider: authProvider
  });
  client.region = common2.Region.fromRegionId(region);
  try {
    const response = await client.getObject({
      namespaceName,
      bucketName,
      objectName
    });
    const responseStream = response.value;
    const chunks = [];
    await new Promise((resolve, reject) => {
      responseStream.on("data", (chunk) => {
        chunks.push(chunk);
      });
      responseStream.on("end", () => {
        resolve();
      });
      responseStream.on("error", (error) => {
        reject(new Error(`Stream read error: ${error.message}`));
      });
    });
    const jsonString = Buffer.concat(chunks).toString("utf-8");
    let speechResult;
    try {
      speechResult = JSON.parse(jsonString);
    } catch (parseError) {
      throw new Error(
        `Failed to parse transcription JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }
    const transcription = speechResult.transcription;
    if (!transcription) {
      throw new Error("Missing transcription field in JSON response");
    }
    const text = transcription.transcript || "";
    const tokens = [];
    if (transcription.tokens && Array.isArray(transcription.tokens)) {
      for (const token of transcription.tokens) {
        if (token.token && typeof token.startTime === "number" && typeof token.endTime === "number") {
          tokens.push({
            token: token.token,
            startTime: token.startTime,
            endTime: token.endTime,
            confidence: token.confidence
          });
        }
      }
    }
    const segments = groupTokensIntoSegments(tokens);
    const confidence = transcription.confidence;
    const languageCode = transcription.languageCode;
    return {
      text,
      segments,
      confidence,
      languageCode
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing transcription field")) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("Failed to parse")) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("Stream read error")) {
      throw error;
    }
    throw new Error(
      `Failed to download transcription result: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// src/transcription-models/OCITranscriptionModel.ts
var OCITranscriptionModel = class {
  constructor(modelId, config) {
    this.modelId = modelId;
    this.config = config;
    this.specificationVersion = "v3";
    this.provider = "oci-genai";
    if (isValidTranscriptionModelId(modelId) === false) {
      throw new provider.NoSuchModelError({
        modelId,
        modelType: "transcriptionModel"
      });
    }
  }
  async getClient(endpointOverride) {
    const resolvedEndpoint = resolveEndpoint(this.config.endpoint, endpointOverride);
    if (!this._client || endpointOverride && endpointOverride !== this.config.endpoint) {
      const authProvider = await createAuthProvider(this.config);
      const region = getRegion(this.config);
      const client = new ociAispeech.AIServiceSpeechClient({
        authenticationDetailsProvider: authProvider
      });
      client.region = common2.Region.fromRegionId(region);
      if (resolvedEndpoint) {
        client.endpoint = resolvedEndpoint;
      }
      if (!endpointOverride || endpointOverride === this.config.endpoint) {
        this._client = client;
      }
      return client;
    }
    return this._client;
  }
  async doGenerate(options) {
    return this.doTranscribe(options);
  }
  async doTranscribe(options) {
    const startTime = /* @__PURE__ */ new Date();
    const warnings = [];
    let audioData;
    if (typeof options.audio === "string") {
      audioData = new Uint8Array(Buffer.from(options.audio, "base64"));
    } else {
      audioData = options.audio;
    }
    const maxSizeBytes = 2 * 1024 * 1024 * 1024;
    if (audioData.byteLength > maxSizeBytes) {
      throw new Error(
        `Audio file size (${(audioData.byteLength / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed (2048MB)`
      );
    }
    const ociOptions = getOCIProviderOptions(options.providerOptions);
    const client = await this.getClient(ociOptions?.endpoint);
    const compartmentId = resolveCompartmentId(
      getCompartmentId(this.config),
      ociOptions?.compartmentId
    );
    const metadata = getTranscriptionModelMetadata(this.modelId);
    if (metadata?.modelType !== "ORACLE" && this.config.vocabulary && this.config.vocabulary.length > 0) {
      warnings.push({
        type: "other",
        message: "Custom vocabulary is not supported by Whisper model. It will be ignored."
      });
    }
    const bucketName = this.config.transcriptionBucket || "oci-speech-transcription";
    const objectName = generateAudioObjectName();
    let uploadedLocation;
    try {
      uploadedLocation = await uploadAudioToObjectStorage(
        this.config,
        bucketName,
        objectName,
        audioData,
        options.mediaType
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to upload audio to Object Storage: ${message}`);
    }
    try {
      const languageCode = this.mapLanguageCode(this.config.language);
      const createJobRequest = {
        createTranscriptionJobDetails: {
          compartmentId,
          displayName: `Transcription-${Date.now()}`,
          modelDetails: {
            modelType: metadata?.modelType || "ORACLE",
            languageCode
          },
          inputLocation: {
            locationType: "OBJECT_LIST_INLINE_INPUT_LOCATION",
            objectLocations: [
              {
                namespaceName: uploadedLocation.namespaceName,
                bucketName: uploadedLocation.bucketName,
                objectNames: [uploadedLocation.objectName]
              }
            ]
          },
          outputLocation: {
            namespaceName: uploadedLocation.namespaceName,
            bucketName,
            prefix: `results-${Date.now()}`
          }
        }
      };
      const jobResponse = await client.createTranscriptionJob(createJobRequest);
      const jobId = jobResponse.transcriptionJob.id;
      const { text, taskId, segments } = await this.pollForCompletion(
        client,
        jobId,
        bucketName,
        uploadedLocation.namespaceName,
        `results-${Date.now()}`
      );
      return {
        text,
        segments,
        language: this.config.language || void 0,
        durationInSeconds: void 0,
        warnings,
        request: {
          body: JSON.stringify({ audioSize: audioData.byteLength, mediaType: options.mediaType })
        },
        response: {
          timestamp: startTime,
          modelId: this.modelId,
          headers: jobResponse.opcRequestId ? { "opc-request-id": jobResponse.opcRequestId } : {}
        },
        providerMetadata: {
          oci: {
            compartmentId,
            modelType: metadata?.modelType || "ORACLE",
            jobId,
            taskId,
            requestId: jobResponse.opcRequestId
          }
        }
      };
    } catch (error) {
      throw handleOCIError(error);
    } finally {
      try {
        await deleteFromObjectStorage(
          this.config,
          uploadedLocation.namespaceName,
          uploadedLocation.bucketName,
          uploadedLocation.objectName
        );
      } catch {
      }
    }
  }
  /**
   * Map language string to OCI LanguageCode enum
   */
  mapLanguageCode(language) {
    if (!language) return ociAispeech.models.TranscriptionModelDetails.LanguageCode.EnUs;
    const mapping = {
      "en-US": ociAispeech.models.TranscriptionModelDetails.LanguageCode.EnUs,
      "es-ES": ociAispeech.models.TranscriptionModelDetails.LanguageCode.EsEs,
      "pt-BR": ociAispeech.models.TranscriptionModelDetails.LanguageCode.PtBr,
      "en-GB": ociAispeech.models.TranscriptionModelDetails.LanguageCode.EnGb,
      "en-AU": ociAispeech.models.TranscriptionModelDetails.LanguageCode.EnAu,
      "en-IN": ociAispeech.models.TranscriptionModelDetails.LanguageCode.EnIn,
      "hi-IN": ociAispeech.models.TranscriptionModelDetails.LanguageCode.HiIn,
      "fr-FR": ociAispeech.models.TranscriptionModelDetails.LanguageCode.FrFr,
      "de-DE": ociAispeech.models.TranscriptionModelDetails.LanguageCode.DeDe,
      "it-IT": ociAispeech.models.TranscriptionModelDetails.LanguageCode.ItIt,
      en: ociAispeech.models.TranscriptionModelDetails.LanguageCode.En,
      es: ociAispeech.models.TranscriptionModelDetails.LanguageCode.Es,
      fr: ociAispeech.models.TranscriptionModelDetails.LanguageCode.Fr,
      de: ociAispeech.models.TranscriptionModelDetails.LanguageCode.De,
      it: ociAispeech.models.TranscriptionModelDetails.LanguageCode.It,
      auto: ociAispeech.models.TranscriptionModelDetails.LanguageCode.Auto
    };
    return mapping[language] || ociAispeech.models.TranscriptionModelDetails.LanguageCode.EnUs;
  }
  async pollForCompletion(client, jobId, outputBucket, outputNamespace, outputPrefix) {
    const maxAttempts = 60;
    const pollIntervalMs = 5e3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const jobResponse = await client.getTranscriptionJob({
        transcriptionJobId: jobId
      });
      const state = jobResponse.transcriptionJob.lifecycleState;
      if (state === ociAispeech.models.TranscriptionJob.LifecycleState.Succeeded) {
        const tasksResponse = await client.listTranscriptionTasks({
          transcriptionJobId: jobId
        });
        const firstTask = tasksResponse.transcriptionTaskCollection?.items?.[0];
        if (!firstTask) {
          throw new Error("No transcription tasks found in job");
        }
        let taskDetails;
        try {
          const taskResponse = await client.getTranscriptionTask({
            transcriptionJobId: jobId,
            transcriptionTaskId: firstTask.id
          });
          taskDetails = taskResponse.transcriptionTask;
        } catch (error) {
          throw new Error(
            `Failed to get transcription task details: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
        let outputFileName;
        const taskOutputLocation = taskDetails.outputLocation;
        if (taskOutputLocation) {
          outputFileName = taskOutputLocation;
        } else {
          const inputObjectNames = taskDetails.inputLocation?.objectNames || [];
          const inputName = inputObjectNames[0] || `task-${firstTask.id}`;
          const baseName = inputName.replace(/\.[^.]*$/, "");
          outputFileName = `${outputPrefix}/${baseName}.json`;
        }
        let result;
        try {
          result = await downloadTranscriptionResult(
            this.config,
            outputNamespace,
            outputBucket,
            outputFileName
          );
        } catch (error) {
          throw new Error(
            `Failed to download transcription result: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
        return {
          text: result.text,
          taskId: firstTask.id,
          segments: result.segments
        };
      }
      if (state === ociAispeech.models.TranscriptionJob.LifecycleState.Failed) {
        throw new Error(
          `Transcription job failed: ${jobResponse.transcriptionJob.lifecycleDetails || "Unknown error"}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new Error("Transcription job timed out after 5 minutes");
  }
};

// src/realtime/WebSocketAdapter.ts
var WebSocketReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};
function isNodeWithoutNativeWS() {
  return typeof process !== "undefined" && process.versions?.node !== void 0 && typeof globalThis.WebSocket === "undefined";
}
var WebSocketAdapter = class {
  /**
   * Create a new WebSocket connection.
   *
   * @param url - Secure WebSocket URL (wss://)
   * @param options - Connection options
   * @throws Error if WebSocket is not available in the environment
   */
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
    this.listeners = /* @__PURE__ */ new Map();
    this.connectionTimeout = null;
    this._readyState = WebSocketReadyState.CONNECTING;
    this.connect();
  }
  /**
   * Get the current connection state.
   */
  get readyState() {
    return this.ws?.readyState ?? this._readyState;
  }
  /**
   * Check if the connection is open and ready to send data.
   */
  get isOpen() {
    return this.readyState === WebSocketReadyState.OPEN;
  }
  /**
   * Check if the connection is in the process of connecting.
   */
  get isConnecting() {
    return this.readyState === WebSocketReadyState.CONNECTING;
  }
  /**
   * Check if the connection is closed or closing.
   */
  get isClosed() {
    return this.readyState === WebSocketReadyState.CLOSED || this.readyState === WebSocketReadyState.CLOSING;
  }
  /**
   * Register an event listener.
   *
   * @param event - Event name ('open', 'message', 'close', 'error')
   * @param callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Remove an event listener.
   *
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }
  /**
   * Send data through the WebSocket.
   *
   * @param data - String, ArrayBuffer, or Uint8Array to send
   * @throws Error if connection is not open
   */
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocketReadyState.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    if (data instanceof Uint8Array) {
      this.ws.send(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    } else {
      this.ws.send(data);
    }
  }
  /**
   * Close the WebSocket connection.
   *
   * @param code - Status code (default: 1000 = normal closure)
   * @param reason - Human-readable reason for closing
   */
  close(code = 1e3, reason = "Normal closure") {
    this.clearConnectionTimeout();
    if (this.ws) {
      this._readyState = WebSocketReadyState.CLOSING;
      try {
        this.ws.close(code, reason);
      } catch {
      }
      this.ws = null;
    }
    this._readyState = WebSocketReadyState.CLOSED;
  }
  /**
   * Establish the WebSocket connection.
   */
  async connect() {
    this._readyState = WebSocketReadyState.CONNECTING;
    const timeoutMs = this.options.connectionTimeoutMs ?? 3e4;
    this.connectionTimeout = setTimeout(() => {
      this.emit("error", new Error(`Connection timeout after ${timeoutMs}ms`));
      this.close(1006, "Connection timeout");
    }, timeoutMs);
    try {
      this.ws = await this.createWebSocket();
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen = () => {
        this.clearConnectionTimeout();
        this._readyState = WebSocketReadyState.OPEN;
        this.emit("open");
      };
      this.ws.onmessage = (event) => {
        this.emit("message", event.data);
      };
      this.ws.onclose = (event) => {
        this.clearConnectionTimeout();
        this._readyState = WebSocketReadyState.CLOSED;
        this.emit("close", event.code, event.reason || "");
      };
      this.ws.onerror = (_event) => {
        this.emit("error", new Error("WebSocket error"));
      };
    } catch (error) {
      this.clearConnectionTimeout();
      this._readyState = WebSocketReadyState.CLOSED;
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
    }
  }
  /**
   * Create the appropriate WebSocket instance for the current environment.
   */
  async createWebSocket() {
    if (typeof globalThis.WebSocket !== "undefined") {
      return new globalThis.WebSocket(this.url);
    }
    if (isNodeWithoutNativeWS()) {
      try {
        const { default: WS } = await Promise.resolve().then(() => (init_wrapper(), wrapper_exports));
        return new WS(this.url, {
          headers: this.options.headers
        });
      } catch {
        throw new Error(
          'WebSocket not available. Please use Node.js 18+ or install the "ws" package.'
        );
      }
    }
    throw new Error("WebSocket not available in this environment");
  }
  /**
   * Emit an event to all registered listeners.
   */
  emit(event, ...args) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          console.error("Error in WebSocket handler:", event, error);
        }
      }
    }
  }
  /**
   * Clear the connection timeout timer.
   */
  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
};

// src/realtime/types.ts
var RealtimeError = class extends Error {
  constructor(message, code, cause) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = "RealtimeError";
  }
};

// src/realtime/OCIRealtimeClient.ts
var REALTIME_ENDPOINTS = {
  "us-phoenix-1": "wss://realtime.aiservice.us-phoenix-1.oci.oraclecloud.com",
  "us-ashburn-1": "wss://realtime.aiservice.us-ashburn-1.oci.oraclecloud.com",
  "eu-frankfurt-1": "wss://realtime.aiservice.eu-frankfurt-1.oci.oraclecloud.com",
  "uk-london-1": "wss://realtime.aiservice.uk-london-1.oci.oraclecloud.com",
  "ap-tokyo-1": "wss://realtime.aiservice.ap-tokyo-1.oci.oraclecloud.com",
  "ap-osaka-1": "wss://realtime.aiservice.ap-osaka-1.oci.oraclecloud.com",
  "ap-sydney-1": "wss://realtime.aiservice.ap-sydney-1.oci.oraclecloud.com",
  "ap-mumbai-1": "wss://realtime.aiservice.ap-mumbai-1.oci.oraclecloud.com",
  "ca-toronto-1": "wss://realtime.aiservice.ca-toronto-1.oci.oraclecloud.com",
  "sa-saopaulo-1": "wss://realtime.aiservice.sa-saopaulo-1.oci.oraclecloud.com"
};
function getRealtimeEndpoint(region) {
  const endpoint = REALTIME_ENDPOINTS[region];
  if (!endpoint) {
    return `wss://realtime.aiservice.${region}.oci.oraclecloud.com`;
  }
  return endpoint;
}
var OCIRealtimeClient = class {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.speechClient = null;
    this.sessionToken = null;
    this.sessionId = null;
    this.listeners = /* @__PURE__ */ new Map();
    this._state = "disconnected";
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
  }
  /**
   * Get the current connection state.
   */
  get state() {
    return this._state;
  }
  /**
   * Get the current session ID (available after authentication).
   */
  get currentSessionId() {
    return this.sessionId;
  }
  /**
   * Check if the client is connected and authenticated.
   */
  get isConnected() {
    return this._state === "connected" && this.ws?.isOpen === true;
  }
  /**
   * Register an event listener.
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Remove an event listener.
   */
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }
  /**
   * Connect to the OCI realtime speech service.
   *
   * @param settings - Realtime transcription settings
   * @throws RealtimeError if connection fails
   */
  async connect(settings = {}) {
    if (this._state === "connected" || this._state === "connecting") {
      throw new Error("Already connected or connecting");
    }
    this.setState("connecting");
    try {
      if (!this.speechClient) {
        this.speechClient = await this.createSpeechClient();
      }
      const compartmentId = settings.compartmentId ?? this.config.compartmentId;
      if (!compartmentId) {
        throw new Error("compartmentId is required for realtime transcription");
      }
      this.sessionToken = await this.createSessionToken(compartmentId);
      const region = settings.region ?? this.config.region ?? "us-phoenix-1";
      const wsEndpoint = getRealtimeEndpoint(region);
      this.ws = new WebSocketAdapter(wsEndpoint, {
        connectionTimeoutMs: settings.connectionTimeoutMs ?? 3e4
      });
      this.setupWebSocketHandlers(settings);
      await this.waitForOpen();
      this.setState("authenticating");
      this.sendAuthMessage(settings);
      await this.waitForAuthentication();
      this.reconnectAttempts = 0;
    } catch (error) {
      this.setState("error");
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit("error", err);
      throw err;
    }
  }
  /**
   * Send audio data to the service.
   *
   * @param audio - Audio data as Uint8Array or ArrayBuffer
   * @throws Error if not connected
   */
  sendAudio(audio) {
    if (!this.isConnected || !this.ws) {
      throw new Error("Not connected to realtime service");
    }
    this.ws.send(audio);
  }
  /**
   * Request final results and close the session gracefully.
   */
  async requestFinalResult() {
    if (!this.isConnected || !this.ws) {
      return;
    }
    const message = JSON.stringify({
      event: "SEND_FINAL_RESULT"
    });
    this.ws.send(message);
  }
  /**
   * Close the WebSocket connection.
   *
   * @param code - Close code (default: 1000)
   * @param reason - Close reason
   */
  async close(code = 1e3, reason = "Normal closure") {
    this.clearReconnectTimer();
    if (this.ws) {
      try {
        await this.requestFinalResult();
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch {
      }
      this.ws.close(code, reason);
      this.ws = null;
    }
    this.sessionToken = null;
    this.sessionId = null;
    this.setState("closed");
  }
  /**
   * Create the OCI Speech client with proper authentication.
   */
  async createSpeechClient() {
    const authMethod = this.config.auth ?? "config_file";
    let authProvider;
    switch (authMethod) {
      case "instance_principal":
        authProvider = await new common2__namespace.InstancePrincipalsAuthenticationDetailsProviderBuilder().build();
        break;
      case "resource_principal":
        authProvider = await common2__namespace.ResourcePrincipalAuthenticationDetailsProvider.builder();
        break;
      case "config_file":
      default: {
        const configPath = this.config.configPath ?? common2__namespace.ConfigFileReader.DEFAULT_FILE_PATH;
        const profile = this.config.profile ?? "DEFAULT";
        authProvider = new common2__namespace.ConfigFileAuthenticationDetailsProvider(configPath, profile);
        break;
      }
    }
    const client = new ociAispeech.AIServiceSpeechClient({ authenticationDetailsProvider: authProvider });
    const region = this.config.region ?? "us-phoenix-1";
    client.regionId = region;
    return client;
  }
  /**
   * Create a session token for WebSocket authentication.
   */
  async createSessionToken(compartmentId) {
    if (!this.speechClient) {
      throw new Error("Speech client not initialized");
    }
    const response = await this.speechClient.createRealtimeSessionToken({
      createRealtimeSessionTokenDetails: {
        compartmentId
      }
    });
    return response.realtimeSessionToken.token;
  }
  /**
   * Set up WebSocket event handlers.
   */
  setupWebSocketHandlers(settings) {
    if (!this.ws) return;
    this.ws.on("message", (data) => {
      this.handleMessage(data);
    });
    this.ws.on("close", (code, reason) => {
      this.handleClose(code, reason, settings);
    });
    this.ws.on("error", (error) => {
      this.emit("error", error);
    });
  }
  /**
   * Wait for the WebSocket to open.
   */
  waitForOpen() {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error("WebSocket not created"));
        return;
      }
      if (this.ws.isOpen) {
        resolve();
        return;
      }
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      const onClose = (_code, reason) => {
        cleanup();
        reject(new Error("Connection closed: " + (reason || "Unknown reason")));
      };
      const cleanup = () => {
        this.ws?.off("open", onOpen);
        this.ws?.off("error", onError);
        this.ws?.off("close", onClose);
      };
      this.ws.on("open", onOpen);
      this.ws.on("error", onError);
      this.ws.on("close", onClose);
    });
  }
  /**
   * Wait for authentication to complete.
   */
  waitForAuthentication() {
    return new Promise((resolve, reject) => {
      const timeoutMs = 1e4;
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error("Authentication timeout"));
        }
      }, timeoutMs);
      const onAuthenticated = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      };
      const onError = (error) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(error);
        }
      };
      const cleanup = () => {
        clearTimeout(timeout);
        this.off("authenticated", onAuthenticated);
        this.off("error", onError);
      };
      this.on("authenticated", onAuthenticated);
      this.on("error", onError);
    });
  }
  /**
   * Send the authentication message to the server.
   */
  sendAuthMessage(settings) {
    if (!this.ws || !this.sessionToken) {
      throw new Error("WebSocket or session token not available");
    }
    const authMessage = {
      event: "AUTHENTICATE",
      authenticationType: "TOKEN",
      token: this.sessionToken,
      realtimeModelDetails: {
        domain: settings.modelDomain ?? "GENERIC",
        languageCode: settings.language ?? "en-US"
      },
      customizations: settings.customizations,
      parameters: {
        encoding: settings.encoding ?? "audio/raw;rate=16000",
        isAckEnabled: settings.ackEnabled ?? false,
        partialSilenceThresholdInMs: settings.partialSilenceThresholdMs,
        finalSilenceThresholdInMs: settings.finalSilenceThresholdMs,
        stabilizePartialResults: settings.partialResultStability ?? "MEDIUM",
        modelType: settings.model ?? "ORACLE",
        modelDomain: settings.modelDomain ?? "GENERIC",
        languageCode: settings.language ?? "en-US",
        punctuation: settings.punctuation ?? "AUTO"
      }
    };
    this.ws.send(JSON.stringify(authMessage));
  }
  /**
   * Handle incoming WebSocket messages.
   */
  handleMessage(data) {
    if (typeof data !== "string") {
      return;
    }
    try {
      const message = JSON.parse(data);
      switch (message.event) {
        case "CONNECT":
          this.handleConnectMessage(message);
          break;
        case "RESULT":
          this.emit("message", message);
          break;
        case "ACKAUDIO":
          this.emit("message", message);
          break;
        case "ERROR":
          this.handleErrorMessage(message);
          break;
        default:
          this.emit("message", message);
      }
    } catch {
    }
  }
  /**
   * Handle connection acknowledgment message.
   */
  handleConnectMessage(message) {
    this.sessionId = message.sessionId;
    this.setState("connected");
    this.emit("authenticated", message.sessionId);
    this.emit("message", message);
  }
  /**
   * Handle error message from server.
   */
  handleErrorMessage(message) {
    const error = new RealtimeError(message.message, message.code);
    this.emit("error", error);
    this.emit("message", message);
  }
  /**
   * Handle WebSocket close event.
   */
  handleClose(code, reason, settings) {
    this.emit("closed", code, reason);
    const autoReconnect = settings.autoReconnect ?? true;
    const maxAttempts = settings.maxReconnectAttempts ?? 3;
    const wasConnected = this._state === "connected";
    if (autoReconnect && wasConnected && code !== 1e3 && this.reconnectAttempts < maxAttempts) {
      this.attemptReconnect(settings);
    } else {
      this.setState("disconnected");
    }
  }
  /**
   * Attempt to reconnect with exponential backoff.
   */
  attemptReconnect(settings) {
    this.reconnectAttempts++;
    this.setState("reconnecting");
    const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts - 1), 3e4);
    this.reconnectTimer = setTimeout(async () => {
      try {
        this.ws = null;
        this.sessionToken = null;
        await this.connect(settings);
      } catch {
      }
    }, delay);
  }
  /**
   * Clear the reconnection timer.
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  /**
   * Set connection state and emit event.
   */
  setState(state) {
    if (this._state !== state) {
      this._state = state;
      this.emit("stateChange", state);
    }
  }
  /**
   * Emit an event to all registered listeners.
   */
  emit(event, ...args) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          console.error("Error in realtime client handler:", event, error);
        }
      }
    }
  }
};

// src/realtime/OCIRealtimeTranscription.ts
function createRealtimeError(message, code, cause) {
  return new RealtimeError(message, code, cause);
}
function normalizeTranscriptionResult(ociResult, sessionId, sequenceNumber) {
  return {
    text: ociResult.transcription,
    isFinal: ociResult.isFinal,
    confidence: ociResult.confidence,
    startTimeMs: ociResult.startTimeInMs,
    endTimeMs: ociResult.endTimeInMs,
    trailingSilenceMs: ociResult.trailingSilence,
    tokens: ociResult.tokens.map(
      (t) => ({
        token: t.token,
        startTimeMs: t.startTimeInMs,
        endTimeMs: t.endTimeInMs,
        confidence: t.confidence,
        type: t.type
      })
    ),
    sessionId,
    sequenceNumber
  };
}
var OCIRealtimeTranscription = class {
  /**
   * Create a new realtime transcription session.
   *
   * @param config - Base OCI configuration
   * @param settings - Realtime-specific settings (merged with config)
   */
  constructor(config, settings = {}) {
    this.listeners = /* @__PURE__ */ new Map();
    this.resultQueue = [];
    this.resultResolvers = [];
    this.iteratorDone = false;
    this.resultSequence = 0;
    this.audioDurationMs = 0;
    this.resultCount = 0;
    this.connectedAt = null;
    this.settings = { ...config, ...settings };
    this.client = new OCIRealtimeClient(config);
    this.setupClientHandlers();
  }
  /**
   * Get the current connection state.
   */
  get state() {
    return this.client.state;
  }
  /**
   * Check if the session is connected and ready.
   */
  get isConnected() {
    return this.client.isConnected;
  }
  /**
   * Get session information.
   */
  get sessionInfo() {
    return {
      sessionId: this.client.currentSessionId ?? "",
      compartmentId: this.settings.compartmentId ?? "",
      state: this.state,
      connectedAt: this.connectedAt ?? void 0,
      audioDurationMs: this.audioDurationMs,
      resultCount: this.resultCount
    };
  }
  /**
   * Register an event listener.
   *
   * @param event - Event name
   * @param callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
    return this;
  }
  /**
   * Remove an event listener.
   *
   * @param event - Event name
   * @param callback - Callback function
   */
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
    return this;
  }
  /**
   * Connect to the realtime transcription service.
   *
   * @param settings - Optional settings to override the constructor settings
   */
  async connect(settings) {
    const mergedSettings = { ...this.settings, ...settings };
    this.settings = mergedSettings;
    try {
      await this.client.connect(mergedSettings);
      this.connectedAt = /* @__PURE__ */ new Date();
      this.emit("connected", this.client.currentSessionId ?? "");
    } catch (error) {
      const realtimeError = createRealtimeError(
        "Failed to connect to realtime service",
        "CONNECTION_FAILED",
        error instanceof Error ? error : void 0
      );
      this.emit("error", realtimeError);
      throw realtimeError;
    }
  }
  /**
   * Send audio data to the transcription service.
   *
   * @param audio - Audio data as Uint8Array, ArrayBuffer, or Buffer
   * @param durationMs - Optional duration in milliseconds for tracking
   */
  sendAudio(audio, durationMs) {
    if (!this.isConnected) {
      throw createRealtimeError("Not connected to realtime service", "CONNECTION_FAILED");
    }
    this.client.sendAudio(audio);
    if (durationMs !== void 0) {
      this.audioDurationMs += durationMs;
    } else {
      const byteLength = audio instanceof ArrayBuffer ? audio.byteLength : audio.byteLength;
      this.audioDurationMs += byteLength / 32e3 * 1e3;
    }
  }
  /**
   * Request final transcription results.
   * Call this when you've finished sending audio.
   */
  async requestFinalResult() {
    await this.client.requestFinalResult();
  }
  /**
   * Close the transcription session.
   *
   * @param waitForFinal - Wait for final results before closing (default: true)
   */
  async close(waitForFinal = true) {
    if (waitForFinal && this.isConnected) {
      await this.requestFinalResult();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    await this.client.close();
    this.markIteratorDone();
    this.emit("disconnected", "Session closed");
  }
  /**
   * Transcribe an audio stream using the async iterator pattern.
   *
   * This method handles connecting, streaming audio, and closing.
   *
   * @param audioSource - Async iterable of audio chunks
   * @param settings - Optional settings override
   * @yields Transcription results as they arrive
   *
   * @example
   * ```typescript
   * async function* getAudioChunks() {
   *   // Yield audio chunks from microphone, file, etc.
   *   yield new Uint8Array([...]);
   * }
   *
   * for await (const result of session.transcribe(getAudioChunks())) {
   *   console.log(result.text);
   * }
   * ```
   */
  async *transcribe(audioSource, settings) {
    if (!this.isConnected) {
      await this.connect(settings);
    }
    const audioPromise = this.consumeAudioSource(audioSource);
    try {
      for await (const result of this) {
        yield result;
      }
    } finally {
      await audioPromise;
    }
  }
  /**
   * Implement AsyncIterable for for-await-of support.
   */
  [Symbol.asyncIterator]() {
    return {
      next: () => this.nextResult()
    };
  }
  /**
   * Get the next transcription result.
   * Used internally by the async iterator.
   */
  nextResult() {
    if (this.resultQueue.length > 0) {
      const result = this.resultQueue.shift();
      return Promise.resolve({ value: result, done: false });
    }
    if (this.iteratorDone) {
      return Promise.resolve({ value: void 0, done: true });
    }
    return new Promise((resolve) => {
      this.resultResolvers.push(resolve);
    });
  }
  /**
   * Add a result to the queue or resolve a waiting promise.
   */
  enqueueResult(result) {
    if (this.resultResolvers.length > 0) {
      const resolve = this.resultResolvers.shift();
      resolve({ value: result, done: false });
    } else {
      this.resultQueue.push(result);
    }
  }
  /**
   * Mark the iterator as done and resolve any waiting promises.
   */
  markIteratorDone() {
    this.iteratorDone = true;
    while (this.resultResolvers.length > 0) {
      const resolve = this.resultResolvers.shift();
      resolve({ value: void 0, done: true });
    }
  }
  /**
   * Consume audio from an async iterable source.
   */
  async consumeAudioSource(audioSource) {
    try {
      for await (const chunk of audioSource) {
        if (!this.isConnected) {
          break;
        }
        this.sendAudio(chunk);
      }
      if (this.isConnected) {
        await this.requestFinalResult();
      }
    } catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
    }
  }
  /**
   * Set up event handlers for the underlying client.
   */
  setupClientHandlers() {
    this.client.on("message", (message) => {
      if (message.event === "RESULT") {
        this.handleResultMessage(message);
      } else if (message.event === "ACKAUDIO") {
        this.emit("audioAck", {
          frameCount: message.audioDetails?.frameCount ?? 0,
          timestamp: Date.now()
        });
      }
    });
    this.client.on("stateChange", (state) => {
      if (state === "reconnecting") {
        this.emit("reconnecting", 1, this.settings.maxReconnectAttempts ?? 3);
      }
    });
    this.client.on("error", (error) => {
      this.emit("error", error);
    });
    this.client.on("closed", (code, reason) => {
      this.markIteratorDone();
      if (code !== 1e3) {
        this.emit("disconnected", reason || "Connection lost");
      }
    });
  }
  /**
   * Handle transcription result messages.
   */
  handleResultMessage(message) {
    for (const transcription of message.transcriptions) {
      this.resultSequence++;
      this.resultCount++;
      const result = normalizeTranscriptionResult(
        transcription,
        this.client.currentSessionId ?? void 0,
        this.resultSequence
      );
      if (result.isFinal) {
        this.emit("final", result);
        this.emit("result", result);
      } else {
        this.emit("partial", result);
      }
      this.enqueueResult(result);
    }
  }
  /**
   * Emit an event to all registered listeners.
   */
  emit(event, ...args) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          console.error("Error in transcription handler:", event, error);
        }
      }
    }
  }
};

// src/provider.ts
var OCIGenAIProvider = class {
  constructor(config = {}) {
    this.config = config;
    this.specificationVersion = "v3";
  }
  get models() {
    const models3 = {};
    for (const model of MODEL_CATALOG) {
      models3[model.id] = {
        modelId: model.id,
        ...model
      };
    }
    return models3;
  }
  /**
   * Create a language model instance for chat/completion.
   *
   * @param modelId - OCI model identifier (e.g., 'cohere.command-r-plus')
   * @param settings - Optional model-specific settings that override provider config
   * @returns Language model instance
   *
   * @example
   * ```typescript
   * const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
   * const model = provider.languageModel('cohere.command-r-plus');
   * ```
   */
  languageModel(modelId, settings) {
    const mergedConfig = { ...this.config, ...settings };
    return new OCILanguageModel(modelId, mergedConfig);
  }
  /**
   * Create a language model instance for chat/completion.
   * Alias for `languageModel`.
   *
   * @param modelId - OCI model identifier
   * @param settings - Optional model-specific settings
   */
  chat(modelId, settings) {
    return this.languageModel(modelId, settings);
  }
  /**
   * Create an embedding model instance.
   *
   * @param modelId - OCI embedding model identifier (e.g., 'cohere.embed-multilingual-v3.0')
   * @param settings - Optional model-specific settings that override provider config
   * @returns Embedding model instance
   *
   * @example
   * ```typescript
   * const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
   * const model = provider.embeddingModel('cohere.embed-multilingual-v3.0');
   * ```
   */
  embeddingModel(modelId, settings) {
    const mergedConfig = { ...this.config, ...settings };
    return new OCIEmbeddingModel(modelId, mergedConfig);
  }
  /**
   * Image generation is not supported by OCI GenAI.
   *
   * @throws {NoSuchModelError} Always throws - OCI does not provide image generation
   */
  imageModel(modelId) {
    throw new provider.NoSuchModelError({
      modelId,
      modelType: "imageModel",
      message: "OCI does not provide image generation models."
    });
  }
  /**
   * Create a transcription model instance (STT).
   *
   * @throws {NoSuchModelError} Not yet implemented - coming in Plan 4
   */
  transcriptionModel(modelId, settings) {
    const mergedConfig = { ...this.config, ...settings };
    return new OCITranscriptionModel(modelId, mergedConfig);
  }
  /**
   * Create a speech model instance (TTS).
   *
   * @param modelId - OCI speech model identifier (e.g., 'TTS_2_NATURAL')
   * @param settings - Optional model-specific settings that override provider config
   * @returns Speech model instance
   *
   * @example
   * ```typescript
   * const provider = new OCIGenAIProvider({ region: 'us-phoenix-1' });
   * const model = provider.speechModel('TTS_2_NATURAL');
   * ```
   */
  speechModel(modelId, settings) {
    const mergedConfig = { ...this.config, ...settings };
    return new OCISpeechModel(modelId, mergedConfig);
  }
  /**
   * Create a reranking model instance.
   *
   * @param modelId - OCI reranking model identifier (e.g., 'cohere.rerank-v3.5')
   * @param settings - Optional model-specific settings that override provider config
   * @returns Reranking model instance
   *
   * @example
   * ```typescript
   * const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
   * const model = provider.rerankingModel('cohere.rerank-v3.5');
   * ```
   */
  rerankingModel(modelId, settings) {
    const mergedConfig = { ...this.config, ...settings };
    return new OCIRerankingModel(modelId, mergedConfig);
  }
  /**
   * Create a realtime transcription session for low-latency streaming STT.
   *
   * Unlike the batch `transcriptionModel()`, this uses OCI's WebSocket-based
   * realtime speech service for sub-second latency streaming transcription.
   *
   * @param settings - Realtime transcription settings
   * @returns Realtime transcription session
   *
   * @example Event-based API
   * ```typescript
   * const session = oci.realtimeTranscription({
   *   language: 'en-US',
   *   model: 'ORACLE',
   * });
   *
   * session.on('partial', (result) => console.log('Partial:', result.text));
   * session.on('final', (result) => console.log('Final:', result.text));
   *
   * await session.connect();
   * session.sendAudio(audioChunk);
   * await session.close();
   * ```
   *
   * @example Async Iterator API
   * ```typescript
   * const session = oci.realtimeTranscription({ language: 'en-US' });
   *
   * for await (const result of session.transcribe(audioStream)) {
   *   console.log(result.isFinal ? 'FINAL:' : 'PARTIAL:', result.text);
   * }
   * ```
   */
  realtimeTranscription(settings) {
    return new OCIRealtimeTranscription(this.config, settings);
  }
};

// src/index.ts
function createOCI(config = {}) {
  return new OCIGenAIProvider(config);
}
var oci = createOCI();

exports.AuthenticationError = AuthenticationError;
exports.CompartmentIdSchema = CompartmentIdSchema;
exports.ConfigProfileSchema = ConfigProfileSchema;
exports.EndpointIdSchema = EndpointIdSchema;
exports.ModelIdSchema = ModelIdSchema;
exports.ModelNotFoundError = ModelNotFoundError;
exports.NetworkError = NetworkError;
exports.OCIChatModelIdSchema = OCIChatModelIdSchema;
exports.OCIEmbeddingModel = OCIEmbeddingModel;
exports.OCIGenAIError = OCIGenAIError;
exports.OCIGenAIProvider = OCIGenAIProvider;
exports.OCILanguageModel = OCILanguageModel;
exports.OCIProviderOptionsSchema = OCIProviderOptionsSchema;
exports.OCIProviderSettingsSchema = OCIProviderSettingsSchema;
exports.OCIRealtimeClient = OCIRealtimeClient;
exports.OCIRealtimeTranscription = OCIRealtimeTranscription;
exports.OCIRerankingModel = OCIRerankingModel;
exports.OCISpeechModel = OCISpeechModel;
exports.OCITranscriptionModel = OCITranscriptionModel;
exports.RateLimitError = RateLimitError;
exports.RegionSchema = RegionSchema;
exports.ServingModeSchema = ServingModeSchema2;
exports.TimeoutError = TimeoutError;
exports.WebSocketAdapter = WebSocketAdapter;
exports.WebSocketReadyState = WebSocketReadyState;
exports.createOCI = createOCI;
exports.getAllEmbeddingModels = getAllEmbeddingModels;
exports.getAllModels = getAllModels;
exports.getAllRerankingModels = getAllRerankingModels;
exports.getAllSpeechModels = getAllSpeechModels;
exports.getAllTranscriptionModels = getAllTranscriptionModels;
exports.getAllVoices = getAllVoices;
exports.getCodingRecommendedModels = getCodingRecommendedModels;
exports.getEmbeddingModelMetadata = getEmbeddingModelMetadata;
exports.getModelMetadata = getModelMetadata;
exports.getModelsByFamily = getModelsByFamily;
exports.getModelsByRegion = getModelsByRegion;
exports.getRerankingModelMetadata = getRerankingModelMetadata;
exports.getSpeechModelMetadata = getSpeechModelMetadata;
exports.getSupportedLanguages = getSupportedLanguages;
exports.getTranscriptionModelMetadata = getTranscriptionModelMetadata;
exports.handleOCIError = handleOCIError;
exports.isCodingSuitable = isCodingSuitable;
exports.isRetryableError = isRetryableError;
exports.isRetryableStatusCode = isRetryableStatusCode;
exports.isValidEmbeddingModelId = isValidEmbeddingModelId;
exports.isValidModelId = isValidModelId;
exports.isValidRerankingModelId = isValidRerankingModelId;
exports.isValidSpeechModelId = isValidSpeechModelId;
exports.isValidTranscriptionModelId = isValidTranscriptionModelId;
exports.oci = oci;
exports.parseProviderOptions = parseProviderOptions;
exports.parseProviderSettings = parseProviderSettings;
exports.supportsReasoning = supportsReasoning;
exports.validateProviderSettings = validateProviderSettings;
exports.withRetry = withRetry;
exports.withTimeout = withTimeout;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map