#panoptic
simple object keypath observers.

[![Build Status](https://travis-ci.org/davidrekow/panoptic.svg?branch=master)](https://travis-ci.org/davidrekow/panoptic) [![Coverage Status](https://coveralls.io/repos/davidrekow/panoptic/badge.png?branch=master)](https://coveralls.io/r/davidrekow/panoptic?branch=master)

##Installation
###node
Add to your `dependencies` in `package.json`:
```javascript
  ...
  "dependencies": {
    "panoptic": "~0.0.1",
    ...
  },
  ...
```
or install directly:
```sh
npm install --save panoptic
```
###browser
Include either of the bundles in the `dist/` folder of the [repo](https://github.com/davidrekow/panoptic),
depending on whether or not you'd like it minified.

##Usage
Import the `panoptic` module:
```javascript
var panoptic = require('panoptic');
```
then call with an object you want to observe:
```javascript
var data = {
  name: 'Cool Person',
  age: 25
};

var observable = panoptic(data);
```
###getting
```javascript
value = observable.get('key');
value = observable.key;
```
Retrieve the value for a particular key via getter or object property access.
If you're not sure whether the key exists before accessing, use `get()` to
avoid a TypeError when retrieving deeply nested values:
```javascript
value = observable.get('a.b.c');  // if a or b doesn't exist, returns null
value = observable.a.b.c;         // if a or b doesn't exist, throws TypeError
```
###setting
```javascript
observable.set('key', value);
observable.key = value;
```
Set the value of a key in the same way. If setting a deeply nested key and you
don't know whether intermediate objects exist, use `set()` and they will be
created (think `mkdir -p`):
```javascript
observable.set('a.b.c', value);   // if a or b doesn't exist they will be created
observable.a.b.c = value;         // if a or b doesn't exist, throws TypeError
```
###watching
```javascript
observable.watch('a.b.c', function (newValue) {
  var value = this.get('c');  // 'this' is the object the value is retrieved from
  value === newValue;         // watcher receives the new value after it's set
});
```
###unwatching
```javascript
var watcher = function (newValue) { ... };

observable.watch('key', watcher);
observable.unwatch('key', watcher);  // if watcher is passed, only it gets removed
observable.unwatch('key');           // if no watcher is passed, all get removed
```
That's it!

##FAQ
###why panoptic?
it's super lightweight, matches whatever data access syntax you're currently
using, and uses a simple but powerful sparse-tree data structure to avoid the
overhead of propagation and digest cycles when dispatching change events.

###why `panoptic`?
panopticon (the less morbid connotations), also *pan* (all) + *opt* (option?)

Find a bug? Please [file an issue](https://github.com/davidrekow/panoptic/issues)!
