<p align="center"><img src="https://github.com/Axorax/prse.js/raw/main/prse.png" width="100" height="100"></p>

<p align="center"><strong>prse</strong></p>
<p align="center">Simple validation library with plenty of features</p>

# ❓About

prse (pronounced as parse) allows you to validate your data in JavaScript with a simple yet powerful syntax.

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

---

### 📖 Checkout the full documentation here: https://github.com/Axorax/prse.js/blob/main/docs.md

---

<p align="center"><a href="https://www.patreon.com/axorax">Support me on Patreon</a> — <a href="https://github.com/axorax/socials">Check out my socials</a></p>
