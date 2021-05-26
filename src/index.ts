const SAFE_CHARS = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$._-';
const SAFE_CHARS_REGEX = new RegExp(`^[${SAFE_CHARS}]+$`);
const SAFE_CHARS_SET = new Set(SAFE_CHARS.split('').map((c) => c.charCodeAt(0)));

function escapeNonWordChars(val: string): string {
  // All chars other than word chars are percent encoded
  return Array.from(new TextEncoder().encode(val))
    .map((code: number) =>
      SAFE_CHARS_SET.has(code) ? String.fromCharCode(code) : `%${code.toString(16).toUpperCase()}`,
    )
    .join('');
}

/**
 * Internal function that stringifies primitive values
 */
export function _stringify(val: any, depth: number): string {
  const valType = typeof val;
  // JSON.stringify converts undefined and NaN to null
  if (val === null || val === undefined || Number.isNaN(val)) {
    return 'n';
  } else if (valType === 'boolean') {
    return val ? 't' : 'f';
  } else if (valType === 'number') {
    return val.toString();
  } else if (valType === 'string') {
    if (val === '') {
      return "'";
    } else if (/^[tfn]$/.test(val)) {
      return `'${val}`;
    } else if (/^-?[0-9]/.test(val)) {
      return `'${escapeNonWordChars(val)}`;
    } else if (SAFE_CHARS_REGEX.test(val)) {
      return val;
    } else {
      return escapeNonWordChars(val);
    }
  } else if (Array.isArray(val)) {
    return '@(' + val.map((v) => _stringify(v, depth + 1)).join(',') + ')';
  } else if (valType === 'object') {
    const str = Object.entries(val)
      // filter out undefined values like JSON.stringify
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${_stringify(k, depth + 1)}=${_stringify(v, depth + 1)}`)
      .join(`&`);

    // only wrap in parentheses if nested object
    return depth > 0 ? `(${str})` : str;
  } else {
    throw new Error(`Unsupported value type: '${valType}' for ${val}`);
  }
}

/**
 * Stringify object or array to query params-ish string
 */
export function stringify(val: any): string {
  if (typeof val === 'object') {
    throw new Error(`urltron only supports stringify for objects and arrays`);
  }
  return _stringify(val, 0);
}

interface Lexer {
  tokens: string[];
  peek: () => string | null;
  next: () => boolean;
}

function _lex(str: string): Lexer {
  if (!str || (str[0] != '@' && str[0] != '(')) {
    str = `(${str})`; // assume parsing object by default
  }
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

function _ensureToken(lexer: Lexer, expected: string, consume = true) {
  if (lexer.peek() !== expected) {
    throw new Error(`urltron.parse: expecting:'${expected}', found:'${lexer.peek()}'`);
  }
  if (consume) {
    lexer.next();
  }
}

function _parseObject(lexer: Lexer): Record<string, any> {
  const obj: Record<string, any> = {};

  _ensureToken(lexer, '(');
  while (lexer.peek() !== ')') {
    const key = _parseString(lexer);
    _ensureToken(lexer, '=');
    const val = _parseValue(lexer);
    if (lexer.peek() !== ')') {
      _ensureToken(lexer, '&');
    }
    obj[key] = val;
  }
  _ensureToken(lexer, ')');

  return obj;
}

function _parseArray(lexer: Lexer): any[] {
  const arr: any[] = [];

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

function _parseString(lexer: Lexer): string {
  let str = lexer.peek()!;
  lexer.next();
  if (str[0] === "'") {
    str = str.slice(1);
  }
  return decodeURIComponent(str);
}

function _parseValue(lexer: Lexer): any {
  const curToken = lexer.peek();
  if (!curToken) {
    throw new Error(`urltron.parse: invalid token:'${curToken}'`);
  } else if (curToken == '(') {
    return _parseObject(lexer);
  } else if (curToken == '@') {
    return _parseArray(lexer);
  } else if (curToken == 't') {
    lexer.next();
    return true;
  } else if (curToken == 'f') {
    lexer.next();
    return false;
  } else if (curToken == 'n') {
    lexer.next();
    return null;
  } else if (/^-?[0-9]/.test(curToken)) {
    lexer.next();
    return parseFloat(curToken);
  } else {
    return _parseString(lexer);
  }
}

/**
 * Parse object or array from query params-ish string
 */
export function parse(str: string): any {
  return _parseValue(_lex(str));
}
