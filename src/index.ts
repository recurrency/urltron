function encodeString(str: string): string {
  return encodeURIComponent(str)
    .replace(/[^%\w.-]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+'); // space is a frequently used character, use + instead
}

/**
 * Internal function that stringifies primitive values
 */
export function _stringify(val: any): string {
  const valType = typeof val;
  // JSON.stringify converts undefined and NaN to null
  if (val === null || val === undefined) {
    return 'n';
  } else if (valType === 'boolean') {
    return val ? 't' : 'f';
  } else if (valType === 'number') {
    // JSON.stringify NaN/Number.POSITIVE_INFINITY is null
    const str = JSON.stringify(val);
    return str === 'null' ? 'n' : str;
  } else if (valType === 'string') {
    if (val === '') {
      return '~';
    } else if (/^[tfn]$/.test(val)) {
      return `~${val}`;
    } else if (/^-?[0-9]/.test(val)) {
      // possibly a number, prefix with '
      return `~${encodeString(val)}`;
    } else if (/^[\w.-]+$/.test(val)) {
      return val;
    } else {
      return encodeString(val);
    }
  } else if (Array.isArray(val)) {
    return '@(' + val.map((v) => _stringify(v)).join(',') + ')';
  } else if (valType === 'object') {
    return (
      '(' +
      Object.entries(val)
        // filter out undefined values like JSON.stringify
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${_stringify(k)}${v === true ? '' : `=${v === '' ? '' : _stringify(v)}`}`)
        .join(`&`) +
      ')'
    );
  } else {
    throw new Error(`Unsupported value type: '${valType}' for ${val}`);
  }
}

/**
 * Stringify object or array to query params-ish string
 */
export function stringify(val: any): string {
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

interface Lexer {
  tokens: string[];
  peek: () => string | null;
  next: () => boolean;
}

function _lex(str: string): Lexer {
  // split string while keeping delimiters, use () - capture to keep delimiter
  // 'one..two'.split(/(\.)/); => ["one", ".", "", ".", "two"]
  // so we need to filter out empty strings
  const tokens = str.split(/([@()=&,])/).filter((c) => c !== '');
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
    let val;

    // handle `&k` case, which represents value as true
    if (lexer.peek() === '&' || lexer.peek() === ')') {
      val = true;
    } else {
      _ensureToken(lexer, '=');

      // handle `&k=` case, which represents value as empty string
      if (lexer.peek() === '&' || lexer.peek() === ')') {
        val = '';
      } else {
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
  if (str[0] === '~') {
    str = str.slice(1);
  }

  return decodeURIComponent(str.replace(/\+/g, '%20'));
}

function _parseValue(lexer: Lexer): any {
  const curToken = lexer.peek();
  if (!curToken) {
    throw new Error(`urltron.parse: invalid token:'${curToken}'`);
  } else if (curToken === '(') {
    return _parseObject(lexer);
  } else if (curToken === '@') {
    return _parseArray(lexer);
  } else if (curToken === 't') {
    lexer.next();
    return true;
  } else if (curToken === 'f') {
    lexer.next();
    return false;
  } else if (curToken === 'n') {
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
  if (!str) {
    str = '()';
  } else if (str[0] === '?' || str[0] == '#') {
    // remove ?/# prefix if value comes directly from location.search or location.hash
    str = str.slice(1);
  }

  if (str[0] != '@' && str[0] != '(') {
    // assume parsing object by default
    str = `(${str})`;
  }

  return _parseValue(_lex(str));
}

// so it can be imported as `import urltron from 'urltron';`
export default {stringify, parse};
