"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.stringify = void 0;
function escapeNonWordChars(val) {
    return Array.from(new TextEncoder().encode(val))
        .map((code) => {
        return `%${code.toString(16).toUpperCase()}`;
    })
        .join('');
}
function encodeString(val) {
    if (val === '') {
        return "'";
    }
    else if (/^[tfn]$/.test(val)) {
        return `'${val}`;
    }
    else if (/^-?[0-9]/.test(val)) {
        return `'${escapeNonWordChars(val)}`;
    }
    else {
        return escapeNonWordChars(val);
    }
}
function stringify(val) {
    return encodeString(val);
}
exports.stringify = stringify;
function parse(str) {
    return str;
}
exports.parse = parse;
//# sourceMappingURL=index.js.map