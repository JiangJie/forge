/**
 * An API for getting cryptographically-secure random bytes. The bytes are
 * generated using the Fortuna algorithm devised by Bruce Schneier and
 * Niels Ferguson.
 *
 * Getting strong random bytes is not yet easy to do in javascript. The only
 * truish random entropy that can be collected is from the mouse, keyboard, or
 * from timing with respect to page loads, etc. This generator makes a poor
 * attempt at providing random bytes when those sources haven't yet provided
 * enough entropy to initially seed or to reseed the PRNG.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2009-2014 Digital Bazaar, Inc.
 */
var forge = require('./forge');
require('./aes');
require('./sha256');
require('./prng');
require('./util');

// the default prng plugin, uses AES-128
var prng_aes = {};
var _prng_aes_output = new Array(4);
var _prng_aes_buffer = new forge.util.ByteStringBuffer();
prng_aes.formatKey = function (key) {
  // convert the key into 32-bit integers
  var tmp = new forge.util.ByteStringBuffer(key);
  key = new Array(4);
  key[0] = tmp.getInt32();
  key[1] = tmp.getInt32();
  key[2] = tmp.getInt32();
  key[3] = tmp.getInt32();

  // return the expanded key
  return forge.aes._expandKey(key, false);
};
prng_aes.formatSeed = function (seed) {
  // convert seed into 32-bit integers
  var tmp = new forge.util.ByteStringBuffer(seed);
  seed = new Array(4);
  seed[0] = tmp.getInt32();
  seed[1] = tmp.getInt32();
  seed[2] = tmp.getInt32();
  seed[3] = tmp.getInt32();
  return seed;
};
prng_aes.cipher = function (key, seed) {
  forge.aes._updateBlock(key, seed, _prng_aes_output, false);
  _prng_aes_buffer.putInt32(_prng_aes_output[0]);
  _prng_aes_buffer.putInt32(_prng_aes_output[1]);
  _prng_aes_buffer.putInt32(_prng_aes_output[2]);
  _prng_aes_buffer.putInt32(_prng_aes_output[3]);
  return _prng_aes_buffer.getBytes();
};
prng_aes.increment = function (seed) {
  // FIXME: do we care about carry or signed issues?
  ++seed[3];
  return seed;
};
prng_aes.md = forge.md.sha256;

/**
 * Creates a new PRNG.
 */
function spawnPrng() {
  var ctx = forge.prng.create(prng_aes);

  /**
   * Gets random bytes. If a native secure crypto API is unavailable, this
   * method tries to make the bytes more unpredictable by drawing from data that
   * can be collected from the user of the browser, eg: mouse movement.
   *
   * If a callback is given, this method will be called asynchronously.
   *
   * @param count the number of random bytes to get.
   * @param [callback(err, bytes)] called once the operation completes.
   *
   * @return the random bytes in a string.
   */
  ctx.getBytes = function (count, callback) {
    return ctx.generate(count, callback);
  };

  return ctx;
}

// create default prng context
var _ctx = spawnPrng();

/* Random API */
forge.random = _ctx;

// expose spawn PRNG
forge.random.createInstance = spawnPrng;

module.exports = forge.random;
