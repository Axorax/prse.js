<h1 align="center">PRSE Documentation</h1>

# 📰 Table of Contents

- [⬇️ Installation](#-installation)
- [✨ Usage](#-usage)
- [📜 Examples](#-examples)
- [📖 Documentation](#-documentation)
- [❤️ Donate](https://patreon.com/axorax)

# ⬇️ Installation

| Package manager | Command |
| --- | --- |
| npm | `npm i prse` |
| yarn | `yarn add prse` |
| pnpm | `pnpm add prse` |

### CDN Links:

- https://unpkg.com/prse
- https://cdn.jsdelivr.net/npm/prse

# ✨ Usage

### Web:

```js
<script src="https://unpkg.com/prse/prse.umd.js"></script>
<script>
	string().run('hello!', () => { console.log('success') });
</script>
```

### ES6:

```js
import { string } from 'prse';

string().run('hello!', () => { console.log('success') });
```

### Commonjs:

```js
const { string } = require('prse');

string().run('hello!', () => { console.log('success') });
```

### Import everything

Shown with ES6 but works similarly with commonjs and web

```js
import { p } from 'prse';

p.string().run('hello!', () => { console.log('success') });
p.number().parse(69, () => { console.log('success') }); // run and parse are same, you can use either
```

# 📜 Examples

## [1/3] Important: Basic usage

```js
const format = object({
	name: string(),
	age: number()
});

const data = {
	name: 'Axorax',
	age: 15
};

format.run(data, () => { // you can also use "parse" instead of run, both are the same
		console.log('Data is valid');
	}, (error, info) => {
		console.error(error, info);
	}
)
```

`.run()` requires at least one argument (the data to validate) and can accept up to four arguments. The 1st argument is the data. The 2nd argument is a function to run if the data is valid. The 3rd argument is a function to run if the data is invalid, providing the error and error info in JSON format.

By default, if validation fails, it will console.error() the failed test. If you provide a function in the 3rd argument, only that function will run and no errors will be logged to the console.

> [!IMPORTANT]
> From now on, in the examples, I will not be running the parser (`format.run(...)`) as it will make the code larger. If you want to try out the code in the examples, make sure to run the parser.

## [2/3] Important: Import everything

```js
import { p } from 'prse';

p.string().run('hello!', () => { console.log('success') });
p.number().parse(69, () => { console.log('success') }); // run and parse are same, you can use either
```

## [3/3] Important: Chain array or object

```js
const format = objectLoose({ prse: unknown() }).notEmpty();

const data = { help: true };
```

```js
const format = array(unknown()).notEmpty(); // can't use "array().notEmpty()"

const data = ['Hello', 69];
```

> [!IMPORTANT]
> If you want to chain an array or object without it being in `object()` or `objectLoose()`, you need to add an unknown type to it. You cannot just use `array().notEmpty()` or `object().notEmpty()`.
> But if you want to just check if it is an array or object, you can use `array()` or `object()`.

## Other examples

```js
const format1 = string();
const format2 = date();
const format3 = array();

const data1 = 'Hello';
const data2 = '2024-06-07';
const data3 = [6, 9];
```

```js
const optional = object({
	isStudent: boolean().default(false)
});

const format = object({
	name: string().required(),
	age: number().range(0, 70)
}).combine(optional.optional());

const data = {
	name: 'John',
	age: 34
};
```

```js
const x = p.string().run('hi', () => { console.log('success') });

console.log(x); // true = passed validation, false = failed validation
```

```js
const format = objectLoose({
	name: string().required().minLength(3).maxLength(50).withMessage('Invalid name'),
	age: number().range(0, 70).nullable(),
	preferences: object({
		theme: enums(['dark', 'light']).withMessage("Theme must be 'dark' or 'light'"),
		notifications: boolean().default(false)
	}).optional(),
	tags: array(string().minLength(3))
	address: object({
		zip: string().optional()
	}).nullable(),
	metadata: record(unknown()).optional(),
	tupleExample: tuple([string(), number(), boolean()]),
	customField: number().custom((value) => value % 2 === 0, 'Must be an even number'),
	conditionalField: boolean()
		.conditional((value) => value === true, boolean().withMessage('If true, must be a string'), number().withMessage('If false, must be a number'))
		.withMessage('Conditional field validation failed'),
	unionField: unknown().union(string(), number()).withMessage('Union field must be a string or number'),
	date: date(),
	oneOf: string().oneOf(['option1', 'option2'])
});

const data = {
	name: 'John Doe',
	age: 30,
	preferences: {
		theme: 'dark',
		notifications: true
	},
	tags: ['tag1', 'tag2'],
	address: {
		city: 'Anytown',
		zip: '12345'
	},
	metadata: {
		key1: 'value1',
		key2: 123
	},
	tupleExample: ['text', 42, true],
	customField: 4,
	conditionalField: true,
	unionField: 'a string',
	date: '2023-01-01',
	oneOf: 'option1'
};
```

# 📖 Documentation

Make sure to use the `.run(...)` function and log out if it is valid or not when using any example code and also provide the data to validate.

| Method | Description | For | Chainable | Example |
| --- | --- | --- | --- | --- |
| run | parse data using provided format. Throws a `PRSEError` if parsing fails. | any | Yes | `string().run("Hi")` |
| parse | parse data using provided format. Throws a `PRSEError` if parsing fails. | any | Yes | `string().parse("Hi")` |
| p | Import everything | any | Yes | `p.string().run("Hi")` |
| withMessage | custom error message | any | Yes | `string().withMessage("Invalid!").run("Hi")` |
| string | check if string | any | No | `string()` |
| number | check if number | any | No | `number()` |
| boolean | check if boolean | any | No | `boolean()` |
| unknown | use if value is not known | any | No | `unknown()` |
| object | check if object | any | No | `object()` |
| objectLoose | check if object (valid even if some keys are missing) | any | No | `objectLoose()`|
| array | check if array | any | No | `array()` |
| set | check if set | any | No | `set()` |
| map | check if map | any | No | `map()` |
| record | check if string | any | No | `record(number())` |
| tuple | check if array of specific types | any | No | `tuple([string(), number()])` |
| fail | always fail | any | No | `fail()` |
| date | check if date | any | No | `date()` |
| instance | check if instance| any | No | `instance()` |
| func | check if func | any | No | `func()` |
| uint8Array | check if uint8Array | any | No | `uint8Array()` |
| regexp | check if regexp | any | No | `regexp()` |
| symbol | check if symbol (JavaScript Symbol('...')) | any | No | `symbol()` |
| int8Array| check if int8Array | any | No | `int8Array()` |
| bigInt | check if bigInt | any | No | `bigInt()` |
| enums | check if string | any | No | `enums(["dark", "light"])` |
| notEmpty | check if not empty | string, array, object | Yes | `array().notEmpty()` |
| empty | check if empty | string, array, object | Yes | `array().empty()` |
| or | check if that or that | any | Yes | `string().or(number())` |
| and | check if that and that | any | Yes | `string().and(string().minLength(5))` |
| not | check if not that| any | Yes | `string().not(string().maxLength(5))` |
| optional | accept undefined or null in addition to the specified type| any | Yes | `string().optional()` |
| nullable | accept null in addition to the specified type| any | Yes | `string().nullable()` |
| default | default value if parsing fails| any | Yes | `number().default(0)` |
| map | transform the parsed value using the provided function | any | Yes | `array().map((v) => v * 2)` |
| range | ensure length/number is within a specific range | number, strng, array, object | Yes | `number().range(1, 5)` |
| lessThan | ensure length/number is less than that | number, string, array, object | Yes | `number().lessThan(3)` |
| moreThan | ensure length/number is more than that | number, string, array, object | Yes | `number().moreThan(3)` |
| lessThanOrEqualTo | ensure length/number is less than or equal to that | number, string, array, object | Yes | `number().lessThanOrEqualTo(3)` |
| moreThanOrEqualTo | ensure length/number is more than or equal to that | number, string, array, object | Yes | `number().moreThanOrEqualTo(3)` |
| custom | use custom validation function| any | Yes | `number().custom((v) => v % 2 === 0, "Error: value must be even")` |
| conditional | apply different formats based on a condition | any | Yes | `number().conditional((v) => v % 2 === 0, evenformat, oddformat)` |
| union | combine multiple formats into one, allowing any of them to succeed | any | Yes | `string().union(boolean())` |
| combine | combine the result of the current format with another format's result| any | Yes | `string().combine(boolean())` |
| required | ensure parsed value is not undefined or null | any | Yes | `string().required()` |
| prohibited | ensure parsed value is undefined or null| any | Yes | `string().prohibited()` |
| pattern | ensure parsed value matches pattern | string, array, object | Yes | `string().pattern(/^\d+$/)` |
| minLength| ensure length is atleast that | string, array, number, object | Yes | `array().minLength(5)` |
| maxLength| ensure length is less than that | string, array, number, object | Yes | `array().maxLength(5)` |
| length | ensure length is exactly that | string, array, number, object | Yes | `array().length(5)` |
| before | Check if date is before specified date | date | Yes | `date().before('2025-01-01')` |
| after | Check if date is after specified date | date | Yes | `date().after('2024-01-01')` |
| sameDateAs | Check if date is same as specified date | date | Yes | `date().sameDateAs('2024-01-01')` |
| equalTo | ensure something is equal to another (`==`) | any | Yes | `string().equalTo('hi')` |
| strictlyEqualTo | ensure something is strictly equal to another (`===`) | any | Yes | `number().strictlyEqualTo(6)` |
| notEqualTo | ensure something is not equal to another (`!=`) | any | Yes | `number().notEqualTo(9)` |
| oneOf | string or all elements of array or object are any one of that | any | Yes | `string().oneOf(['hi', 'hello'])` |
| finiteNumber | ensure all elements of array or object or any is finite | any | Yes | `number().finiteNumber()` |
| first | check if string starts with that or array or object have first element equal to that | string, array, object | Yes | `string().first('h')` |
| last | check if string ends with that or array or object have last element equal to that | string, array, object | Yes | `string().last('i')` |
| includes | check if string has that text in it or array or object have an element or key equal to that | string, array, object | Yes | `string().includes('i')` |
| integer | check if integer | any | Yes | `number().integer()` |
| ofClass | check if instance of class | any | Yes | `unknown().ofClass('hello')` |
| email | check if string is email | string | Yes | `string().email()` |
| creditCard | check if string is credit card | string | Yes | `string().creditCard()` |
| ipv4 | check if string is ipv4 | string | Yes | `string().ipv4()` |
| ipv6 | check if string is ipv6 | string | Yes | `string().ipv6()` |
| domain | check if string is domain | string | Yes | `string().domain()` |
| hasProp | check if object has property | object | Yes | `objectLoose({ "prse": unknown() }).hasProp('greeting')` |
| customErrorHandler | custom error handler | any | Yes | `{no example}` |
| some | check if some elements or values of array or object follow the format | array, object | Yes | `array().some(string().email())` |
| every | check if all elements or values of array or object follow the format | array, object | Yes | `array().every(string().email())` |
| notNaN | check if not NaN | any | Yes | `unknown().notNaN()` |
| notZero | check if not zero| any | Yes | `number().notZero()` |
| notString| check if not string | any | Yes | `unknown().notString()` |
| notNumber| check if not number | any | Yes | `unknown().notNumber()` |
| notBoolean | check if not boolean | any | Yes | `unknown().notBoolean()` |
| notNull | check if not null| any | Yes | `unknown().notNull()` |
| notUndefined | check if not undefined | any | Yes | `unknown().notUndefined()` |
| notFunc | check if not function | any | Yes | `unknown().notFunc()` |
| notSet | check if not set | any | Yes | `unknown().notSet()` |
| notMap | check if not map | any | Yes | `unknown().notMap()` |
| notArray | check if not array | any | Yes | `unknown().notArray()` |

---

<p align="center"><a href="https://www.patreon.com/axorax">Support me on Patreon</a> — <a href="https://github.com/axorax/socials">Check out my socials</a></p>