"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.stringify = exports._stringify = void 0;
const SAFE_CHARS = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$._-';
const SAFE_CHARS_REGEX = new RegExp(`^[${SAFE_CHARS}]+$`);
const SAFE_CHARS_SET = new Set(SAFE_CHARS.split('').map((c) => c.charCodeAt(0)));
function escapeNonWordChars(val) {
    // All chars other than word chars are percent encoded
    return Array.from(new TextEncoder().encode(val))
        .map((code) => SAFE_CHARS_SET.has(code) ? String.fromCharCode(code) : `%${code.toString(16).toUpperCase()}`)
        .join('');
}
/**
 * Internal function that stringifies primitive values
 */
function _stringify(val, depth) {
    const valType = typeof val;
    if (val === null) {
        return 'n';
    }
    else if (valType === 'boolean') {
        return val ? 't' : 'f';
    }
    else if (valType === 'number') {
        return val.toString();
    }
    else if (valType === 'string') {
        if (val === '') {
            return "'";
        }
        else if (/^[tfn]$/.test(val)) {
            return `'${val}`;
        }
        else if (/^-?[0-9]/.test(val)) {
            return `'${escapeNonWordChars(val)}`;
        }
        else if (SAFE_CHARS_REGEX.test(val)) {
            return val;
        }
        else {
            return escapeNonWordChars(val);
        }
    }
    else if (Array.isArray(val)) {
        return '@(' + val.map((v) => _stringify(v, depth + 1)).join(',') + ')';
    }
    else if (valType === 'object') {
        const str = Object.entries(val)
            // filter out undefined values like JSON.stringify
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${_stringify(k, depth + 1)}=${_stringify(v, depth + 1)}`)
            .join(`&`);
        // only wrap in parentheses if nested object
        return depth > 0 ? `(${str})` : str;
    }
    else {
        throw new Error(`Unsupported value type: '${valType}' for ${val}`);
    }
}
exports._stringify = _stringify;
/**
 * Stringify object or array to query params-ish string
 */
function stringify(val) {
    if (typeof val === 'object') {
        throw new Error(`urltron only supports stringify for objects and arrays`);
    }
    return _stringify(val, 0);
}
exports.stringify = stringify;
/**
 * Parse object or array from query params-ish string
 */
function parse(str) {
    return str;
}
exports.parse = parse;
//# sourceMappingURL=index.js.map