function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var forge$g = {};

var forge$f = forge$g;
forge$f.md = forge$f.md || {};
forge$f.md.algorithms = forge$f.md.algorithms || {};

var forge$e = forge$g;
var util = forge$e.util = forge$e.util || {};
util.isArray = Array.isArray;
class ByteStringBuffer {
  // used for v8 optimization
  _constructedStringLength = 0;
  data = "";
  read = 0;
  constructor(b) {
    if (typeof b === "string") {
      this.data = b;
    }
  }
  /* Note: This is an optimization for V8-based browsers. When V8 concatenates
    a string, the strings are only joined logically using a "cons string" or
    "constructed/concatenated string". These containers keep references to one
    another and can result in very large memory usage. For example, if a 2MB
    string is constructed by concatenating 4 bytes together at a time, the
    memory usage will be ~44MB; so ~22x increase. The strings are only joined
    together when an operation requiring their joining takes place, such as
    substr(). This function is called when adding data to this buffer to ensure
    these types of strings are periodically joined to reduce the memory
    footprint. */
  _optimizeConstructedString(x) {
    this._constructedStringLength += x;
  }
  /**
   * Gets the number of bytes in this buffer.
   *
   * @return the number of bytes in this buffer.
   */
  length() {
    return this.data.length - this.read;
  }
  /**
   * Puts a byte in this buffer.
   *
   * @param b the byte to put.
   *
   * @return this buffer.
   */
  putByte(b) {
    return this.putBytes(String.fromCharCode(b));
  }
  /**
   * Puts bytes in this buffer.
   *
   * @param bytes the bytes (as a binary encoded string) to put.
   *
   * @return this buffer.
   */
  putBytes(bytes) {
    this.data += bytes;
    this._optimizeConstructedString(bytes.length);
    return this;
  }
  /**
   * Puts a 32-bit integer in this buffer in big-endian order.
   *
   * @param i the 32-bit integer.
   *
   * @return this buffer.
   */
  putInt32(i) {
    return this.putBytes(
      String.fromCharCode(i >> 24 & 255) + String.fromCharCode(i >> 16 & 255) + String.fromCharCode(i >> 8 & 255) + String.fromCharCode(i & 255)
    );
  }
  /**
   * Gets a byte from this buffer and advances the read pointer by 1.
   *
   * @return the byte.
   */
  getByte() {
    return this.data.charCodeAt(this.read++);
  }
  /**
   * Gets a uint32 from this buffer in big-endian order and advances the read
   * pointer by 4.
   *
   * @return the word.
   */
  getInt32() {
    var rval = this.data.charCodeAt(this.read) << 24 ^ this.data.charCodeAt(this.read + 1) << 16 ^ this.data.charCodeAt(this.read + 2) << 8 ^ this.data.charCodeAt(this.read + 3);
    this.read += 4;
    return rval;
  }
  /**
   * Gets an n-bit integer from this buffer in big-endian order and advances the
   * read pointer by ceil(n/8).
   *
   * @param n the number of bits in the integer (8, 16, 24, or 32).
   *
   * @return the integer.
   */
  getInt(n) {
    var rval = 0;
    do {
      rval = (rval << 8) + this.data.charCodeAt(this.read++);
      n -= 8;
    } while (n > 0);
    return rval;
  }
  /**
   * Reads bytes out as a binary encoded string and clears them from the
   * buffer. Note that the resulting string is binary encoded (in node.js this
   * encoding is referred to as `binary`, it is *not* `utf8`).
   *
   * @param count the number of bytes to read, undefined or null for all.
   *
   * @return a binary encoded string of bytes.
   */
  getBytes(count) {
    var rval;
    if (count) {
      count = Math.min(this.length(), count);
      rval = this.data.slice(this.read, this.read + count);
      this.read += count;
    } else if (count === 0) {
      rval = "";
    } else {
      rval = this.data;
      this.clear();
    }
    return rval;
  }
  /**
   * Gets a binary encoded string of the bytes from this buffer without
   * modifying the read pointer.
   *
   * @param count the number of bytes to get, omit to get all.
   *
   * @return a string full of binary encoded characters.
   */
  bytes(count) {
    return typeof count === "undefined" ? this.data.slice(this.read) : this.data.slice(this.read, this.read + count);
  }
  /**
   * Compacts this buffer.
   *
   * @return this buffer.
   */
  compact() {
    if (this.read > 0) {
      this.data = this.data.slice(this.read);
      this.read = 0;
    }
    return this;
  }
  /**
   * Clears this buffer.
   *
   * @return this buffer.
   */
  clear() {
    this.data = "";
    this.read = 0;
    return this;
  }
  /**
   * Converts this buffer to a hexadecimal string.
   *
   * @return a hexadecimal string.
   */
  toHex() {
    var rval = "";
    for (var i = this.read; i < this.data.length; ++i) {
      var b = this.data.charCodeAt(i);
      if (b < 16) {
        rval += "0";
      }
      rval += b.toString(16);
    }
    return rval;
  }
}
util.ByteStringBuffer = ByteStringBuffer;
util.fillString = function(c, n) {
  var s = "";
  while (n > 0) {
    if (n & 1) {
      s += c;
    }
    n >>>= 1;
    if (n > 0) {
      c += c;
    }
  }
  return s;
};
util.xorBytes = function(s1, s2, n) {
  var s3 = "";
  var b = 0;
  var t = "";
  var i = 0;
  var c = 0;
  for (; n > 0; --n, ++i) {
    b = s1.charCodeAt(i) ^ s2.charCodeAt(i);
    if (c >= 10) {
      s3 += t;
      t = "";
      c = 0;
    }
    t += String.fromCharCode(b);
    ++c;
  }
  s3 += t;
  return s3;
};
const _base64Idx = [
  /*43 -43 = 0*/
  /*'+',  1,  2,  3,'/' */
  62,
  -1,
  -1,
  -1,
  63,
  /*'0','1','2','3','4','5','6','7','8','9' */
  52,
  53,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  /*15, 16, 17,'=', 19, 20, 21 */
  -1,
  -1,
  -1,
  64,
  -1,
  -1,
  -1,
  /*65 - 43 = 22*/
  /*'A','B','C','D','E','F','G','H','I','J','K','L','M', */
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  /*'N','O','P','Q','R','S','T','U','V','W','X','Y','Z' */
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  /*91 - 43 = 48 */
  /*48, 49, 50, 51, 52, 53 */
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  /*97 - 43 = 54*/
  /*'a','b','c','d','e','f','g','h','i','j','k','l','m' */
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  /*'n','o','p','q','r','s','t','u','v','w','x','y','z' */
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51
];
util.decode64 = function(input) {
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
  var output = "";
  var enc1, enc2, enc3, enc4;
  var i = 0;
  while (i < input.length) {
    enc1 = _base64Idx[input.charCodeAt(i++) - 43];
    enc2 = _base64Idx[input.charCodeAt(i++) - 43];
    enc3 = _base64Idx[input.charCodeAt(i++) - 43];
    enc4 = _base64Idx[input.charCodeAt(i++) - 43];
    output += String.fromCharCode(enc1 << 2 | enc2 >> 4);
    if (enc3 !== 64) {
      output += String.fromCharCode((enc2 & 15) << 4 | enc3 >> 2);
      if (enc4 !== 64) {
        output += String.fromCharCode((enc3 & 3) << 6 | enc4);
      }
    }
  }
  return output;
};

var forge$d = forge$g;


var sha1 = forge$d.sha1 = forge$d.sha1 || {};
forge$d.md.sha1 = forge$d.md.algorithms.sha1 = sha1;
sha1.create = function() {
  if (!_initialized$2) {
    _init$2();
  }
  var _state = null;
  var _input = new forge$d.util.ByteStringBuffer();
  var _w = new Array(80);
  var md = {
    algorithm: "sha1",
    blockLength: 64,
    digestLength: 20,
    // 56-bit length of message so far (does not including padding)
    messageLength: 0,
    // true message length
    fullMessageLength: null,
    // size of message length in bytes
    messageLengthSize: 8
  };
  md.start = function() {
    md.messageLength = 0;
    md.fullMessageLength = md.messageLength64 = [];
    var int32s = md.messageLengthSize / 4;
    for (var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = new forge$d.util.ByteStringBuffer();
    _state = {
      h0: 1732584193,
      h1: 4023233417,
      h2: 2562383102,
      h3: 271733878,
      h4: 3285377520
    };
    return md;
  };
  md.start();
  md.update = function(msg) {
    var len = msg.length;
    md.messageLength += len;
    len = [len / 4294967296 >>> 0, len >>> 0];
    for (var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + (md.fullMessageLength[i] / 4294967296 >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = len[1] / 4294967296 >>> 0;
    }
    _input.putBytes(msg);
    _update$2(_state, _w, _input);
    if (_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }
    return md;
  };
  md.digest = function() {
    var finalBlock = new forge$d.util.ByteStringBuffer();
    finalBlock.putBytes(_input.bytes());
    var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
    var overflow = remaining & md.blockLength - 1;
    finalBlock.putBytes(_padding$2.substr(0, md.blockLength - overflow));
    var next, carry;
    var bits = md.fullMessageLength[0] * 8;
    for (var i = 0; i < md.fullMessageLength.length - 1; ++i) {
      next = md.fullMessageLength[i + 1] * 8;
      carry = next / 4294967296 >>> 0;
      bits += carry;
      finalBlock.putInt32(bits >>> 0);
      bits = next >>> 0;
    }
    finalBlock.putInt32(bits);
    var s2 = {
      h0: _state.h0,
      h1: _state.h1,
      h2: _state.h2,
      h3: _state.h3,
      h4: _state.h4
    };
    _update$2(s2, _w, finalBlock);
    var rval = new forge$d.util.ByteStringBuffer();
    rval.putInt32(s2.h0);
    rval.putInt32(s2.h1);
    rval.putInt32(s2.h2);
    rval.putInt32(s2.h3);
    rval.putInt32(s2.h4);
    return rval;
  };
  return md;
};
var _padding$2 = null;
var _initialized$2 = false;
function _init$2() {
  _padding$2 = String.fromCharCode(128);
  _padding$2 += forge$d.util.fillString(String.fromCharCode(0), 64);
  _initialized$2 = true;
}
function _update$2(s, w, bytes) {
  var t, a, b, c, d, e, f, i;
  var len = bytes.length();
  while (len >= 64) {
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;
    for (i = 0; i < 16; ++i) {
      t = bytes.getInt32();
      w[i] = t;
      f = d ^ b & (c ^ d);
      t = (a << 5 | a >>> 27) + f + e + 1518500249 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 20; ++i) {
      t = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      t = t << 1 | t >>> 31;
      w[i] = t;
      f = d ^ b & (c ^ d);
      t = (a << 5 | a >>> 27) + f + e + 1518500249 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 32; ++i) {
      t = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      t = t << 1 | t >>> 31;
      w[i] = t;
      f = b ^ c ^ d;
      t = (a << 5 | a >>> 27) + f + e + 1859775393 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 40; ++i) {
      t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
      t = t << 2 | t >>> 30;
      w[i] = t;
      f = b ^ c ^ d;
      t = (a << 5 | a >>> 27) + f + e + 1859775393 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 60; ++i) {
      t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
      t = t << 2 | t >>> 30;
      w[i] = t;
      f = b & c | d & (b ^ c);
      t = (a << 5 | a >>> 27) + f + e + 2400959708 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    for (; i < 80; ++i) {
      t = w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32];
      t = t << 2 | t >>> 30;
      w[i] = t;
      f = b ^ c ^ d;
      t = (a << 5 | a >>> 27) + f + e + 3395469782 + t;
      e = d;
      d = c;
      c = (b << 30 | b >>> 2) >>> 0;
      b = a;
      a = t;
    }
    s.h0 = s.h0 + a | 0;
    s.h1 = s.h1 + b | 0;
    s.h2 = s.h2 + c | 0;
    s.h3 = s.h3 + d | 0;
    s.h4 = s.h4 + e | 0;
    len -= 64;
  }
}

var forge$c = forge$g;


var sha256 = forge$c.sha256 = forge$c.sha256 || {};
forge$c.md.sha256 = forge$c.md.algorithms.sha256 = sha256;
sha256.create = function() {
  if (!_initialized$1) {
    _init$1();
  }
  var _state = null;
  var _input = new forge$c.util.ByteStringBuffer();
  var _w = new Array(64);
  var md = {
    algorithm: "sha256",
    blockLength: 64,
    digestLength: 32,
    // 56-bit length of message so far (does not including padding)
    messageLength: 0,
    // true message length
    fullMessageLength: null,
    // size of message length in bytes
    messageLengthSize: 8
  };
  md.start = function() {
    md.messageLength = 0;
    md.fullMessageLength = md.messageLength64 = [];
    var int32s = md.messageLengthSize / 4;
    for (var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = new forge$c.util.ByteStringBuffer();
    _state = {
      h0: 1779033703,
      h1: 3144134277,
      h2: 1013904242,
      h3: 2773480762,
      h4: 1359893119,
      h5: 2600822924,
      h6: 528734635,
      h7: 1541459225
    };
    return md;
  };
  md.start();
  md.update = function(msg) {
    var len = msg.length;
    md.messageLength += len;
    len = [len / 4294967296 >>> 0, len >>> 0];
    for (var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + (md.fullMessageLength[i] / 4294967296 >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = len[1] / 4294967296 >>> 0;
    }
    _input.putBytes(msg);
    _update$1(_state, _w, _input);
    if (_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }
    return md;
  };
  md.digest = function() {
    var finalBlock = new forge$c.util.ByteStringBuffer();
    finalBlock.putBytes(_input.bytes());
    var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
    var overflow = remaining & md.blockLength - 1;
    finalBlock.putBytes(_padding$1.substr(0, md.blockLength - overflow));
    var next, carry;
    var bits = md.fullMessageLength[0] * 8;
    for (var i = 0; i < md.fullMessageLength.length - 1; ++i) {
      next = md.fullMessageLength[i + 1] * 8;
      carry = next / 4294967296 >>> 0;
      bits += carry;
      finalBlock.putInt32(bits >>> 0);
      bits = next >>> 0;
    }
    finalBlock.putInt32(bits);
    var s2 = {
      h0: _state.h0,
      h1: _state.h1,
      h2: _state.h2,
      h3: _state.h3,
      h4: _state.h4,
      h5: _state.h5,
      h6: _state.h6,
      h7: _state.h7
    };
    _update$1(s2, _w, finalBlock);
    var rval = new forge$c.util.ByteStringBuffer();
    rval.putInt32(s2.h0);
    rval.putInt32(s2.h1);
    rval.putInt32(s2.h2);
    rval.putInt32(s2.h3);
    rval.putInt32(s2.h4);
    rval.putInt32(s2.h5);
    rval.putInt32(s2.h6);
    rval.putInt32(s2.h7);
    return rval;
  };
  return md;
};
var _padding$1 = null;
var _initialized$1 = false;
var _k$1 = null;
function _init$1() {
  _padding$1 = String.fromCharCode(128);
  _padding$1 += forge$c.util.fillString(String.fromCharCode(0), 64);
  _k$1 = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  _initialized$1 = true;
}
function _update$1(s, w, bytes) {
  var t1, t2, s0, s1, ch, maj, i, a, b, c, d, e, f, g, h;
  var len = bytes.length();
  while (len >= 64) {
    for (i = 0; i < 16; ++i) {
      w[i] = bytes.getInt32();
    }
    for (; i < 64; ++i) {
      t1 = w[i - 2];
      t1 = (t1 >>> 17 | t1 << 15) ^ (t1 >>> 19 | t1 << 13) ^ t1 >>> 10;
      t2 = w[i - 15];
      t2 = (t2 >>> 7 | t2 << 25) ^ (t2 >>> 18 | t2 << 14) ^ t2 >>> 3;
      w[i] = t1 + w[i - 7] + t2 + w[i - 16] | 0;
    }
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;
    f = s.h5;
    g = s.h6;
    h = s.h7;
    for (i = 0; i < 64; ++i) {
      s1 = (e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7);
      ch = g ^ e & (f ^ g);
      s0 = (a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10);
      maj = a & b | c & (a ^ b);
      t1 = h + s1 + ch + _k$1[i] + w[i];
      t2 = s0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + t1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 >>> 0;
    }
    s.h0 = s.h0 + a | 0;
    s.h1 = s.h1 + b | 0;
    s.h2 = s.h2 + c | 0;
    s.h3 = s.h3 + d | 0;
    s.h4 = s.h4 + e | 0;
    s.h5 = s.h5 + f | 0;
    s.h6 = s.h6 + g | 0;
    s.h7 = s.h7 + h | 0;
    len -= 64;
  }
}

var forge$b = forge$g;


var sha512 = forge$b.sha512 = forge$b.sha512 || {};
forge$b.md.sha512 = forge$b.md.algorithms.sha512 = sha512;
var sha384 = forge$b.sha384 = forge$b.sha512.sha384 = forge$b.sha512.sha384 || {};
sha384.create = function() {
  return sha512.create("SHA-384");
};
forge$b.md.sha384 = forge$b.md.algorithms.sha384 = sha384;
sha512.create = function(algorithm) {
  if (!_initialized) {
    _init();
  }
  if (typeof algorithm === "undefined") {
    algorithm = "SHA-512";
  }
  var _state = _states[algorithm];
  var _h = null;
  var _input = new forge$b.util.ByteStringBuffer();
  var _w = new Array(80);
  for (var wi = 0; wi < 80; ++wi) {
    _w[wi] = new Array(2);
  }
  var digestLength = 64;
  switch (algorithm) {
    case "SHA-384":
      digestLength = 48;
      break;
  }
  var md = {
    // SHA-512 => sha512
    algorithm: algorithm.replace("-", "").toLowerCase(),
    blockLength: 128,
    digestLength,
    // 56-bit length of message so far (does not including padding)
    messageLength: 0,
    // true message length
    fullMessageLength: null,
    // size of message length in bytes
    messageLengthSize: 16
  };
  md.start = function() {
    md.messageLength = 0;
    md.fullMessageLength = md.messageLength128 = [];
    var int32s = md.messageLengthSize / 4;
    for (var i = 0; i < int32s; ++i) {
      md.fullMessageLength.push(0);
    }
    _input = new forge$b.util.ByteStringBuffer();
    _h = new Array(_state.length);
    for (var i = 0; i < _state.length; ++i) {
      _h[i] = _state[i].slice(0);
    }
    return md;
  };
  md.start();
  md.update = function(msg) {
    var len = msg.length;
    md.messageLength += len;
    len = [len / 4294967296 >>> 0, len >>> 0];
    for (var i = md.fullMessageLength.length - 1; i >= 0; --i) {
      md.fullMessageLength[i] += len[1];
      len[1] = len[0] + (md.fullMessageLength[i] / 4294967296 >>> 0);
      md.fullMessageLength[i] = md.fullMessageLength[i] >>> 0;
      len[0] = len[1] / 4294967296 >>> 0;
    }
    _input.putBytes(msg);
    _update(_h, _w, _input);
    if (_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }
    return md;
  };
  md.digest = function() {
    var finalBlock = new forge$b.util.ByteStringBuffer();
    finalBlock.putBytes(_input.bytes());
    var remaining = md.fullMessageLength[md.fullMessageLength.length - 1] + md.messageLengthSize;
    var overflow = remaining & md.blockLength - 1;
    finalBlock.putBytes(_padding.substr(0, md.blockLength - overflow));
    var next, carry;
    var bits = md.fullMessageLength[0] * 8;
    for (var i = 0; i < md.fullMessageLength.length - 1; ++i) {
      next = md.fullMessageLength[i + 1] * 8;
      carry = next / 4294967296 >>> 0;
      bits += carry;
      finalBlock.putInt32(bits >>> 0);
      bits = next >>> 0;
    }
    finalBlock.putInt32(bits);
    var h = new Array(_h.length);
    for (var i = 0; i < _h.length; ++i) {
      h[i] = _h[i].slice(0);
    }
    _update(h, _w, finalBlock);
    var rval = new forge$b.util.ByteStringBuffer();
    var hlen;
    if (algorithm === "SHA-512") {
      hlen = h.length;
    } else {
      hlen = h.length - 2;
    }
    for (var i = 0; i < hlen; ++i) {
      rval.putInt32(h[i][0]);
      rval.putInt32(h[i][1]);
    }
    return rval;
  };
  return md;
};
var _padding = null;
var _initialized = false;
var _k = null;
var _states = null;
function _init() {
  _padding = String.fromCharCode(128);
  _padding += forge$b.util.fillString(String.fromCharCode(0), 128);
  _k = [
    [1116352408, 3609767458],
    [1899447441, 602891725],
    [3049323471, 3964484399],
    [3921009573, 2173295548],
    [961987163, 4081628472],
    [1508970993, 3053834265],
    [2453635748, 2937671579],
    [2870763221, 3664609560],
    [3624381080, 2734883394],
    [310598401, 1164996542],
    [607225278, 1323610764],
    [1426881987, 3590304994],
    [1925078388, 4068182383],
    [2162078206, 991336113],
    [2614888103, 633803317],
    [3248222580, 3479774868],
    [3835390401, 2666613458],
    [4022224774, 944711139],
    [264347078, 2341262773],
    [604807628, 2007800933],
    [770255983, 1495990901],
    [1249150122, 1856431235],
    [1555081692, 3175218132],
    [1996064986, 2198950837],
    [2554220882, 3999719339],
    [2821834349, 766784016],
    [2952996808, 2566594879],
    [3210313671, 3203337956],
    [3336571891, 1034457026],
    [3584528711, 2466948901],
    [113926993, 3758326383],
    [338241895, 168717936],
    [666307205, 1188179964],
    [773529912, 1546045734],
    [1294757372, 1522805485],
    [1396182291, 2643833823],
    [1695183700, 2343527390],
    [1986661051, 1014477480],
    [2177026350, 1206759142],
    [2456956037, 344077627],
    [2730485921, 1290863460],
    [2820302411, 3158454273],
    [3259730800, 3505952657],
    [3345764771, 106217008],
    [3516065817, 3606008344],
    [3600352804, 1432725776],
    [4094571909, 1467031594],
    [275423344, 851169720],
    [430227734, 3100823752],
    [506948616, 1363258195],
    [659060556, 3750685593],
    [883997877, 3785050280],
    [958139571, 3318307427],
    [1322822218, 3812723403],
    [1537002063, 2003034995],
    [1747873779, 3602036899],
    [1955562222, 1575990012],
    [2024104815, 1125592928],
    [2227730452, 2716904306],
    [2361852424, 442776044],
    [2428436474, 593698344],
    [2756734187, 3733110249],
    [3204031479, 2999351573],
    [3329325298, 3815920427],
    [3391569614, 3928383900],
    [3515267271, 566280711],
    [3940187606, 3454069534],
    [4118630271, 4000239992],
    [116418474, 1914138554],
    [174292421, 2731055270],
    [289380356, 3203993006],
    [460393269, 320620315],
    [685471733, 587496836],
    [852142971, 1086792851],
    [1017036298, 365543100],
    [1126000580, 2618297676],
    [1288033470, 3409855158],
    [1501505948, 4234509866],
    [1607167915, 987167468],
    [1816402316, 1246189591]
  ];
  _states = {};
  _states["SHA-512"] = [
    [1779033703, 4089235720],
    [3144134277, 2227873595],
    [1013904242, 4271175723],
    [2773480762, 1595750129],
    [1359893119, 2917565137],
    [2600822924, 725511199],
    [528734635, 4215389547],
    [1541459225, 327033209]
  ];
  _states["SHA-384"] = [
    [3418070365, 3238371032],
    [1654270250, 914150663],
    [2438529370, 812702999],
    [355462360, 4144912697],
    [1731405415, 4290775857],
    [2394180231, 1750603025],
    [3675008525, 1694076839],
    [1203062813, 3204075428]
  ];
  _states["SHA-512/256"] = [
    [573645204, 4230739756],
    [2673172387, 3360449730],
    [596883563, 1867755857],
    [2520282905, 1497426621],
    [2519219938, 2827943907],
    [3193839141, 1401305490],
    [721525244, 746961066],
    [246885852, 2177182882]
  ];
  _states["SHA-512/224"] = [
    [2352822216, 424955298],
    [1944164710, 2312950998],
    [502970286, 855612546],
    [1738396948, 1479516111],
    [258812777, 2077511080],
    [2011393907, 79989058],
    [1067287976, 1780299464],
    [286451373, 2446758561]
  ];
  _initialized = true;
}
function _update(s, w, bytes) {
  var t1_hi, t1_lo;
  var t2_hi, t2_lo;
  var s0_hi, s0_lo;
  var s1_hi, s1_lo;
  var ch_hi, ch_lo;
  var maj_hi, maj_lo;
  var a_hi, a_lo;
  var b_hi, b_lo;
  var c_hi, c_lo;
  var d_hi, d_lo;
  var e_hi, e_lo;
  var f_hi, f_lo;
  var g_hi, g_lo;
  var h_hi, h_lo;
  var i, hi, lo, w2, w7, w15, w16;
  var len = bytes.length();
  while (len >= 128) {
    for (i = 0; i < 16; ++i) {
      w[i][0] = bytes.getInt32() >>> 0;
      w[i][1] = bytes.getInt32() >>> 0;
    }
    for (; i < 80; ++i) {
      w2 = w[i - 2];
      hi = w2[0];
      lo = w2[1];
      t1_hi = ((hi >>> 19 | lo << 13) ^ // ROTR 19
      (lo >>> 29 | hi << 3) ^ // ROTR 61/(swap + ROTR 29)
      hi >>> 6) >>> 0;
      t1_lo = ((hi << 13 | lo >>> 19) ^ // ROTR 19
      (lo << 3 | hi >>> 29) ^ // ROTR 61/(swap + ROTR 29)
      (hi << 26 | lo >>> 6)) >>> 0;
      w15 = w[i - 15];
      hi = w15[0];
      lo = w15[1];
      t2_hi = ((hi >>> 1 | lo << 31) ^ // ROTR 1
      (hi >>> 8 | lo << 24) ^ // ROTR 8
      hi >>> 7) >>> 0;
      t2_lo = ((hi << 31 | lo >>> 1) ^ // ROTR 1
      (hi << 24 | lo >>> 8) ^ // ROTR 8
      (hi << 25 | lo >>> 7)) >>> 0;
      w7 = w[i - 7];
      w16 = w[i - 16];
      lo = t1_lo + w7[1] + t2_lo + w16[1];
      w[i][0] = t1_hi + w7[0] + t2_hi + w16[0] + (lo / 4294967296 >>> 0) >>> 0;
      w[i][1] = lo >>> 0;
    }
    a_hi = s[0][0];
    a_lo = s[0][1];
    b_hi = s[1][0];
    b_lo = s[1][1];
    c_hi = s[2][0];
    c_lo = s[2][1];
    d_hi = s[3][0];
    d_lo = s[3][1];
    e_hi = s[4][0];
    e_lo = s[4][1];
    f_hi = s[5][0];
    f_lo = s[5][1];
    g_hi = s[6][0];
    g_lo = s[6][1];
    h_hi = s[7][0];
    h_lo = s[7][1];
    for (i = 0; i < 80; ++i) {
      s1_hi = ((e_hi >>> 14 | e_lo << 18) ^ // ROTR 14
      (e_hi >>> 18 | e_lo << 14) ^ // ROTR 18
      (e_lo >>> 9 | e_hi << 23)) >>> 0;
      s1_lo = ((e_hi << 18 | e_lo >>> 14) ^ // ROTR 14
      (e_hi << 14 | e_lo >>> 18) ^ // ROTR 18
      (e_lo << 23 | e_hi >>> 9)) >>> 0;
      ch_hi = (g_hi ^ e_hi & (f_hi ^ g_hi)) >>> 0;
      ch_lo = (g_lo ^ e_lo & (f_lo ^ g_lo)) >>> 0;
      s0_hi = ((a_hi >>> 28 | a_lo << 4) ^ // ROTR 28
      (a_lo >>> 2 | a_hi << 30) ^ // ROTR 34/(swap + ROTR 2)
      (a_lo >>> 7 | a_hi << 25)) >>> 0;
      s0_lo = ((a_hi << 4 | a_lo >>> 28) ^ // ROTR 28
      (a_lo << 30 | a_hi >>> 2) ^ // ROTR 34/(swap + ROTR 2)
      (a_lo << 25 | a_hi >>> 7)) >>> 0;
      maj_hi = (a_hi & b_hi | c_hi & (a_hi ^ b_hi)) >>> 0;
      maj_lo = (a_lo & b_lo | c_lo & (a_lo ^ b_lo)) >>> 0;
      lo = h_lo + s1_lo + ch_lo + _k[i][1] + w[i][1];
      t1_hi = h_hi + s1_hi + ch_hi + _k[i][0] + w[i][0] + (lo / 4294967296 >>> 0) >>> 0;
      t1_lo = lo >>> 0;
      lo = s0_lo + maj_lo;
      t2_hi = s0_hi + maj_hi + (lo / 4294967296 >>> 0) >>> 0;
      t2_lo = lo >>> 0;
      h_hi = g_hi;
      h_lo = g_lo;
      g_hi = f_hi;
      g_lo = f_lo;
      f_hi = e_hi;
      f_lo = e_lo;
      lo = d_lo + t1_lo;
      e_hi = d_hi + t1_hi + (lo / 4294967296 >>> 0) >>> 0;
      e_lo = lo >>> 0;
      d_hi = c_hi;
      d_lo = c_lo;
      c_hi = b_hi;
      c_lo = b_lo;
      b_hi = a_hi;
      b_lo = a_lo;
      lo = t1_lo + t2_lo;
      a_hi = t1_hi + t2_hi + (lo / 4294967296 >>> 0) >>> 0;
      a_lo = lo >>> 0;
    }
    lo = s[0][1] + a_lo;
    s[0][0] = s[0][0] + a_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[0][1] = lo >>> 0;
    lo = s[1][1] + b_lo;
    s[1][0] = s[1][0] + b_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[1][1] = lo >>> 0;
    lo = s[2][1] + c_lo;
    s[2][0] = s[2][0] + c_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[2][1] = lo >>> 0;
    lo = s[3][1] + d_lo;
    s[3][0] = s[3][0] + d_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[3][1] = lo >>> 0;
    lo = s[4][1] + e_lo;
    s[4][0] = s[4][0] + e_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[4][1] = lo >>> 0;
    lo = s[5][1] + f_lo;
    s[5][0] = s[5][0] + f_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[5][1] = lo >>> 0;
    lo = s[6][1] + g_lo;
    s[6][0] = s[6][0] + g_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[6][1] = lo >>> 0;
    lo = s[7][1] + h_lo;
    s[7][0] = s[7][0] + h_hi + (lo / 4294967296 >>> 0) >>> 0;
    s[7][1] = lo >>> 0;
    len -= 128;
  }
}

var forge$a = forge$g;

var pem = forge$a.pem = forge$a.pem || {};
pem.decode = function(str) {
  var rMessage = /\s*-----BEGIN ([A-Z0-9- ]+)-----\r?\n?([\x21-\x7e\s]+?(?:\r?\n\r?\n))?([:A-Za-z0-9+\/=\s]+?)-----END \1-----/g;
  var match;
  match = rMessage.exec(str);
  if (!match) {
    throw new Error("Invalid PEM formatted message.");
  }
  return forge$a.util.decode64(match[3]);
};

var forge$9 = forge$g;

forge$9.aes = forge$9.aes || {};
forge$9.aes._expandKey = function(key, decrypt) {
  if (!init) {
    initialize();
  }
  return _expandKey(key);
};
forge$9.aes._updateBlock = _updateBlock;
var init = false;
var Nb = 4;
var sbox;
var isbox;
var rcon;
var mix;
var imix;
function initialize() {
  init = true;
  rcon = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
  var xtime = new Array(256);
  for (var i = 0; i < 128; ++i) {
    xtime[i] = i << 1;
    xtime[i + 128] = i + 128 << 1 ^ 283;
  }
  sbox = new Array(256);
  isbox = new Array(256);
  mix = new Array(4);
  imix = new Array(4);
  for (var i = 0; i < 4; ++i) {
    mix[i] = new Array(256);
    imix[i] = new Array(256);
  }
  var e = 0, ei = 0, e2, e4, e8, sx, sx2, me, ime;
  for (var i = 0; i < 256; ++i) {
    sx = ei ^ ei << 1 ^ ei << 2 ^ ei << 3 ^ ei << 4;
    sx = sx >> 8 ^ sx & 255 ^ 99;
    sbox[e] = sx;
    isbox[sx] = e;
    sx2 = xtime[sx];
    e2 = xtime[e];
    e4 = xtime[e2];
    e8 = xtime[e4];
    me = sx2 << 24 ^ // 2
    sx << 16 ^ // 1
    sx << 8 ^ // 1
    (sx ^ sx2);
    ime = (e2 ^ e4 ^ e8) << 24 ^ // E (14)
    (e ^ e8) << 16 ^ // 9
    (e ^ e4 ^ e8) << 8 ^ // D (13)
    (e ^ e2 ^ e8);
    for (var n = 0; n < 4; ++n) {
      mix[n][e] = me;
      imix[n][sx] = ime;
      me = me << 24 | me >>> 8;
      ime = ime << 24 | ime >>> 8;
    }
    if (e === 0) {
      e = ei = 1;
    } else {
      e = e2 ^ xtime[xtime[xtime[e2 ^ e8]]];
      ei ^= xtime[xtime[ei]];
    }
  }
}
function _expandKey(key) {
  var w = key.slice(0);
  var temp, iNk = 1;
  var Nk = w.length;
  var Nr1 = Nk + 6 + 1;
  var end = Nb * Nr1;
  for (var i = Nk; i < end; ++i) {
    temp = w[i - 1];
    temp = sbox[temp >>> 16 & 255] << 24 ^ sbox[temp >>> 8 & 255] << 16 ^ sbox[temp & 255] << 8 ^ sbox[temp >>> 24] ^ rcon[iNk] << 24;
    iNk++;
    w[i] = w[i - Nk] ^ temp;
  }
  return w;
}
function _updateBlock(w, input, output, decrypt) {
  var Nr = w.length / 4 - 1;
  var m0, m1, m2, m3, sub;
  m0 = mix[0];
  m1 = mix[1];
  m2 = mix[2];
  m3 = mix[3];
  sub = sbox;
  var a, b, c, d, a2, b2, c2;
  a = input[0] ^ w[0];
  b = input[1] ^ w[1];
  c = input[2] ^ w[2];
  d = input[3] ^ w[3];
  var i = 3;
  for (var round = 1; round < Nr; ++round) {
    a2 = m0[a >>> 24] ^ m1[b >>> 16 & 255] ^ m2[c >>> 8 & 255] ^ m3[d & 255] ^ w[++i];
    b2 = m0[b >>> 24] ^ m1[c >>> 16 & 255] ^ m2[d >>> 8 & 255] ^ m3[a & 255] ^ w[++i];
    c2 = m0[c >>> 24] ^ m1[d >>> 16 & 255] ^ m2[a >>> 8 & 255] ^ m3[b & 255] ^ w[++i];
    d = m0[d >>> 24] ^ m1[a >>> 16 & 255] ^ m2[b >>> 8 & 255] ^ m3[c & 255] ^ w[++i];
    a = a2;
    b = b2;
    c = c2;
  }
  output[0] = sub[a >>> 24] << 24 ^ sub[b >>> 16 & 255] << 16 ^ sub[c >>> 8 & 255] << 8 ^ sub[d & 255] ^ w[++i];
  output[1] = sub[b >>> 24] << 24 ^ sub[c >>> 16 & 255] << 16 ^ sub[d >>> 8 & 255] << 8 ^ sub[a & 255] ^ w[++i];
  output[2] = sub[c >>> 24] << 24 ^ sub[d >>> 16 & 255] << 16 ^ sub[a >>> 8 & 255] << 8 ^ sub[b & 255] ^ w[++i];
  output[3] = sub[d >>> 24] << 24 ^ sub[a >>> 16 & 255] << 16 ^ sub[b >>> 8 & 255] << 8 ^ sub[c & 255] ^ w[++i];
}

var forge$8 = forge$g;

var prng = forge$8.prng = forge$8.prng || {};
prng.create = function(plugin) {
  var ctx = {
    plugin,
    key: null,
    seed: null,
    time: null,
    // number of reseeds so far
    reseeds: 0,
    // amount of data generated so far
    generated: 0,
    // no initial key bytes
    keyBytes: ""
  };
  var md = plugin.md;
  var pools = new Array(32);
  for (var i = 0; i < 32; ++i) {
    pools[i] = md.create();
  }
  ctx.pools = pools;
  ctx.pool = 0;
  ctx.generate = function(count, callback) {
    if (!callback) {
      return ctx.generateSync(count);
    }
  };
  ctx.generateSync = function(count) {
    var cipher = ctx.plugin.cipher;
    var increment = ctx.plugin.increment;
    var formatKey = ctx.plugin.formatKey;
    var formatSeed = ctx.plugin.formatSeed;
    ctx.key = null;
    var b = new forge$8.util.ByteStringBuffer();
    while (b.length() < count) {
      if (ctx.key === null) {
        _reseedSync();
      }
      var bytes = cipher(ctx.key, ctx.seed);
      ctx.generated += bytes.length;
      b.putBytes(bytes);
      ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
      ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));
    }
    return b.getBytes(count);
  };
  function _reseedSync() {
    var needed = 32 - ctx.pools[0].messageLength << 5;
    ctx.collect(ctx.seedFileSync(needed));
    _seed();
  }
  function _seed() {
    ctx.reseeds = ctx.reseeds === 4294967295 ? 0 : ctx.reseeds + 1;
    var md2 = ctx.plugin.md.create();
    md2.update(ctx.keyBytes);
    var _2powK = 1;
    for (var k = 0; k < 32; ++k) {
      if (ctx.reseeds % _2powK === 0) {
        md2.update(ctx.pools[k].digest().getBytes());
        ctx.pools[k].start();
      }
      _2powK = _2powK << 1;
    }
    ctx.keyBytes = md2.digest().getBytes();
    md2.start();
    md2.update(ctx.keyBytes);
    var seedBytes = md2.digest().getBytes();
    ctx.key = ctx.plugin.formatKey(ctx.keyBytes);
    ctx.seed = ctx.plugin.formatSeed(seedBytes);
    ctx.generated = 0;
  }
  function defaultSeedFile(needed) {
    var b = new forge$8.util.ByteStringBuffer();
    if (b.length() < needed) {
      var hi, lo, next;
      var seed = Math.floor(Math.random() * 65536);
      while (b.length() < needed) {
        lo = 16807 * (seed & 65535);
        hi = 16807 * (seed >> 16);
        lo += (hi & 32767) << 16;
        lo += hi >> 15;
        lo = (lo & 2147483647) + (lo >> 31);
        seed = lo & 4294967295;
        for (var i2 = 0; i2 < 3; ++i2) {
          next = seed >>> (i2 << 3);
          next ^= Math.floor(Math.random() * 256);
          b.putByte(next & 255);
        }
      }
    }
    return b.getBytes(needed);
  }
  ctx.seedFileSync = defaultSeedFile;
  ctx.collect = function(bytes) {
    var count = bytes.length;
    for (var i2 = 0; i2 < count; ++i2) {
      ctx.pools[ctx.pool].update(bytes.substr(i2, 1));
      ctx.pool = ctx.pool === 31 ? 0 : ctx.pool + 1;
    }
  };
  return ctx;
};

var forge$7 = forge$g;




var prng_aes = {};
var _prng_aes_output = new Array(4);
var _prng_aes_buffer = new forge$7.util.ByteStringBuffer();
prng_aes.formatKey = function(key) {
  var tmp = new forge$7.util.ByteStringBuffer(key);
  key = new Array(4);
  key[0] = tmp.getInt32();
  key[1] = tmp.getInt32();
  key[2] = tmp.getInt32();
  key[3] = tmp.getInt32();
  return forge$7.aes._expandKey(key, false);
};
prng_aes.formatSeed = function(seed) {
  var tmp = new forge$7.util.ByteStringBuffer(seed);
  seed = new Array(4);
  seed[0] = tmp.getInt32();
  seed[1] = tmp.getInt32();
  seed[2] = tmp.getInt32();
  seed[3] = tmp.getInt32();
  return seed;
};
prng_aes.cipher = function(key, seed) {
  forge$7.aes._updateBlock(key, seed, _prng_aes_output, false);
  _prng_aes_buffer.putInt32(_prng_aes_output[0]);
  _prng_aes_buffer.putInt32(_prng_aes_output[1]);
  _prng_aes_buffer.putInt32(_prng_aes_output[2]);
  _prng_aes_buffer.putInt32(_prng_aes_output[3]);
  return _prng_aes_buffer.getBytes();
};
prng_aes.increment = function(seed) {
  ++seed[3];
  return seed;
};
prng_aes.md = forge$7.md.sha256;
function spawnPrng() {
  var ctx = forge$7.prng.create(prng_aes);
  ctx.getBytes = function(count, callback) {
    return ctx.generate(count, callback);
  };
  return ctx;
}
var _ctx = spawnPrng();
forge$7.random = _ctx;
forge$7.random.createInstance = spawnPrng;

var forge$6 = forge$g;



var pkcs1 = forge$6.pkcs1 = forge$6.pkcs1 || {};
pkcs1.encode_rsa_oaep = function(key, message, options) {
  var label;
  var seed;
  var md;
  var mgf1Md;
  label = options.label || void 0;
  seed = options.seed || void 0;
  md = options.md;
  md.start();
  mgf1Md = md;
  var keyLength = Math.ceil(key.n.bitLength() / 8);
  var maxLength = keyLength - 2 * md.digestLength - 2;
  if (!label) {
    label = "";
  }
  md.update(label, "raw");
  var lHash = md.digest();
  var PS = "";
  var PS_length = maxLength - message.length;
  for (var i = 0; i < PS_length; i++) {
    PS += "\0";
  }
  var DB = lHash.getBytes() + PS + "" + message;
  if (!seed) {
    seed = forge$6.random.getBytes(md.digestLength);
  }
  var dbMask = rsa_mgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
  var maskedDB = forge$6.util.xorBytes(DB, dbMask, DB.length);
  var seedMask = rsa_mgf1(maskedDB, md.digestLength, mgf1Md);
  var maskedSeed = forge$6.util.xorBytes(seed, seedMask, seed.length);
  return "\0" + maskedSeed + maskedDB;
};
function rsa_mgf1(seed, maskLength, hash) {
  var t = "";
  var count = Math.ceil(maskLength / hash.digestLength);
  for (var i = 0; i < count; ++i) {
    var c = String.fromCharCode(
      i >> 24 & 255,
      i >> 16 & 255,
      i >> 8 & 255,
      i & 255
    );
    hash.start();
    hash.update(seed + c);
    t += hash.digest().getBytes();
  }
  return t.substring(0, maskLength);
}

var forge$5 = forge$g;
forge$5.pki = forge$5.pki || {};
var oids = forge$5.pki.oids = forge$5.oids = forge$5.oids || {};
function _IN(id, name) {
  oids[id] = name;
  oids[name] = id;
}
_IN("1.2.840.113549.1.1.1", "rsaEncryption");

var forge$4 = forge$g;


var asn1$2 = forge$4.asn1 = forge$4.asn1 || {};
asn1$2.Class = {
  UNIVERSAL: 0,
  APPLICATION: 64,
  CONTEXT_SPECIFIC: 128,
  PRIVATE: 192
};
asn1$2.Type = {
  NONE: 0,
  BOOLEAN: 1,
  INTEGER: 2,
  BITSTRING: 3,
  OCTETSTRING: 4,
  NULL: 5,
  OID: 6,
  ODESC: 7,
  EXTERNAL: 8,
  REAL: 9,
  ENUMERATED: 10,
  EMBEDDED: 11,
  UTF8: 12,
  ROID: 13,
  SEQUENCE: 16,
  SET: 17,
  PRINTABLESTRING: 19,
  IA5STRING: 22,
  UTCTIME: 23,
  GENERALIZEDTIME: 24,
  BMPSTRING: 30
};
asn1$2.create = function(tagClass, type, constructed, value, options) {
  if (forge$4.util.isArray(value)) {
    var tmp = [];
    for (var i = 0; i < value.length; ++i) {
      if (value[i] !== void 0) {
        tmp.push(value[i]);
      }
    }
    value = tmp;
  }
  var obj = {
    tagClass,
    type,
    constructed,
    // composed: constructed || forge.util.isArray(value),
    value
  };
  if (options && "bitStringContents" in options) {
    obj.bitStringContents = options.bitStringContents;
  }
  return obj;
};
var _getValueLength = function(bytes) {
  var b2 = bytes.getByte();
  var length;
  var longForm = b2 & 128;
  if (!longForm) {
    length = b2;
  } else {
    var longFormBytes = b2 & 127;
    length = bytes.getInt(longFormBytes << 3);
  }
  return length;
};
asn1$2.fromDer = function(bytes) {
  const options = {
    strict: true,
    decodeBitStrings: true
  };
  bytes = new forge$4.util.ByteStringBuffer(bytes);
  var value = _fromDer(bytes, 0, options);
  return value;
};
function _fromDer(bytes, depth, options) {
  var start;
  var b1 = bytes.getByte();
  var tagClass = b1 & 192;
  var type = b1 & 31;
  start = bytes.length();
  var length = _getValueLength(bytes);
  var value;
  var bitStringContents;
  var constructed = (b1 & 32) === 32;
  if (constructed) {
    value = [];
    while (length > 0) {
      start = bytes.length();
      value.push(_fromDer(bytes, depth + 1, options));
      length -= start - bytes.length();
    }
  }
  if (value === void 0 && tagClass === asn1$2.Class.UNIVERSAL && type === asn1$2.Type.BITSTRING) {
    bitStringContents = bytes.bytes(length);
  }
  if (value === void 0 && options.decodeBitStrings && tagClass === asn1$2.Class.UNIVERSAL && // FIXME: OCTET STRINGs not yet supported here
  // .. other parts of forge expect to decode OCTET STRINGs manually
  type === asn1$2.Type.BITSTRING && length > 1) {
    var unused = 0;
    if (type === asn1$2.Type.BITSTRING) {
      unused = bytes.getByte();
    }
    if (unused === 0) {
      start = bytes.length();
      var subOptions = {
        // enforce strict mode to avoid parsing ASN.1 from plain data
        strict: true,
        decodeBitStrings: true
      };
      var composed = _fromDer(bytes, depth + 1, subOptions);
      var used = start - bytes.length();
      if (type == asn1$2.Type.BITSTRING) {
        used++;
      }
      if (used === length) {
        value = [composed];
      }
    }
  }
  if (value === void 0) {
    value = bytes.getBytes(length);
  }
  var asn1Options = bitStringContents === void 0 ? null : {
    bitStringContents
  };
  return asn1$2.create(tagClass, type, constructed, value, asn1Options);
}
asn1$2.derToOid = function(bytes) {
  var oid;
  if (typeof bytes === "string") {
    bytes = new forge$4.util.ByteStringBuffer(bytes);
  }
  var b = bytes.getByte();
  oid = Math.floor(b / 40) + "." + b % 40;
  var value = 0;
  while (bytes.length() > 0) {
    b = bytes.getByte();
    value = value << 7;
    if (b & 128) {
      value += b & 127;
    } else {
      oid += "." + (value + b);
      value = 0;
    }
  }
  return oid;
};
asn1$2.validate = function(obj, v, capture, errors) {
  var rval = false;
  if (obj.tagClass === v.tagClass && obj.type === v.type && obj.constructed === v.constructed) {
    rval = true;
    if (v.value && forge$4.util.isArray(v.value)) {
      var j = 0;
      for (var i = 0; rval && i < v.value.length; ++i) {
        rval = v.value[i].optional || false;
        if (obj.value[j]) {
          rval = asn1$2.validate(obj.value[j], v.value[i], capture, errors);
          ++j;
        }
      }
    }
    if (rval && capture) {
      if (v.capture) {
        capture[v.capture] = obj.value;
      }
      if (v.captureAsn1) {
        capture[v.captureAsn1] = obj;
      }
    }
  }
  return rval;
};

var forge$3 = forge$g;
forge$3.jsbn = forge$3.jsbn || {};
var dbits = 28;
var BI_FP = 52;
function nbv(i) {
  var r = nbi();
  r.fromInt(i);
  return r;
}
let BigInteger$1 = class BigInteger {
  data = [];
  DB = dbits;
  DM = (1 << dbits) - 1;
  DV = 1 << dbits;
  FV = Math.pow(2, BI_FP);
  F1 = BI_FP - dbits;
  F2 = 2 * dbits - BI_FP;
  constructor(a, b) {
    if (a != null) {
      this.fromString(a, b);
    }
  }
  am(i, x, w, j, c, n) {
    var xl = x & 16383, xh = x >> 14;
    while (--n >= 0) {
      var l = this.data[i] & 16383;
      var h = this.data[i++] >> 14;
      var m = xh * l + h * xl;
      l = xl * l + ((m & 16383) << 14) + w.data[j] + c;
      c = (l >> 28) + (m >> 14) + xh * h;
      w.data[j++] = l & 268435455;
    }
    return c;
  }
  // (public) return the number of bits in "this"
  bitLength() {
    return this.DB * (this.t - 1) + nbits(this.data[this.t - 1] ^ this.s & this.DM);
  }
  // (protected) r = this << n*DB
  dlShiftTo(n, r) {
    var i;
    for (i = this.t - 1; i >= 0; --i) r.data[i + n] = this.data[i];
    for (i = n - 1; i >= 0; --i) r.data[i] = 0;
    r.t = this.t + n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  drShiftTo(n, r) {
    for (var i = n; i < this.t; ++i) r.data[i - n] = this.data[i];
    r.t = Math.max(this.t - n, 0);
    r.s = this.s;
  }
  // (protected) r = this << n
  lShiftTo(n, r) {
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << cbs) - 1;
    var ds = Math.floor(n / this.DB), c = this.s << bs & this.DM, i;
    for (i = this.t - 1; i >= 0; --i) {
      r.data[i + ds + 1] = this.data[i] >> cbs | c;
      c = (this.data[i] & bm) << bs;
    }
    r.data[ds] = c;
    r.t = this.t + ds + 1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  rShiftTo(n, r) {
    r.s = this.s;
    var ds = Math.floor(n / this.DB);
    var bs = n % this.DB;
    var cbs = this.DB - bs;
    var bm = (1 << bs) - 1;
    r.data[0] = this.data[ds] >> bs;
    for (var i = ds + 1; i < this.t; ++i) {
      r.data[i - ds - 1] |= (this.data[i] & bm) << cbs;
      r.data[i - ds] = this.data[i] >> bs;
    }
    if (bs > 0) r.data[this.t - ds - 1] |= (this.s & bm) << cbs;
    r.t = this.t - ds;
    r.clamp();
  }
  // (protected) r = this - a
  subTo(a, r) {
    var i = 0, c = 0, m = Math.min(a.t, this.t);
    while (i < m) {
      c += this.data[i] - a.data[i];
      r.data[i++] = c & this.DM;
      c >>= this.DB;
    }
    c -= a.s;
    while (i < this.t) {
      c += this.data[i];
      r.data[i++] = c & this.DM;
      c >>= this.DB;
    }
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  multiplyTo(a, r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i + y.t;
    while (--i >= 0) r.data[i] = 0;
    for (i = 0; i < y.t; ++i) r.data[i + x.t] = x.am(0, y.data[i], r, i, 0, x.t);
    r.s = 0;
    r.clamp();
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  squareTo(r) {
    var x = this.abs();
    var i = r.t = 2 * x.t;
    while (--i >= 0) r.data[i] = 0;
    for (i = 0; i < x.t - 1; ++i) {
      var c = x.am(i, x.data[i], r, 2 * i, 0, 1);
      if ((r.data[i + x.t] += x.am(
        i + 1,
        2 * x.data[i],
        r,
        2 * i + 1,
        c,
        x.t - i - 1
      )) >= x.DV) {
        r.data[i + x.t] -= x.DV;
        r.data[i + x.t + 1] = 1;
      }
    }
    if (r.t > 0) r.data[r.t - 1] += x.am(i, x.data[i], r, 2 * i, 0, 1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  divRemTo(m, q, r) {
    var pm = m.abs();
    var pt = this.abs();
    var y = nbi();
    var nsh = this.DB - nbits(pm.data[pm.t - 1]);
    pm.lShiftTo(nsh, y);
    pt.lShiftTo(nsh, r);
    var ys = y.t;
    var y0 = y.data[ys - 1];
    var yt = y0 * (1 << this.F1) + (y.data[ys - 2] >> this.F2);
    var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
    var i = r.t, j = i - ys, t = nbi();
    y.dlShiftTo(j, t);
    BigInteger.ONE.dlShiftTo(ys, t);
    t.subTo(y, y);
    while (--j >= 0) {
      --i;
      var qd = Math.floor(r.data[i] * d1 + (r.data[i - 1] + e) * d2);
      r.data[i] += y.am(0, qd, r, j, 0, ys);
    }
    r.t = ys;
    r.clamp();
    if (nsh > 0) r.rShiftTo(nsh, r);
  }
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  invDigit() {
    var x = this.data[0];
    var y = x & 3;
    y = y * (2 - (x & 15) * y) & 15;
    y = y * (2 - (x & 255) * y) & 255;
    y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
    y = y * (2 - x * y % this.DV) % this.DV;
    return -y;
  }
  // (protected) copy this to r
  copyTo(r) {
    for (var i = this.t - 1; i >= 0; --i) r.data[i] = this.data[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  fromInt(x) {
    this.t = 1;
    this.s = 0;
    if (x > 0) this.data[0] = x;
    else this.t = 0;
  }
  // (protected) set from string and radix
  fromString(s, b) {
    var k;
    k = 4;
    this.t = 0;
    this.s = 0;
    var i = s.length, sh = 0;
    while (--i >= 0) {
      var x = intAt(s, i);
      if (sh == 0) this.data[this.t++] = x;
      else this.data[this.t - 1] |= x << sh;
      sh += k;
      if (sh >= this.DB) sh -= this.DB;
    }
    this.clamp();
  }
  // (protected) clamp off excess high words
  clamp() {
    var c = this.s & this.DM;
    while (this.t > 0 && this.data[this.t - 1] == c) --this.t;
  }
  // (public) return string representation in given radix
  toString(b) {
    var k;
    k = 4;
    var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
    var p = this.DB - i * this.DB % k;
    if (i-- > 0) {
      while (i >= 0) {
        d = this.data[i] >> (p -= k) & km;
        if (p <= 0) {
          p += this.DB;
          --i;
        }
        if (d > 0) m = true;
        if (m) r += int2char(d);
      }
    }
    return r;
  }
  // (public) |this|
  abs() {
    return this;
  }
  //(public) this^e % m (HAC 14.85)
  modPow(e, m) {
    var i = e.bitLength(), k, r = nbv(1), z;
    k = 1;
    z = new Montgomery(m);
    var g = new Array(), n = 3, k1 = k - 1, km = (1 << k) - 1;
    g[1] = z.convert(this);
    var j = e.t - 1, w, is1 = true, r2 = nbi(), t;
    i = nbits(e.data[j]) - 1;
    while (j >= 0) {
      w = e.data[j] >> i - k1 & km;
      n = k;
      if ((i -= n) < 0) {
        i += this.DB;
        --j;
      }
      if (is1) {
        g[w].copyTo(r);
        is1 = false;
      } else {
        z.sqrTo(r, r2);
        z.mulTo(r2, g[w], r);
      }
      while (j >= 0 && (e.data[j] & 1 << i) == 0) {
        z.sqrTo(r, r2);
        t = r;
        r = r2;
        r2 = t;
        i--;
      }
    }
    return z.revert(r);
  }
};
forge$3.jsbn.BigInteger = BigInteger$1;
function nbi() {
  return new BigInteger$1(null);
}
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr, vv;
rr = "0".charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
function int2char(n) {
  return BI_RM.charAt(n);
}
function intAt(s, i) {
  var c = BI_RC[s.charCodeAt(i)];
  return c;
}
function nbits(x) {
  var r = 1, t;
  if ((t = x >>> 16) != 0) {
    x = t;
    r += 16;
  }
  if ((t = x >> 2) != 0) {
    x = t;
    r += 2;
  }
  if ((t = x >> 1) != 0) {
    x = t;
    r += 1;
  }
  return r;
}
class Montgomery {
  constructor(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp & 32767;
    this.mph = this.mp >> 15;
    this.um = (1 << m.DB - 15) - 1;
    this.mt2 = 2 * m.t;
  }
  // xR mod m
  convert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t, r);
    r.divRemTo(this.m, null, r);
    return r;
  }
  // x/R mod m
  revert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  reduce(x) {
    while (x.t <= this.mt2)
      x.data[x.t++] = 0;
    for (var i = 0; i < this.m.t; ++i) {
      var j = x.data[i] & 32767;
      var u0 = j * this.mpl + ((j * this.mph + (x.data[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
      j = i + this.m.t;
      x.data[j] += this.m.am(0, u0, x, i, 0, this.m.t);
    }
    x.clamp();
    x.drShiftTo(this.m.t, x);
  }
  // r = "x^2/R mod m"; x != r
  sqrTo(x, r) {
    x.squareTo(r);
    this.reduce(r);
  }
  // r = "xy/R mod m"; x,y != r
  mulTo(x, y, r) {
    x.multiplyTo(y, r);
    this.reduce(r);
  }
}
BigInteger$1.ONE = nbv(1);

var forge$2 = forge$g;

if (typeof BigInteger === "undefined") {
  var BigInteger = forge$2.jsbn.BigInteger;
}
var asn1$1 = forge$2.asn1;
forge$2.pki.rsa = forge$2.rsa = forge$2.rsa || {};
var pki$1 = forge$2.pki;
var rsaPublicKeyValidator = {
  // RSAPublicKey
  name: "RSAPublicKey",
  tagClass: asn1$1.Class.UNIVERSAL,
  type: asn1$1.Type.SEQUENCE,
  constructed: true,
  value: [{
    // modulus (n)
    // name: 'RSAPublicKey.modulus',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.INTEGER,
    constructed: false,
    capture: "publicKeyModulus"
  }, {
    // publicExponent (e)
    // name: 'RSAPublicKey.exponent',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.INTEGER,
    constructed: false,
    capture: "publicKeyExponent"
  }]
};
var publicKeyValidator = forge$2.pki.rsa.publicKeyValidator = {
  // name: 'SubjectPublicKeyInfo',
  tagClass: asn1$1.Class.UNIVERSAL,
  type: asn1$1.Type.SEQUENCE,
  constructed: true,
  // captureAsn1: 'subjectPublicKeyInfo',
  value: [{
    // name: 'SubjectPublicKeyInfo.AlgorithmIdentifier',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.SEQUENCE,
    constructed: true
    // value: [{
    //   // name: 'AlgorithmIdentifier.algorithm',
    //   tagClass: asn1.Class.UNIVERSAL,
    //   type: asn1.Type.OID,
    //   constructed: false,
    //   // capture: 'publicKeyOid'
    // }]
  }, {
    // subjectPublicKey
    // name: 'SubjectPublicKeyInfo.subjectPublicKey',
    tagClass: asn1$1.Class.UNIVERSAL,
    type: asn1$1.Type.BITSTRING,
    constructed: false,
    value: [{
      // RSAPublicKey
      // name: 'SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey',
      tagClass: asn1$1.Class.UNIVERSAL,
      type: asn1$1.Type.SEQUENCE,
      constructed: true,
      optional: true,
      captureAsn1: "rsaPublicKey"
    }]
  }]
};
var _modPow = function(x, key, pub) {
  return x.modPow(key.e, key.n);
};
pki$1.rsa.encrypt = function(m, key, bt) {
  var eb;
  var k = Math.ceil(key.n.bitLength() / 8);
  eb = new forge$2.util.ByteStringBuffer();
  eb.putBytes(m);
  var x = new BigInteger(eb.toHex(), 16);
  var y = _modPow(x, key);
  var yhex = y.toString(16);
  const ab = new ArrayBuffer(k);
  const u8a = new Uint8Array(ab);
  var zeros = k - Math.ceil(yhex.length / 2);
  const prependedLength = zeros;
  while (zeros > 0) {
    u8a[prependedLength - zeros] = 0;
    --zeros;
  }
  var i = 0;
  if (yhex.length & true) {
    i = 1;
    u8a[prependedLength] = parseInt(yhex[0], 16);
  }
  for (; i < yhex.length; i += 2) {
    u8a[prependedLength + Math.ceil(i / 2)] = parseInt(yhex.substr(i, 2), 16);
  }
  return ab;
};
pki$1.setRsaPublicKey = function(n, e) {
  var key = {
    n,
    e
  };
  key.encrypt = function(data, scheme, schemeOptions) {
    var e2 = forge$2.pkcs1.encode_rsa_oaep(key, data, schemeOptions);
    return pki$1.rsa.encrypt(e2, key, true);
  };
  return key;
};
pki$1.publicKeyFromAsn1 = function(obj) {
  console.log("obj", obj);
  var capture = {};
  var errors = [];
  if (asn1$1.validate(obj, publicKeyValidator, capture, errors)) {
    obj = capture.rsaPublicKey;
  }
  console.log("capture", capture);
  errors = [];
  capture = {};
  asn1$1.validate(obj, rsaPublicKeyValidator, capture, errors);
  console.log("capture", capture);
  var n = new forge$2.util.ByteStringBuffer(capture.publicKeyModulus).toHex();
  var e = new forge$2.util.ByteStringBuffer(capture.publicKeyExponent).toHex();
  return pki$1.setRsaPublicKey(
    new BigInteger(n, 16),
    new BigInteger(e, 16)
  );
};

var forge$1 = forge$g;
var asn1 = forge$1.asn1;
var pki = forge$1.pki;
pki.publicKeyFromPem = function(pem) {
  var body = forge$1.pem.decode(pem);
  var obj = asn1.fromDer(body);
  return pki.publicKeyFromAsn1(obj);
};

var lib = forge$g;

var forge = /*@__PURE__*/getDefaultExportFromCjs(lib);

async function test() {
  const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAix682LW8jwpZEGjFfoom
GvLHCDh8ttPgSB5CBvXZLglimVfVkA7FiGdJqlKkf2kKXqrwSICbgcYUjFHMFdy9
fvUwrKXzFXP46AzzV3ivkam2LB97eDSMI8gaIjumDaIFZAD3E9osYz4LMSI2A0nC
qs+5xZ66JeC/Dtr5W9nobushAhFzZQWS/4I7iSUkV4WFmSG1ACB267z8YZ7YFmlT
1hMFvp+biIsZIx7mebQNqjFjFPP0ZTskXg4UfQt6yyuaPqL55pQ7Wc8iI3umlsSV
hDL1q3+ry7L8VDg7EtDBbodyYT5R62zBuhe7sJrvhtt/R6fZIfISPvRbumwusbf5
XQIDAQAB
-----END PUBLIC KEY-----
`;
  const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCLHrzYtbyPClkQ
aMV+iiYa8scIOHy20+BIHkIG9dkuCWKZV9WQDsWIZ0mqUqR/aQpeqvBIgJuBxhSM
UcwV3L1+9TCspfMVc/joDPNXeK+RqbYsH3t4NIwjyBoiO6YNogVkAPcT2ixjPgsx
IjYDScKqz7nFnrol4L8O2vlb2ehu6yECEXNlBZL/gjuJJSRXhYWZIbUAIHbrvPxh
ntgWaVPWEwW+n5uIixkjHuZ5tA2qMWMU8/RlOyReDhR9C3rLK5o+ovnmlDtZzyIj
e6aWxJWEMvWrf6vLsvxUODsS0MFuh3JhPlHrbMG6F7uwmu+G239Hp9kh8hI+9Fu6
bC6xt/ldAgMBAAECggEABMjYQf68FFJM3lowF/Tshbw9mUbcuSqfxHMv86PUZeIs
6desu1vasiEqlijp9IzPrmekGbuR6Dxq+/7F1/xOaGr1KIGQ6DcObif13YIDzcIV
BxRHxN+lGzJC/dQ91tWwkvAlOeGkvv6vrVn/GrgDHH3w5mmZ/s/+2iYF8ev/CQN6
/2t68F7OGx93IwQZnet1L/fDEJbvpKNlc9FOHz9fDeh769RzMxD/QJsiV6zcJuFX
p0EFrQflFQ51sP9jKLpXgK6kKH3ugveQL0fhKHDmNFKUpz9BX2WRZh+3ix1XNk5M
Ppyhg/oeKXvphtubUEZfZRXYBLmACMqVw9ta94n5YQKBgQC/jhESKALWLl7Oc08m
GyQA03z3j3/JNaqXALSRcND38j/mpR+abI9ANDV7njwO8jtrqfXIBTGna9sqOoey
XAnLsvFkB1ndGcz7rcKi6A1CAFcEN7J6E0iePhC1HKqoY7qPMi1HLsyIKctEo20A
J7UNNSylVbUi084Dt6jTo2LPIQKBgQC57KUbHDI557km5RoisVwjyucANDs5oicr
vaSXjDhgvf0b07D5ElhSeJyzLp/LydwasUnYNM/S6az1BFSI5sAtcGiecQ36FXus
UnyWWB1B3bTa/hYPqFAT+QIIRqIqdcg8ARcaoDJgjESDYdG8Yz8N48+Dp98R22Qk
1KU4XolOvQKBgQCP7tPs7JuVDCq4vfQPEf2vkTopWm4OZoDUDfegAUFDzYcua4yf
oErTV2eIh5FhOapkb8T6ksyInIaF6Izl/DpwEPlIzC098ZEQ27OQbQTpPxAjXyaA
i9TY8pHjRLMG7EjWKEHVZtjQx3axEItqvmtQjVAKu6frj3MRYAM/Y1lvgQKBgFk9
1m4x1YXnzP53X1khqqlffguiBn9+brDXIUbAvlrpNrGBpeOXw58qV4TGL1tg8+44
BMrrZonFMgiVYIIpyDrHRuAuQdg1MZygJz7+4mQ4J9Qpu6seTfmYPzp7tOEOkeMD
XvSfyi5/hW9Op552QNDI9VUrYa4vkV0AWKG69ss9AoGAZYuK/nbQv81+AExY2vr7
KaO+FLoszYHNiFbwvjt0e10a2X4wdVrUqiiT4gujrpQEWJigrNjbAmstmjDE1zgW
VxnzlrCOTTZT7/jD4wf53nCQiqRCg2NsIq6/JYOi+tjr6dC8HA8pd58xYAkB+hbZ
wIy0/kd6szCcWK5Ld1kH9R0=
-----END PRIVATE KEY-----
`;
  const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY);
  function byteStringToBuffer(str) {
    const { length } = str;
    const u8a = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      u8a[i] = str.charCodeAt(i);
    }
    return u8a;
  }
  function importDecryptKey(pem, sha) {
    pem = pem.replace(/(-----(BEGIN|END) PRIVATE KEY-----|\s)/g, "");
    const publicKey2 = byteStringToBuffer(atob(pem));
    return crypto.subtle.importKey(
      "pkcs8",
      publicKey2,
      {
        name: "RSA-OAEP",
        hash: sha
      },
      false,
      [
        "decrypt"
      ]
    );
  }
  async function decrypt(encryptedData2, hash) {
    const privateKey = await importDecryptKey(PRIVATE_KEY, hash);
    const decryptedData2 = new TextDecoder().decode(await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedData2
    ));
    return decryptedData2;
  }
  const data = "Hello World!";
  let encryptedData = publicKey.encrypt(data, "RSA-OAEP", {
    md: forge.md.sha1.create()
  });
  let decryptedData = await decrypt(encryptedData, "SHA-1");
  console.log(data === decryptedData);
  encryptedData = publicKey.encrypt(data, "RSA-OAEP", {
    md: forge.md.sha256.create()
  });
  decryptedData = await decrypt(encryptedData, "SHA-256");
  console.log(data === decryptedData);
  encryptedData = publicKey.encrypt(data, "RSA-OAEP", {
    md: forge.md.sha384.create()
  });
  decryptedData = await decrypt(encryptedData, "SHA-384");
  console.log(data === decryptedData);
  encryptedData = publicKey.encrypt(data, "RSA-OAEP", {
    md: forge.md.sha512.create()
  });
  decryptedData = await decrypt(encryptedData, "SHA-512");
  console.log(data === decryptedData);
  encryptedData = new Uint8Array([56, 93, 67, 144, 199, 15, 51, 59, 195, 151, 19, 88, 76, 197, 92, 182, 3, 145, 173, 168, 158, 221, 96, 144, 138, 111, 31, 7, 99, 8, 79, 122, 163, 228, 184, 136, 235, 150, 136, 47, 158, 25, 64, 32, 174, 24, 237, 203, 129, 181, 171, 184, 141, 249, 250, 179, 74, 74, 210, 8, 159, 27, 134, 5, 137, 34, 200, 196, 82, 237, 211, 91, 14, 77, 77, 237, 123, 143, 141, 7, 10, 61, 8, 240, 179, 162, 44, 66, 178, 151, 59, 199, 222, 242, 71, 132, 227, 240, 108, 37, 55, 39, 11, 252, 26, 134, 97, 239, 103, 89, 253, 79, 149, 9, 198, 70, 20, 179, 89, 230, 50, 6, 147, 106, 231, 118, 225, 116, 203, 203, 185, 86, 22, 31, 233, 72, 123, 196, 54, 134, 200, 65, 98, 101, 57, 232, 105, 237, 4, 147, 135, 195, 124, 241, 62, 52, 195, 23, 47, 180, 145, 79, 196, 156, 160, 62, 28, 78, 38, 57, 18, 174, 19, 152, 235, 90, 164, 154, 247, 225, 25, 236, 203, 87, 223, 121, 20, 70, 80, 47, 181, 158, 109, 19, 172, 236, 58, 0, 25, 175, 82, 195, 161, 146, 252, 133, 209, 242, 55, 111, 155, 172, 57, 204, 234, 145, 13, 221, 225, 38, 203, 151, 4, 38, 190, 238, 10, 132, 165, 117, 28, 204, 129, 110, 123, 121, 188, 126, 91, 53, 84, 180, 176, 156, 159, 232, 108, 196, 79, 208, 194, 228, 34, 115, 234, 109]);
  decryptedData = await decrypt(encryptedData, "SHA-1");
  console.log(data === decryptedData);
}
(async () => {
  for (let index = 0; index < 10; index++) {
    await test();
  }
})();
