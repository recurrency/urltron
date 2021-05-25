/**
 * Internal function that stringifies primitive values
 */
export declare function _stringify(val: any, depth: number): string;
/**
 * Stringify object or array to query params-ish string
 */
export declare function stringify(val: any): string;
/**
 * Parse object or array from query params-ish string
 */
export declare function parse(str: string): any;
