import {parse, _stringify} from './index';

// TODO: figure out why nodejs isn't exporting this by default
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

interface StringifyTest {
  val: any;
  expect: string;
}

describe('urltron', () => {
  describe('stringify', () => {
    const tests: StringifyTest[] = [
      // strings
      {val: '', expect: "'"},
      {val: 'hello', expect: 'hello'},
      {
        val: '~!@#$%^&*_+-=(){}[]<>|\\/? "\'',
        expect: '%7E%21%40%23$%25%5E%26%2A_%2B-%3D%28%29%7B%7D%5B%5D%3C%3E%7C%5C%2F%3F%20%22%27',
      },
      {val: 'http://example.com/a b.jpg', expect: 'http%3A%2F%2Fexample.com%2Fa%20b.jpg'},
      {val: '😀', expect: '%F0%9F%98%80'},
      {val: 't', expect: "'t"},
      {val: 'f', expect: "'f"},
      {val: 'n', expect: "'n"},
      {val: 'true', expect: 'true'},
      {val: 'false', expect: 'false'},
      {val: '1.2', expect: "'1.2"},
      {val: '0', expect: "'0"},

      // true, false, null
      {val: true, expect: 't'},
      {val: false, expect: 'f'},
      {val: null, expect: 'n'},

      // object
      {
        val: {limit: 10, offset: 20, query: 'hello world', notyet: undefined},
        expect: 'limit=10&offset=20&query=hello%20world',
      },
      {val: {}, expect: ''},

      // array
      {
        val: [true, false, null, 'hello world', 1.234],
        expect: '@(t,f,n,hello%20world,1.234)',
      },

      // nested complex object
      {
        val: {
          select: ['id', 'name', 'age'],
          from: {table: 'users'},
          where: [
            {field: 'name', op: '%', val: 'foo'},
            {field: 'age', op: '>', val: 20},
          ],
          fullTable: true,
        },
        expect:
          'select=@(id,name,age)&from=(table=users)&where=@((field=name&op=%25&val=foo),(field=age&op=%3E&val=20))&fullTable=t',
      },
    ];

    for (const test of tests) {
      it(JSON.stringify(test.val), () => {
        expect(_stringify(test.val, 0)).toEqual(test.expect);
      });
    }
  });
});
