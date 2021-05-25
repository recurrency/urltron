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
  if (val === null) {
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

export function stringify(val: any): string {
  if (typeof val === 'object') {
    throw new Error(`urltron only supports stringify for objects and arrays`);
  }
  return _stringify(val, 0);
}

export function parse(str: string): any {
  return str;
}
