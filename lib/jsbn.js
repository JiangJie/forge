// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

/*
Licensing (LICENSE)
-------------------

This software is covered under the following copyright:
*/
/*
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */
/*
Address all questions regarding this license to:

  Tom Wu
  tjw@cs.Stanford.EDU
*/
var forge = require("./forge");

module.exports = forge.jsbn = forge.jsbn || {};

// Bits per digit
var dbits = 28;

var BI_FP = 52;


// return bigint initialized to value
function nbv(i) {
    var r = nbi();
    r.fromInt(i);
    return r;
}

// (public) Constructor
class BigInteger {
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
        var xl = x & 0x3fff,
            xh = x >> 14;
        while (--n >= 0) {
            var l = this.data[i] & 0x3fff;
            var h = this.data[i++] >> 14;
            var m = xh * l + h * xl;
            l = xl * l + ((m & 0x3fff) << 14) + w.data[j] + c;
            c = (l >> 28) + (m >> 14) + xh * h;
            w.data[j++] = l & 0xfffffff;
        }
        return c;
    }

    // (public) return the number of bits in "this"
    bitLength() {
        return (
            this.DB * (this.t - 1) + nbits(this.data[this.t - 1] ^ (this.s & this.DM))
        );
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
        var ds = Math.floor(n / this.DB),
            c = (this.s << bs) & this.DM,
            i;
        for (i = this.t - 1; i >= 0; --i) {
            r.data[i + ds + 1] = (this.data[i] >> cbs) | c;
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
        var i = 0,
            c = 0,
            m = Math.min(a.t, this.t);
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
        var x = this.abs(),
            y = a.abs();
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
        var i = (r.t = 2 * x.t);
        while (--i >= 0) r.data[i] = 0;
        for (i = 0; i < x.t - 1; ++i) {
            var c = x.am(i, x.data[i], r, 2 * i, 0, 1);
            if (
                (r.data[i + x.t] += x.am(
                    i + 1,
                    2 * x.data[i],
                    r,
                    2 * i + 1,
                    c,
                    x.t - i - 1
                )) >= x.DV
            ) {
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
        var y = nbi(),
            ts = this.s,
            ms = m.s;
        var nsh = this.DB - nbits(pm.data[pm.t - 1]); // normalize modulus
        pm.lShiftTo(nsh, y);
        pt.lShiftTo(nsh, r);
        var ys = y.t;
        var y0 = y.data[ys - 1];
        var yt = y0 * (1 << this.F1) + (y.data[ys - 2] >> this.F2);
        var d1 = this.FV / yt,
            d2 = (1 << this.F1) / yt,
            e = 1 << this.F2;
        var i = r.t,
            j = i - ys,
            t = nbi();
        y.dlShiftTo(j, t);
        BigInteger.ONE.dlShiftTo(ys, t);
        t.subTo(y, y); // "negative" y so we can replace sub with am later
        while (--j >= 0) {
            // Estimate quotient digit
            --i;
            var qd = Math.floor(r.data[i] * d1 + (r.data[i - 1] + e) * d2);
            r.data[i] += y.am(0, qd, r, j, 0, ys);
        }
        r.t = ys;
        r.clamp();
        if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
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
        var y = x & 3; // y == 1/x mod 2^2
        y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
        y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
        y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
        // last step - calculate inverse mod DV directly;
        // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
        y = (y * (2 - ((x * y) % this.DV))) % this.DV; // y == 1/x mod 2^dbits
        // we really want the negative inverse, and -DV < y < DV
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
        var i = s.length,
            mi = false,
            sh = 0;
        while (--i >= 0) {
            var x = intAt(s, i);
            mi = false;
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
        var km = (1 << k) - 1,
            d,
            m = false,
            r = "",
            i = this.t;
        var p = this.DB - ((i * this.DB) % k);
        if (i-- > 0) {
            while (i >= 0) {
                d = (this.data[i] >> (p -= k)) & km;
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
        var i = e.bitLength(),
            k,
            r = nbv(1),
            z;
        k = 1;
        z = new Montgomery(m);

        // precomputation
        var g = new Array(),
            n = 3,
            k1 = k - 1,
            km = (1 << k) - 1;
        g[1] = z.convert(this);

        var j = e.t - 1,
            w,
            is1 = true,
            r2 = nbi(),
            t;
        i = nbits(e.data[j]) - 1;
        while (j >= 0) {
            w = (e.data[j] >> (i - k1)) & km;

            n = k;
            if ((i -= n) < 0) {
                i += this.DB;
                --j;
            }
            if (is1) {
                // ret == 1, don't bother squaring or multiplying it
                g[w].copyTo(r);
                is1 = false;
            } else {
                z.sqrTo(r, r2);
                z.mulTo(r2, g[w], r);
            }

            while (j >= 0 && (e.data[j] & (1 << i)) == 0) {
                z.sqrTo(r, r2);
                t = r;
                r = r2;
                r2 = t;
                i--;
            }
        }
        return z.revert(r);
    }
}

forge.jsbn.BigInteger = BigInteger;

// return new, unset BigInteger
function nbi() {
    return new BigInteger(null);
}

// Digit conversions
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

// returns bit length of the integer x
function nbits(x) {
    var r = 1,
        t;
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

// Montgomery reduction
class Montgomery {
    constructor(m) {
        this.m = m;
        this.mp = m.invDigit();
        this.mpl = this.mp & 0x7fff;
        this.mph = this.mp >> 15;
        this.um = (1 << (m.DB - 15)) - 1;
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
            // pad x so am has enough room later
            x.data[x.t++] = 0;
        for (var i = 0; i < this.m.t; ++i) {
            // faster way of calculating u0 = x.data[i]*mp mod DV
            var j = x.data[i] & 0x7fff;
            var u0 =
                (j * this.mpl +
                    (((j * this.mph + (x.data[i] >> 15) * this.mpl) & this.um) << 15)) &
                x.DM;
            // use am to combine the multiply-shift-add into one call
            j = i + this.m.t;
            x.data[j] += this.m.am(0, u0, x, i, 0, this.m.t);
            // propagate carry
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


// "constants"
BigInteger.ONE = nbv(1);

// jsbn2 lib

//Copyright (c) 2005-2009  Tom Wu
//All Rights Reserved.
//See "LICENSE" for details (See jsbn.js for LICENSE).

//Extended JavaScript BN functions, required for RSA private ops.

//Version 1.1: new BigInteger("0", 10) returns "proper" zero

//BigInteger interfaces not implemented in jsbn:

//BigInteger(int signum, byte[] magnitude)
//double doubleValue()
//float floatValue()
//int hashCode()
//long longValue()
//static BigInteger valueOf(long val)
