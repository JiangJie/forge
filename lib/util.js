/**
 * Utility functions for web applications.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2018 Digital Bazaar, Inc.
 */
var forge = require('./forge');

/* Utilities API */
var util = module.exports = forge.util = forge.util || {};

// define isArray
util.isArray = Array.isArray;

/** Buffer w/BinaryString backing */

/**
 * Constructor for a binary string backed byte buffer.
 *
 * @param [b] the bytes to wrap (either encoded as string, one byte per
 *          character, or as an ArrayBuffer or Typed Array).
 */
class ByteStringBuffer {
  // used for v8 optimization
  _constructedStringLength = 0;

  data = '';
  read = 0;

  constructor(b) {
    if (typeof b === 'string') {
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
      String.fromCharCode(i >> 24 & 0xFF) +
      String.fromCharCode(i >> 16 & 0xFF) +
      String.fromCharCode(i >> 8 & 0xFF) +
      String.fromCharCode(i & 0xFF));
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
    var rval = (
      this.data.charCodeAt(this.read) << 24 ^
      this.data.charCodeAt(this.read + 1) << 16 ^
      this.data.charCodeAt(this.read + 2) << 8 ^
      this.data.charCodeAt(this.read + 3));
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
      // TODO: Use (rval * 0x100) if adding support for 33 to 53 bits.
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
      // read count bytes
      count = Math.min(this.length(), count);
      rval = this.data.slice(this.read, this.read + count);
      this.read += count;
    } else if (count === 0) {
      rval = '';
    } else {
      // read all bytes, optimize to only copy when needed
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
    return (typeof (count) === 'undefined' ?
      this.data.slice(this.read) :
      this.data.slice(this.read, this.read + count));
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
    this.data = '';
    this.read = 0;
    return this;
  }

  /**
   * Converts this buffer to a hexadecimal string.
   *
   * @return a hexadecimal string.
   */
  toHex() {
    var rval = '';
    for (var i = this.read; i < this.data.length; ++i) {
      var b = this.data.charCodeAt(i);
      if (b < 16) {
        rval += '0';
      }
      rval += b.toString(16);
    }
    return rval;
  }
}

util.ByteStringBuffer = ByteStringBuffer;

/** End Buffer w/UInt8Array backing */

/**
 * Fills a string with a particular value. If you want the string to be a byte
 * string, pass in String.fromCharCode(theByte).
 *
 * @param c the character to fill the string with, use String.fromCharCode
 *          to fill the string with a byte value.
 * @param n the number of characters of value c to fill with.
 *
 * @return the filled string.
 */
util.fillString = function (c, n) {
  var s = '';
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

/**
 * Performs a per byte XOR between two byte strings and returns the result as a
 * string of bytes.
 *
 * @param s1 first string of bytes.
 * @param s2 second string of bytes.
 * @param n the number of bytes to XOR.
 *
 * @return the XOR'd result.
 */
util.xorBytes = function (s1, s2, n) {
  var s3 = '';
  var b = 0;
  var t = '';
  var i = 0;
  var c = 0;
  for (; n > 0; --n, ++i) {
    b = s1.charCodeAt(i) ^ s2.charCodeAt(i);
    if (c >= 10) {
      s3 += t;
      t = '';
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
  62, -1, -1, -1, 63,

  /*'0','1','2','3','4','5','6','7','8','9' */
  52, 53, 54, 55, 56, 57, 58, 59, 60, 61,

  /*15, 16, 17,'=', 19, 20, 21 */
  -1, -1, -1, 64, -1, -1, -1,

  /*65 - 43 = 22*/
  /*'A','B','C','D','E','F','G','H','I','J','K','L','M', */
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,

  /*'N','O','P','Q','R','S','T','U','V','W','X','Y','Z' */
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,

  /*91 - 43 = 48 */
  /*48, 49, 50, 51, 52, 53 */
  -1, -1, -1, -1, -1, -1,

  /*97 - 43 = 54*/
  /*'a','b','c','d','e','f','g','h','i','j','k','l','m' */
  26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,

  /*'n','o','p','q','r','s','t','u','v','w','x','y','z' */
  39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
];

/**
 * Base64 decodes a string into a 'binary' encoded string of bytes.
 *
 * @param input the base64-encoded input.
 *
 * @return the binary encoded string.
 */
util.decode64 = function (input) {
  // TODO: deprecate: "Deprecated. Use util.binary.base64.decode instead."

  // remove all non-base64 characters
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  var output = '';
  var enc1, enc2, enc3, enc4;
  var i = 0;

  while (i < input.length) {
    enc1 = _base64Idx[input.charCodeAt(i++) - 43];
    enc2 = _base64Idx[input.charCodeAt(i++) - 43];
    enc3 = _base64Idx[input.charCodeAt(i++) - 43];
    enc4 = _base64Idx[input.charCodeAt(i++) - 43];

    output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
    if (enc3 !== 64) {
      // decoded at least 2 bytes
      output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
      if (enc4 !== 64) {
        // decoded 3 bytes
        output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
      }
    }
  }

  return output;
};
