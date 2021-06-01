import {parse, stringify, _stringify} from './index';

interface ValTest {
  name?: string;
  val: any;
  expect: string;
}

describe('urltron', () => {
  describe('_stringify()', () => {
    const tests: ValTest[] = [
      {val: '', expect: '~'},
      {val: 'hello world', expect: 'hello+world'},
      {
        val: '~!@#$%^&*_+-=(){}[]<>|\\/? "\'',
        expect: '%7E%21%40%23%24%25%5E%26%2A_%2B-%3D%28%29%7B%7D%5B%5D%3C%3E%7C%5C%2F%3F+%22%27',
      },
      {val: 'http://example.com/a/b.jpg', expect: 'http%3A%2F%2Fexample.com%2Fa%2Fb.jpg'},
      {val: '😀', expect: '%F0%9F%98%80'},
      {val: 't', expect: '~t'},
      {val: 'f', expect: '~f'},
      {val: 'n', expect: '~n'},
      {val: 'true', expect: 'true'},
      {val: 'false', expect: 'false'},
      {val: '1.2', expect: '~1.2'},
      {val: '0', expect: '~0'},

      {val: 0, expect: '0'},
      {val: 1.2, expect: '1.2'},
      {val: -100, expect: '-100'},
      {val: -100.1e100, expect: '-1.001e+102'},

      {val: true, expect: 't'},
      {val: false, expect: 'f'},
      {val: null, expect: 'n'},
      {val: undefined, expect: 'n'},
      {val: NaN, expect: 'n'},
      {val: Number.POSITIVE_INFINITY, expect: 'n'},
    ];

    for (const test of tests) {
      it(String(test.val), () => {
        const str = _stringify(test.val);
        expect(str).toEqual(test.expect);
      });
    }
  });

  describe('val |> stringify |> parse |> JSON.stringify === JSON.stringify(val)', () => {
    const tests: ValTest[] = [
      {
        name: 'simple array',
        val: [true, false, null, 'hello world', 1.234, '12ft', ''],
        expect: '@(t,f,n,hello+world,1.234,~12ft,~)',
      },
      {name: 'empty object', val: {}, expect: ''},
      {name: 'empty array', val: [], expect: '@()'},
      {
        name: 'simple object',
        val: {limit: 10, offset: 20, query: 'hello world', notyet: undefined},
        expect: 'limit=10&offset=20&query=hello+world',
      },
      {
        name: 'complex object',
        val: {
          select: ['id', 'name', 'age'],
          from: {table: 'users'},
          where: [
            {field: 'name', op: '!=', val: ''},
            {field: 'age', op: '>', val: 20},
          ],
          sort: {field: 'name', desc: true},
        },
        expect:
          'select=@(id,name,age)&from=(table=users)&where=@((field=name&op=%21%3D&val=),(field=age&op=%3E&val=20))&sort=(field=name&desc)',
      },
      {
        name: 'complex escaped object',
        val: {
          '~!@#$%^&*()=%': {
            num: ['', 't', 'f', 'n', 1, -2.3, -3e100, true, false, null, undefined, NaN, Number.NEGATIVE_INFINITY],
            '': '',
            query: '',
            undefined: undefined,
            null: null,
            true: true,
            false: false,
            NaN: NaN,
            Infinity: Number.POSITIVE_INFINITY,
          },
        },
        expect:
          '%7E%21%40%23%24%25%5E%26%2A%28%29%3D%25=(num=@(~,~t,~f,~n,1,-2.3,-3e+100,t,f,n,n,n,n)&~=&query=&null=n&true&false=f&NaN=n&Infinity=n)',
      },
    ];

    for (const test of tests) {
      it(test.name!, () => {
        const str = stringify(test.val);
        expect(str).toEqual(test.expect);
        // ensure parse(stringify) == val (with undefined keys deep removed)
        expect(JSON.stringify(parse(str))).toEqual(JSON.stringify(test.val));
      });
    }
  });

  describe('parse()', () => {
    it('with ? and # prefix', () => {
      expect(parse(`?`)).toEqual({});
      expect(parse(`#`)).toEqual({});
      expect(parse(``)).toEqual({});
      expect(parse(`?query=&limit=10`)).toEqual({query: '', limit: 10});
      expect(parse(`#query=&limit=10`)).toEqual({query: '', limit: 10});
      expect(parse(`?@()`)).toEqual([]);
      expect(parse(`#@()`)).toEqual([]);
      expect(parse(`@()`)).toEqual([]);
    });
  });
});
