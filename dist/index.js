"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.stringify = exports._stringify = void 0;
function encodeString(str) {
    return encodeURIComponent(str)
        .replace(/[^%\w.-]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
        .replace(/%20/g, '+'); // space is a frequently used character, use + instead
}
/**
 * Internal function that stringifies primitive values
 */
function _stringify(val) {
    const valType = typeof val;
    // JSON.stringify converts undefined and NaN to null
    if (val === null || val === undefined) {
        return 'n';
    }
    else if (valType === 'boolean') {
        return val ? 't' : 'f';
    }
    else if (valType === 'number') {
        // JSON.stringify NaN/Number.POSITIVE_INFINITY is null
        const str = JSON.stringify(val);
        return str === 'null' ? 'n' : str;
    }
    else if (valType === 'string') {
        if (val === '') {
            return '~';
        }
        else if (/^[tfn]$/.test(val)) {
            return `~${val}`;
        }
        else if (/^-?[0-9]/.test(val)) {
            // possibly a number, prefix with '
            return `~${encodeString(val)}`;
        }
        else if (/^[\w.-]+$/.test(val)) {
            return val;
        }
        else {
            return encodeString(val);
        }
    }
    else if (Array.isArray(val)) {
        return '@(' + val.map((v) => _stringify(v)).join(',') + ')';
    }
    else if (valType === 'object') {
        return ('(' +
            Object.entries(val)
                // filter out undefined values like JSON.stringify
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => `${_stringify(k)}${v === true ? '' : `=${v === '' ? '' : _stringify(v)}`}`)
                .join(`&`) +
            ')');
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
    if (typeof val !== 'object') {
        throw new Error(`urltron only supports stringify for objects and arrays`);
    }
    let str = _stringify(val);
    // remove brackets for objects so str looks like k1=v=k2=v2 query params
    if (str.startsWith('(') && str.endsWith(')')) {
        str = str.slice(1, str.length - 1);
    }
    return str;
}
exports.stringify = stringify;
function _lex(str) {
    // split string while keeping delimiters
    // @see https://medium.com/@shemar.gordon32/how-to-split-and-keep-the-delimiter-s-d433fb697c65
    const tokens = str.split(/(?=[@()=&,])|(?<=[@()=&,])/g);
    let idx = 0;
    return {
        tokens,
        peek: () => (idx < tokens.length ? tokens[idx] : null),
        next: () => ((idx += 1), idx < tokens.length),
    };
}
function _ensureToken(lexer, expected, consume = true) {
    if (lexer.peek() !== expected) {
        throw new Error(`urltron.parse: expecting:'${expected}', found:'${lexer.peek()}'`);
    }
    if (consume) {
        lexer.next();
    }
}
function _parseObject(lexer) {
    const obj = {};
    _ensureToken(lexer, '(');
    while (lexer.peek() !== ')') {
        const key = _parseString(lexer);
        let val;
        // handle `&k` case, which represents value as true
        if (lexer.peek() === '&' || lexer.peek() === ')') {
            val = true;
        }
        else {
            _ensureToken(lexer, '=');
            // handle `&k=` case, which represents value as empty string
            if (lexer.peek() === '&' || lexer.peek() === ')') {
                val = '';
            }
            else {
                val = _parseValue(lexer);
            }
        }
        if (lexer.peek() !== ')') {
            _ensureToken(lexer, '&');
        }
        obj[key] = val;
    }
    _ensureToken(lexer, ')');
    return obj;
}
function _parseArray(lexer) {
    const arr = [];
    _ensureToken(lexer, '@');
    _ensureToken(lexer, '(');
    while (lexer.peek() !== ')') {
        const val = _parseValue(lexer);
        if (lexer.peek() !== ')') {
            _ensureToken(lexer, ',');
        }
        arr.push(val);
    }
    _ensureToken(lexer, ')');
    return arr;
}
function _parseString(lexer) {
    let str = lexer.peek();
    lexer.next();
    if (str[0] === '~') {
        str = str.slice(1);
    }
    return decodeURIComponent(str.replace(/\+/g, '%20'));
}
function _parseValue(lexer) {
    const curToken = lexer.peek();
    if (!curToken) {
        throw new Error(`urltron.parse: invalid token:'${curToken}'`);
    }
    else if (curToken === '(') {
        return _parseObject(lexer);
    }
    else if (curToken === '@') {
        return _parseArray(lexer);
    }
    else if (curToken === 't') {
        lexer.next();
        return true;
    }
    else if (curToken === 'f') {
        lexer.next();
        return false;
    }
    else if (curToken === 'n') {
        lexer.next();
        return null;
    }
    else if (/^-?[0-9]/.test(curToken)) {
        lexer.next();
        return parseFloat(curToken);
    }
    else {
        return _parseString(lexer);
    }
}
/**
 * Parse object or array from query params-ish string
 */
function parse(str) {
    if (!str) {
        str = '()';
    }
    else if (str[0] === '?' || str[0] == '#') {
        // remove ?/# prefix if value comes directly from location.search or location.hash
        str = str.slice(1);
    }
    if (str[0] != '@' && str[0] != '(') {
        // assume parsing object by default
        str = `(${str})`;
    }
    return _parseValue(_lex(str));
}
exports.parse = parse;
// so it can be imported as `import urltron from 'urltron';`
exports.default = { stringify, parse };
//# sourceMappingURL=index.js.map