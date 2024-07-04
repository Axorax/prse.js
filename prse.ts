class PRSEError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PRSEError';
	}
}

const assert = (condition: boolean, message: string) => {
	if (!condition) {
		throw new PRSEError(message);
	}
};

class Parser<T> {
	private _parse: (v: any) => T;
	private errorMessage: string;

	constructor(parseFn: (v: any) => T, errorMessage = '') {
		this._parse = parseFn;
		this.errorMessage = errorMessage;
	}

	check = (v: any): T => {
		try {
			return this._parse(v);
		} catch (e) {
			if (e instanceof PRSEError && !e.message.startsWith(this.errorMessage)) {
				if (this.errorMessage == '') {
					throw new PRSEError(e.message);
				} else {
					throw new PRSEError(this.errorMessage);
				}
			}
			throw e;
		}
	};

	run = (rawData: string, onSuccess: (() => void) | null = null, onFailure: ((errorInfo: string, errorDetails: { name: string; message: string; file: string; line: string; column: string }) => void) | null = null): any => {
		try {
			this.check(rawData);
			if (onSuccess !== null) {
				onSuccess();
			}
			return true;
		} catch (e) {
			const errorInfos = getErrorInfo(e.stack);
			const i = errorInfos[2];
			const t = `\x1b[31m${e.name}\x1b[0m: \x1b[31m${e.message}\x1b[0m\n\x1b[33mFile\x1b[0m: \x1b[36m${i.file}\x1b[0m\n\x1b[33mAt\x1b[0m: \x1b[36mLine - \x1b[0m\x1b[35m${i.line}\x1b[0m; \x1b[36mColumn - \x1b[0m\x1b[35m${i.column}\x1b[0m`;
			if (onFailure !== null) {
				onFailure(t, {
					name: e.name,
					message: e.message,
					file: i.file,
					line: i.line,
					column: i.column
				});
			} else {
				console.error(t);
			}
			return false;
		}
	};

	parse = (...args: Parameters<typeof this.run>): ReturnType<typeof this.run> => {
		return this.run(...args);
	};

	withMessage = (message: string): Parser<T> => {
		return new Parser<T>(this._parse, message);
	};

	notEmpty = (): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'string' || Array.isArray(v)) {
				assert(v.length > 0, 'Value must not be empty');
			} else if (typeof v === 'object' && v !== null) {
				assert(Object.keys(v).length > 0, 'Object must not be empty');
			} else {
				throw new PRSEError('Invalid type for notEmpty validation');
			}
			return v;
		});
	};

	empty = (): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'string' || Array.isArray(v)) {
				assert(v.length == 0, 'Value must be empty');
			} else if (typeof v === 'object' && v !== null) {
				assert(Object.keys(v).length == 0, 'Object must be empty');
			} else {
				throw new PRSEError('Invalid type for notEmpty validation');
			}
			return v;
		});
	};

	or = (...parsers: Parser<T>[]): Parser<T> => {
		return new Parser<T>((v: any) => {
			for (const parser of [this, ...parsers]) {
				try {
					return parser.check(v);
				} catch (e) {
					if (e instanceof PRSEError) {
						continue;
					}
					throw e;
				}
			}
			throw new PRSEError('No valid alternatives');
		});
	};

	and<U>(other: Parser<U>): Parser<[T, U]> {
		return new Parser<[T, U]>((v: any) => {
			const result1 = this.check(v);
			const result2 = other.check(v);
			return [result1, result2];
		});
	}

	not<U>(other: Parser<U>): Parser<[T, U]> {
		return new Parser<[T, U]>((v: any): any => {
			const result1 = this.check(v);
			let result2;
			try {
				result2 = other.check(v);
				result2 = false;
			} catch (e) {
				result2 = true;
			}
			if (result2 == false) {
				throw new PRSEError('Failed to pass not(condition)');
			}
			return [result1, result2];
		});
	}

	optional = (): Parser<T | undefined> => {
		return new Parser((value) => {
			if (value === undefined || value === null) {
				return value;
			}
			return this.check(value);
		});
	};

	nullable = (): Parser<T | null> => {
		return new Parser<T | null>((v: any) => {
			if (v === null) {
				return v;
			}
			return this.check(v);
		});
	};

	default = (defaultv: T): Parser<T> => {
		return new Parser<T>((v: any) => {
			try {
				return this.check(v);
			} catch {
				return defaultv;
			}
		});
	};

	map = <R>(transform: (v: T) => R): Parser<R> => {
		return new Parser<R>((v: any) => {
			return transform(this.check(v));
		});
	};

	range = (min: number, max: number): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'number') {
				assert(v >= min && v <= max, `Value must be between ${min} and ${max}`);
			} else if (typeof v === 'string' || Array.isArray(v)) {
				assert(v.length >= min && v.length <= max, `Length must be between ${min} and ${max}`);
			} else if (typeof v === 'object' && v !== null) {
				const keys = Object.keys(v);
				assert(keys.length >= min && keys.length <= max, `Number of keys must be between ${min} and ${max}`);
			} else {
				throw new PRSEError('Invalid type for range validation');
			}
			return v;
		});
	};

	before = (max: number): Parser<T> => {
		return this.map((v: any) => {
			assert(v.getTime() < new Date(max).getTime(), `Date must be before ${max}`);
			return v;
		});
	};

	after = (max: number): Parser<T> => {
		return this.map((v: any) => {
			assert(v.getTime() > new Date(max).getTime(), `Date must be after ${max}`);
			return v;
		});
	};

	sameDateAs = (max: number): Parser<T> => {
		return this.map((v: any) => {
			assert(v.getTime() === new Date(max).getTime(), `Date must be same as ${max}`);
			return v;
		});
	};

	lessThan = (max: number): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'number') {
				assert(v < max, `Value must be less than ${max}`);
			} else if (typeof v === 'string' || Array.isArray(v)) {
				assert(v.length < max, `Length must be less than ${max}`);
			} else if (typeof v === 'object' && v !== null) {
				assert(Object.keys(v).length < max, `Number of keys must be less than ${max}`);
			} else {
				throw new PRSEError('Invalid type for lessThan validation');
			}
			return v;
		});
	};

	moreThan = (min: number): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'number') {
				assert(v > min, `Value must be greater than ${min}`);
			} else if (typeof v === 'string' || Array.isArray(v)) {
				assert(v.length > min, `Length must be greater than ${min}`);
			} else if (typeof v === 'object' && v !== null) {
				const keys = Object.keys(v);
				assert(keys.length > min, `Number of keys must be greater than ${min}`);
			} else {
				throw new PRSEError('Invalid type for moreThan validation');
			}
			return v;
		});
	};

	lessThanOrEqualTo = (max: number): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'number') {
				assert(v <= max, `Value must be less than or equal to ${max}`);
			} else if (typeof v === 'string' || Array.isArray(v)) {
				assert(v.length <= max, `Length must be less than or equal to ${max}`);
			} else if (typeof v === 'object' && v !== null) {
				const keys = Object.keys(v);
				assert(keys.length <= max, `Number of keys must be less than or equal to ${max}`);
			} else {
				throw new PRSEError('Invalid type for lessThanOrEqualTo validation');
			}
			return v;
		});
	};

	moreThanOrEqualTo = (min: number): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'number') {
				assert(v >= min, `Value must be greater than or equal to ${min}`);
			} else if (typeof v === 'string' || Array.isArray(v)) {
				assert(v.length >= min, `Length must be greater than or equal to ${min}`);
			} else if (typeof v === 'object' && v !== null) {
				const keys = Object.keys(v);
				assert(keys.length >= min, `Number of keys must be greater than or equal to ${min}`);
			} else {
				throw new PRSEError('Invalid type for moreThanOrEqualTo validation');
			}
			return v;
		});
	};

	custom = (validateFn: (v: T) => boolean, errorMessage = 'Custom validation failed'): Parser<T> => {
		return new Parser<T>((v: any) => {
			const result = this.check(v);
			assert(validateFn(result), errorMessage);
			return result;
		});
	};

	conditional = <R>(predicateFn: (v: T) => boolean, trueParser: Parser<R>, falseParser: Parser<R> = unknown()): Parser<R> => {
		return new Parser<R>((v: any) => {
			const result = this.check(v);
			return predicateFn(result) ? trueParser.check(result) : falseParser.check(result);
		});
	};

	union = (...parsers: Parser<any>[]): Parser<T> => {
		return new Parser<T>((v: any) => {
			for (const parser of parsers) {
				try {
					return parser.check(v);
				} catch (e) {
					if (e instanceof PRSEError) {
						continue;
					}
					throw e;
				}
			}
			throw new PRSEError('Value does not match any of the union types');
		});
	};

	combine = <R>(parser: Parser<R>): Parser<R> => {
		return new Parser<R>((v: any) => {
			const result1 = this.check(v);
			const result2 = parser.check(result1);
			return result2;
		});
	};

	required = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(v !== undefined && v !== null, 'Field is required');
			return this.check(v);
		});
	};

	prohibited = (): Parser<undefined | null> => {
		return new Parser<undefined | null>((v: any) => {
			assert(v === undefined || v === null, 'Field is prohibited');
			return v;
		});
	};

	pattern = (regex: RegExp): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'string') {
				assert(regex.test(v), 'Value does not match pattern');
			} else if (Array.isArray(v)) {
				for (const item of v) {
					if (typeof item === 'string') {
						assert(regex.test(item), 'Array element does not match pattern');
					} else {
						throw new PRSEError('Array contains non-string elements');
					}
				}
			} else if (typeof v === 'object' && v !== null) {
				for (const value of Object.values(v)) {
					if (typeof value === 'string') {
						assert(regex.test(value), 'Object value does not match pattern');
					} else {
						throw new PRSEError('Object contains non-string values');
					}
				}
			} else {
				throw new PRSEError('Invalid type for pattern validation');
			}
			return v;
		});
	};

	minLength = (min: number): Parser<T> => {
		return new Parser<T>((v: any) => {
			if (typeof v === 'string') {
				assert(v.length >= min, `String must be at least ${min} characters long`);
			} else if (Array.isArray(v)) {
				assert(v.length >= min, `Array must have at least ${min} elements`);
			} else if (typeof v === 'number') {
				assert(v.toString().length >= min, `Number must be at least ${min} digits long`);
			} else if (typeof v === 'object' && v !== null) {
				const keys = Object.keys(v);
				assert(keys.length >= min, `Object must have at least ${min} keys`);
			} else {
				throw new PRSEError('Invalid type for minLength validation');
			}
			return this.check(v);
		});
	};

	maxLength = (max: number): Parser<T> => {
		return new Parser<T>((v: any) => {
			if (typeof v === 'string') {
				assert(v.length <= max, `String must be at most ${max} characters long`);
			} else if (Array.isArray(v)) {
				assert(v.length <= max, `Array must have at most ${max} elements`);
			} else if (typeof v === 'number') {
				assert(v.toString().length <= max, `Number must be at most ${max} digits long`);
			} else if (typeof v === 'object' && v !== null) {
				const keys = Object.keys(v);
				assert(keys.length <= max, `Object must have at most ${max} keys`);
			} else {
				throw new PRSEError('Invalid type for maxLength validation');
			}
			return this.check(v);
		});
	};

	length = (length: number): Parser<T> => {
		return new Parser<T>((v: any) => {
			if (typeof v === 'string') {
				assert(v.length === length, `String must be exactly ${length} characters long`);
			} else if (Array.isArray(v)) {
				assert(v.length === length, `Array must have exactly ${length} elements`);
			} else if (typeof v === 'number') {
				const numStr = v.toString();
				assert(numStr.length === length, `Number must have exactly ${length} digits`);
			} else if (typeof v === 'object' && v !== null) {
				const keys = Object.keys(v);
				assert(keys.length === length, `Object must have exactly ${length} keys`);
			} else {
				throw new PRSEError('Invalid type for length validation');
			}
			return this.check(v);
		});
	};

	equalTo = (expected: any): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(v == expected, `Expected to be equal to: ${expected}`);
			return v;
		});
	};

	strictlyEqualTo = (expected: any): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(v === expected, `Expected to be strictly equal to: ${expected}`);
			return v;
		});
	};

	notEqualTo = (unexpected: any): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(v != unexpected, `Expected to not be equal to: ${unexpected}`);
			return v;
		});
	};

	oneOf = (allowed: any[]): Parser<T> => {
		return new Parser<T>((v: any) => {
			if (typeof v === 'string') {
				assert(allowed.includes(v), `Expected one of: ${allowed.join(', ')}`);
			} else if (Array.isArray(v)) {
				for (const item of v) {
					assert(allowed.includes(item), `Expected one of: ${allowed.join(', ')}`);
				}
			} else if (typeof v === 'object' && v !== null) {
				const values = Object.values(v);
				for (const item of values) {
					assert(allowed.includes(item), `Expected one of: ${allowed.join(', ')}`);
				}
			} else {
				throw new PRSEError('Invalid type for oneOf validation');
			}
			return this.check(v);
		});
	};

	finiteNumber = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			if (Array.isArray(v)) {
				for (const item of v) {
					assert(Number.isFinite(item), 'Expected all elements of the array to be finite numbers');
				}
			} else if (typeof v === 'object' && v !== null) {
				const values = Object.values(v);
				for (const item of values) {
					assert(Number.isFinite(item), 'Expected all values of the object to be finite numbers');
				}
			} else {
				assert(Number.isFinite(v), 'Expected a finite number');
			}
			return this.check(v);
		});
	};

	customErrorHandler = (customHandler: (error: Error) => Error): Parser<T> => {
		return new Parser<T>((v: any) => {
			try {
				return this.check(v);
			} catch (e) {
				throw customHandler(e);
			}
		});
	};

	first = (substring: string): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'string') {
				assert(v.startsWith(substring), `String must start with "${substring}"`);
			} else if (Array.isArray(v)) {
				assert(typeof v[0] === 'string' && v[0] == substring, `Array's first element must be "${substring}"`);
			} else if (typeof v === 'object' && v !== null) {
				const firstValue = Object.values(v)[0];
				assert(typeof firstValue === 'string' && firstValue == substring, `Object's first value must be "${substring}"`);
			} else {
				throw new PRSEError('startsWith method only works with strings, arrays, or objects');
			}
			return v;
		});
	};

	last = (substring: string): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'string') {
				assert(v.endsWith(substring), `String must end with "${substring}"`);
			} else if (Array.isArray(v)) {
				const lastElement = v[v.length - 1];
				assert(typeof lastElement === 'string' && lastElement == substring, `Array's last element must be "${substring}"`);
			} else if (typeof v === 'object' && v !== null) {
				const values = Object.values(v);
				const lastValue = values[values.length - 1];
				assert(typeof lastValue === 'string' && lastValue == substring, `Object's last value must be "${substring}"`);
			} else {
				throw new PRSEError('endsWith method only works with strings, arrays, or objects');
			}
			return v;
		});
	};

	includes = (substring: string): Parser<T> => {
		return this.map((v: any) => {
			if (typeof v === 'string') {
				assert(v.includes(substring), `String must include "${substring}"`);
			} else if (Array.isArray(v)) {
				assert(v.includes(substring), `Array must include "${substring}"`);
			} else if (typeof v === 'object' && v !== null) {
				assert(Object.keys(v).includes(substring), `Object keys must include "${substring}"`);
			} else {
				throw new PRSEError('includes method only works with strings, arrays, or objects');
			}
			return v;
		});
	};

	notNaN = (): Parser<number> => {
		return this.map((v: any) => {
			assert(!isNaN(v), 'Value must not be NaN');
			return v;
		});
	};

	notZero = (): Parser<number> => {
		return this.map((v: any) => {
			assert(v !== 0, 'Value must not be zero');
			return v;
		});
	};

	integer = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(Number.isInteger(v), 'Expected an integer');
			return this.check(v);
		});
	};

	notString = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(typeof v !== 'string', 'Expected not a string');
			return this.check(v);
		});
	};

	notNumber = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(typeof v !== 'number', 'Expected not a number');
			return this.check(v);
		});
	};

	notBoolean = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(typeof v !== 'boolean', 'Expected not a boolean');
			return this.check(v);
		});
	};

	notNull = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(v !== null, 'Expected not null');
			return this.check(v);
		});
	};

	notUndefined = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(v !== undefined, 'Expected not undefined');
			return this.check(v);
		});
	};

	notFunc = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(typeof v !== 'function', 'Expected not a function');
			return this.check(v);
		});
	};

	notSet = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(!(v instanceof Set), 'Expected not a Set');
			return this.check(v);
		});
	};

	notMap = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(!(v instanceof Map), 'Expected not a Map');
			return this.check(v);
		});
	};

	notArray = (): Parser<T> => {
		return new Parser<T>((v: any) => {
			assert(!Array.isArray(v), 'Expected not an array');
			return this.check(v);
		});
	};

	ofClass = (className: string): Parser<T> => {
		return this.custom((v: any) => v.constructor.name === className, `Expected an instance of class ${className}`);
	};

	every = (parser: Parser<any>): Parser<T> => {
		return new Parser<T>((v: any) => {
			if (Array.isArray(v)) {
				for (const entry of v) {
					parser.check(entry);
				}
			} else if (typeof v === 'object' && v !== null) {
				for (const key in v) {
					parser.check(v[key]);
				}
			} else {
				throw new PRSEError('Every method only works with arrays or objects');
			}
			return this.check(v);
		});
	};

	some = (parser: Parser<any>): Parser<T> => {
		return new Parser<T>((v: any) => {
			let isValid = false;
			if (Array.isArray(v)) {
				for (const entry of v) {
					try {
						parser.check(entry);
						isValid = true;
						break;
					} catch (error) {}
				}
			} else if (typeof v === 'object' && v !== null) {
				for (const value in v) {
					try {
						parser.check(v[value]);
						isValid = true;
						break;
					} catch (error) {}
				}
			} else {
				throw new PRSEError('Some method only works with arrays or objects');
			}
			if (!isValid) {
				throw new PRSEError('None of the elements/values match the parser');
			}
			return this.check(v);
		});
	};

	email = (): Parser<string> => {
		return this.pattern(/^\S+@\S+\.\S+$/)
			.map((v: any) => v as string)
			.withMessage('Expected an email, ');
	};

	hasProp = (propertyName: string): Parser<any> => {
		return this.custom((v: any) => v.hasOwnProperty(propertyName), `Property ${propertyName} does not exist`).map((v: any) => v as any);
	};

	creditCard = (): Parser<string> => {
		return this.pattern(/^\d{4}-\d{4}-\d{4}-\d{4}$/)
			.withMessage('Invalid credit card number format')
			.map((v: any) => v as string);
	};

	ipv4 = (): Parser<string> => {
		return this.pattern(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
			.withMessage('Invalid IPv4 address format')
			.map((v: any) => v as string);
	};

	ipv6 = (): Parser<string> => {
		return this.pattern(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)
			.withMessage('Invalid IPv6 address format')
			.map((v: any) => v as string);
	};

	domain = (): Parser<string> => {
		return this.pattern(/^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/)
			.withMessage('Invalid domain format')
			.map((v: any) => v as string);
	};
}

const string = (): Parser<string> =>
	new Parser<string>((v: any) => {
		assert(typeof v === 'string', 'Expected a string');
		return v;
	});

const number = (): Parser<number> =>
	new Parser<number>((v: any) => {
		assert(typeof v === 'number', 'Expected a number');
		return v;
	});

const boolean = (): Parser<boolean> =>
	new Parser<boolean>((v: any) => {
		assert(typeof v === 'boolean', 'Expected a boolean');
		return v;
	});

const unknown = (): Parser<any> => new Parser<any>((v: any) => v);

const object = <T>(schema: { [key: string]: Parser<any> }): Parser<T> =>
	new Parser<T>((v: any) => {
		assert(typeof v === 'object' && v !== null, 'Expected an object');
		if (Object.keys(v).length == 0) {
			return v;
		} else {
			const result: any = {};
			for (const key in schema) {
				if (v.hasOwnProperty(key)) {
					result[key] = schema[key].check(v[key]);
				} else {
					throw new PRSEError(`Missing property: ${key}`);
				}
			}
			return result;
		}
	});

const objectLoose = <T>(schema: { [key: string]: Parser<any> }): Parser<T> =>
	new Parser<T>((v: any) => {
		assert(typeof v === 'object' && v !== null, 'Expected an object');
		const result: any = { ...v };
		for (const key in v) {
			if (schema.hasOwnProperty(key)) {
				result[key] = schema[key].check(v[key]);
			}
		}
		return result;
	});

const array = <T>(elementParser: Parser<T>): Parser<T[]> =>
	new Parser<T[]>((v: any) => {
		assert(Array.isArray(v), 'Expected an array');
		return v.map(elementParser.check);
	});

const record = <T>(vParser: Parser<T>): Parser<{ [key: string]: T }> =>
	new Parser<{ [key: string]: T }>((v: any) => {
		assert(typeof v === 'object' && v !== null && !Array.isArray(v), 'Expected an object');
		const result: { [key: string]: T } = {};
		for (const key in v) {
			result[key] = vParser.check(v[key]);
		}
		return result;
	});

const set = <T>(elementParser: Parser<T>): Parser<Set<T>> =>
	new Parser<Set<T>>((v: any) => {
		assert(v instanceof Set, 'Expected a Set');
		return new Set(Array.from(v).map(elementParser.check));
	});

const map = <K, V>(keyParser: Parser<K>, vParser: Parser<V>): Parser<Map<K, V>> =>
	new Parser<Map<K, V>>((v: any) => {
		assert(v instanceof Map, 'Expected a Map');
		const result = new Map();
		v.forEach((v: any, k: any) => {
			result.set(keyParser.check(k), vParser.check(v));
		});
		return result;
	});

const tuple = <T extends any[]>(parsers: {
	[K in keyof T]: Parser<T[K]>;
}): Parser<T> =>
	new Parser<T>((v: any) => {
		assert(Array.isArray(v), 'Expected an array');
		assert(v.length === parsers.length, 'Array length does not match tuple length');
		return parsers.map((parser, i) => parser.check(v[i])) as T;
	});

const enums = <T extends string | number | symbol>(allowed: T[]): Parser<T> =>
	new Parser<T>((v: any) => {
		assert(allowed.indexOf(v) !== -1, `Expected one of: ${allowed.join(', ')}`);
		return v as T;
	});

const fail = (): never => {
	throw new PRSEError('Validation failed');
};

const date = (): Parser<Date> =>
	new Parser<Date>((v: any) => {
		const parsedDate = new Date(v);
		assert(!isNaN(parsedDate.getTime()), 'Expected a valid date');
		return parsedDate;
	});

const instance = <
	T extends {
		name: any;
		new (...args: any[]): any;
	}
>(
	className: T
): Parser<InstanceType<T>> =>
	new Parser<InstanceType<T>>((v: any) => {
		assert(v instanceof className, `Expected an instance of ${className.name}`);
		return v as InstanceType<T>;
	});

const func = (): Parser<Function> =>
	new Parser<Function>((v: any) => {
		assert(typeof v === 'function', 'Expected a function');
		return v;
	});

const uint8Array = (): Parser<Uint8Array> =>
	new Parser<Uint8Array>((v: any) => {
		assert(v instanceof Uint8Array, 'Expected an Uint8Array');
		return v;
	});

const symbol = (): Parser<symbol> =>
	new Parser<symbol>((v: any) => {
		assert(typeof v === 'symbol', 'Expected a Symbol');
		return v;
	});

const regexp = (): Parser<RegExp> =>
	new Parser<RegExp>((v: any) => {
		assert(v instanceof RegExp, 'Expected a RegExp');
		return v;
	});

const int8Array = (): Parser<Int8Array> =>
	new Parser<Int8Array>((v: any) => {
		assert(v instanceof Int8Array, 'Expected an Int8Array');
		return v;
	});

const bigInt = (): Parser<BigInt> =>
	new Parser<BigInt>((v: any) => {
		assert(typeof v === 'bigint', 'Expected a BigInt');
		return v;
	});

const p = {
	string,
	number,
	boolean,
	unknown,
	object,
	objectLoose,
	array,
	record,
	set,
	map,
	tuple,
	enums,
	fail,
	date,
	instance,
	func,
	uint8Array,
	symbol,
	regexp,
	int8Array,
	bigInt
};

interface ErrorInfo {
	file: string;
	line: string;
	column: string;
}

function getErrorInfo(error: string): ErrorInfo[] {
	const stack: string[] = error.split('\n');
	let info: ErrorInfo[] = [];

	for (let i = 1; i < stack.length; i++) {
		const match = stack[i].trim().match(/at\s+(.*):(\d+):(\d+)/);

		if (match) {
			const [, file, line, column] = match;
			info.push({ file: file.replace('Parser.check (', ''), line, column });
		}
	}

	return info;
}
