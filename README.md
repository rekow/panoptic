#panoptic
simple object keypath observers.

[![Build Status](https://travis-ci.org/davidrekow/panoptic.svg?branch=master)](https://travis-ci.org/davidrekow/panoptic) [![Coverage Status](https://coveralls.io/repos/davidrekow/panoptic/badge.png?branch=master)](https://coveralls.io/r/davidrekow/panoptic?branch=master)

##Installation
###node
Add to your `dependencies` in `package.json`:
```javascript
  ...
  "dependencies": {
    "panoptic": "~0.0.8",
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
  name: 'David Rekow',
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
To set multiple keys at once, simply pass an object to `set()`:
```javascript
observable.set({  // as a flat namespaced object
  'a': true,
  'b.c': 12
});
observable.set({  // as a fully-structured object - will be set as diff
  a: true,
  b: {
    c: 12
  }
});
```
Setting via object property syntax only works if the key has already been seen -
if you're adding a new key, use `set()` to ensure the observation chain is set up.
###removing
```javascript
observable.set('a.b', null);
observable.a.b = null;
```
To remove a key from an observable object simply set it to `null`. If the key
currently points to a nested object, watchers for any existing nested properties
will be invoked before removing the key:
```javascript
observable = panoptic({
  a: {
    b: {
      c: 1
    }
  }
});

observable.watch('a.b.c', function (value) {
  console.log('"a.b.c" value: ' + value);
});
observable.watch('a.b.d', function (value) {
  console.log('"a.b.d" value: ' + value);
});
observable.watch('a.b', function (value) {
  console.log('"a.b" value: ' + value);
});

observable.a.b = null;
```
outputs
```
"a.b.c" value: null
"a.b" value: null
```
Because the key `a.b.d` had not yet been set, its watcher did not fire.
###replacing
```javascript
observable.replace({key: 'newValue'});
```
Calling `replace()` replaces the current observed data entirely with the passed data,
triggering watchers for removed, modified and added keys. This method uses `remove()`
behind the scenes, so only watchers for existing properties will fire upon removal
or modification. Any already-registered watchers for properties being added will be
invoked.
###watching
```javascript
observable.watch('a.b.c', function (newValue) {
  var value = this.get('c');  // 'this' is the object actually holding the value
  value === newValue;         // watcher receives the new value after it's set
});
```
Nested watchers will trigger parent watchers after triggering their own:
```javascript
observable.watch('a', function () {
  console.log('reached "a" watcher');
});

observable.watch('a.b', function () {
  console.log('reached "a.b" watcher');
});

observable.set('a.b', 5);
```
outputs
```
reached "a.b" watcher
reached "a" watcher
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
*pan* (all) + *optic* (seeing), derived from *panopticon* (the non-terrible connotations!)

Find a bug? Please [file an issue](https://github.com/davidrekow/panoptic/issues)!
