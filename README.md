[![CI](https://github.com/recurrency/urltron/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nojvek/urltron/actions/workflows/ci.yml)
[![npm total downloads](https://img.shields.io/npm/dt/urltron.svg?maxAge=2592000)](https://www.npmjs.com/package/urltron)
[![licence](https://img.shields.io/npm/l/urltron.svg?maxAge=2592000)](https://github.com/nojvek/urltron)
[![npm version](https://img.shields.io/npm/v/urltron.svg)](https://www.npmjs.com/package/urltron)

# urltron

Stringify and parse json for url.

Works wonderfully for SPA apps that want to store state in url. Read via `location.search` and `location.hash`. Navigate with `<a href="...">`, `history.pushState` and `location.assign`. Can be used with `react-router`'s `<Link to={...}` and `useLocation/useHistory` hooks.

## Why use urltron?

- 0 dependencies
- Tiny (~1kb)
- Fast
- Looks like good ol' query params
- Written in Typescript. Comes with typings when installed.
- Works on all browsers and Node.js

## Usage

Same api as built-in `JSON.stringify` and `JSON.parse`.

```ts
import urltron from 'urltron';
urltron.stringify({limit: 10, offset: 20, query: 'hello'});
urltron.parse('limit=10&offset=20&query=hello');
```

## Playground
https://observablehq.com/@noj/urltron-online-encoder-decoder

## Design

- A flat object looks exactly like query paramters e.g `?k1=v&k2=v`.
- Supports all valid json types (null, boolean, number, string, object and array).
- Readable and intuitive output. Objects as `(a=1&b=2&c=3)` and arrays in `@(a,b,c)`
- Shorter and readable output compared to `encodeURIComponent(JSON.stringify(val))`

## Examples

| urltron                             | json                                                                 |
| ----------------------------------- | -------------------------------------------------------------------- |
| `hello=world+tour&limit=2&sort`     | `{"hello":"world tour","limit":2,"sort":true}`                       |
| `query=`                            | `{"query":""}`                                                       |
| `num=1.23`                          | `{"num":1.23}`                                                       |
| `yep=t`                             | `{"yep":true}`                                                       |
| `nah=f`                             | `{"nah":false}`                                                      |
| `nada=n`                            | `{"nada":null}`                                                      |
| `nStr=~n`                           | `{"nStr":"n"}`                                                       |
| `numStr=~123`                       | `{"numStr":"123"}`                                                   |
| `arr=@(1,2,3)`                      | `{"arr":[1,2,3]}`                                                    |
| `jraphql=(id&name&books=(id&name))` | `{"jraphql":{"id":true,"name":true,"books":{"id":true,"name":true}}` |
| `@(@(1,2,3),@(4,5,6),@(7,8,9),0)`   | `[[1,2,3],[4,5,6],[7,8,9],0]`                                        |
| `@(~,hello,t,f,n,1,(a=(b=c)))`      | `["","hello",true,false,null,1,{"a":{"b":"c"}}]`                     |
