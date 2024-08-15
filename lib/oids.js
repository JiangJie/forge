/**
 * Object IDs for ASN.1.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2013 Digital Bazaar, Inc.
 */
var forge = require('./forge');

forge.pki = forge.pki || {};
var oids = module.exports = forge.pki.oids = forge.oids = forge.oids || {};

// set id to name mapping and name to id mapping
function _IN(id, name) {
  oids[id] = name;
  oids[name] = id;
}

// algorithm OIDs
_IN('1.2.840.113549.1.1.1', 'rsaEncryption');
