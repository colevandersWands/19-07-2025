# Null

Another primitive type used to represent nothing.  This will make more sense after you learn about _variables_ and _prompt()_.

```js
'use strict';
console.log('-- null --');

// that's it, plain and simple
console.log(null);
```

## `null` vs. `undefined`

> The ECMAScript language specification describes them as follows:
>
> - `undefined` is “used when a variable has not been assigned a value”
> - `null` “represents the intentional absence of any object value”
>
> [2ality](https://2ality.com/2021/01/undefined-null-revisited.html)

The practical difference between `null` and `undefined` is that `null` will not appear in
your program by accident. `undefined` can appear in your program if you forgot to assign a
value, but `null` always need to be assigned.

If a variable stores `null` it was put there on purpose.
