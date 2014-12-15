/*jshint sub:true */
/**
 * @file Main panoptic module.
 * @author David Rekow <d@davidrekow.com>
 * @copyright David Rekow 2014
 */

/**
 * Observable proxy for an object.
 * @constructor
 * @param {?} data Object to watch for changes.
 * @param {Observable=} root Root Observable object in this branch.
 * @param {string=} path Path relative to root.
 */
function Observable (data, root, path) {
  var k;

  data = data || {};

  /**
   * @expose
   * @private
   * @type {Object.<string, ?>}
   */
  this._prop = {};

  /**
   * @expose
   * @private
   * @type {Object.<string, Array.<function(this:Observable, ?)>>}
   */
  this._cb = {};

  /**
   * @expose
   * @private
   * @type {?Observable}
   */
  this._root = root || null;

  /**
   * @expose
   * @private
   * @type {string}
   */
  this._path = typeof path === 'string' ? path : '';

  for (k in data) {
    if (data.hasOwnProperty(k) && typeof data[k] !== 'function')
      this.bind(k, data[k]);
  }
}

/**
 * Returns a value by key.
 * @expose
 * @param {string} key
 * @return {?}
 */
Observable.prototype.get = function (key) {
  return Observable.resolve(this, key);
};

/**
 * Sets a value by key. Pass an object to set multiple keys at once.
 * @expose
 * @param {(string|Object.<string, ?>)} key
 * @param {?=} value
 */
Observable.prototype.set = function (key, value) {
  if (typeof key === 'object' && typeof value === 'undefined') {
    value = key;

    for (key in value) {
      if (value.hasOwnProperty(key))
        Observable.resolve(this, key, value[key]);
    }

    return;
  }

  Observable.resolve(this, /** @type {string} */(key), value);
};

/**
 * Replaces the current observed object with a new object. Triggers change events for
 * all removed, modified and added keys.
 * @expose
 * @param {!Object.<string, ?>} data
 * @throws {TypeError} If data is not an object.
 */
Observable.prototype.replace = function (data) {
  /*jshint eqnull:true */
  var added = {},
    key, value;

  if (typeof data !== 'object')
    throw new TypeError('Fragment.replace() expects an object as the only parameter.');

  for (key in this._prop) {
    if (this._prop.hasOwnProperty(key) && data[key] === undefined)
      this[key] = null;
  }

  for (key in data) {
    if (data.hasOwnProperty(key)) {
      value = this.get(key);

      if (value instanceof Observable)
        value.replace(data[key] || {});

      this.set(key, data[key]);
    }
  }
};

/**
 * Watches an observable object for changes on a key.
 * @expose
 * @param {string} key
 * @param {function(this:Observable, ?)} observer
 */
Observable.prototype.watch = function (key, observer) {
  if (this._root)
    return this._root.watch(this._path + '.' + key, observer);

  if (!this._cb[key])
    this._cb[key] = [];

  this._cb[key].push(observer);
};

/**
 * Removes an existing watcher for changes on a key.
 * @expose
 * @param {string} key
 * @param {function(this:Observable, ?)=} observer
 */
Observable.prototype.unwatch = function (key, observer) {
  var i;

  if (this._root)
    return this._root.unwatch(this._path + '.' + key, observer);

  if (!this._cb[key])
    return;

  if (!observer) {
    this._cb[key] = [];
    return;
  }

  i = this._cb[key].indexOf(observer);

  if (i > -1)
    this._cb[key].splice(i, 1);
};

/**
 * @expose
 * @return {Object}
 */
Observable.prototype.toJSON = function () {
  return this._prop;
};

/**
 * Binds observation to a particular key path and value.
 * @expose
 * @private
 * @param {string} key
 * @param {?} value
 */
Observable.prototype.bind = function (key, value) {
  Object.defineProperty(this, key, {
    /**
     * @expose
     * @type {boolean}
     */
    enumerable: true,

    /**
     * @expose
     * @this {Observable}
     * @return {?}
     */
    get: function () {
      return this._prop[key];
    },

    /**
     * @expose
     * @this {Observable}
     * @param {?} value
     */
    set: function (value) {
      if (value === null) {
        this.remove(key);
        value = undefined;
      }

      if (typeof value === 'object' &&
          !(value instanceof Observable) &&
          !(value instanceof ObservableArray)) {
        if (value.constructor !== Array)
          return Observable.resolve(this, key, value);

        value = new ObservableArray(
          value,
          this._root || this,
          this._path ? this._path + '.' + key : key);
      }

      this._prop[key] = value;
      this.emit(key, value, this);
    }
  });

  this.set(key, value);
};

/**
 * Emits a change event for a particular key.
 * @expose
 * @private
 * @param {string} key
 * @param {?} value
 * @param {Observable} observed
 */
Observable.prototype.emit = function (key, value, observed) {
  var observers;

  if (this._root)
    return this._root.emit(this._path + '.' + key, value, observed);

  observers = this._cb[key];

  if (!observers)
    return;

  observers.forEach(function (observer) {
    observer.call(observed, value);
  });
};

/**
 * Removes a key from the observed object, triggering all nested watchers.
 * @expose
 * @private
 * @param {string} key
 */
Observable.prototype.remove = function (key) {
  var k;

  if (this._root)
    return this._root.remove(this._path + '.' + key);

  for (k in this._cb) {
    if (this._cb.hasOwnProperty(k) &&
      k.indexOf(key) === 0 &&
      k !== key &&
      this.get(k))
      this.emit(k, null, this);
  }
};

/**
 * Resolves a value on an Observable object by string key and gets or sets it.
 * @private
 * @static
 * @param {Observable} observed
 * @param {string} key
 * @param {?=} value
 * @return {?}
 */
Observable.resolve = function (observed, key, value) {
  var path = key.split('.'),
    pathname = path.pop(),
    fullpath = observed._path || '',
    root = observed._root || observed,
    _path, i;

  for (i = 0; i < path.length; i++) {
    _path = path[i];

    fullpath += fullpath ? '.' + _path : _path;

    if (!observed[_path]) {
      if (value === undefined || value === null)
        return null;

      if (observed.hasOwnProperty(_path)) {
        observed[_path] = new Observable(null, root, fullpath);
      } else {
        observed.bind(_path, new Observable(null, root, fullpath));
      }
    }

    observed = observed[_path];
  }

  fullpath += fullpath ? '.' + pathname : pathname;

  if (value === undefined)
    return observed[pathname];

  if (!observed.hasOwnProperty(pathname))
    observed.bind(pathname);

  if (typeof value === 'object') {
    if (observed[pathname] instanceof Observable)
      return observed[pathname].set(value);

    if (!(value instanceof Observable) && !(value instanceof Array))
      value = new Observable(value, root, fullpath);
  }

  observed[pathname] = value;
};


/**
 * An Observable Array implementation. Requires a root Observable object.
 * @extends {Array}
 * @constructor
 * @param {?Array.<*>} data
 * @param {Observable} root
 * @param {string} path
 */
function ObservableArray (data, root, path) {
  var array = this;

  /**
   * @type {number}
   */
  this.length = 0;

  Array.call(this);

  Object.defineProperty(this, 'emit', {
    /**
     * @expose
     * @param {boolean=} length If true, emit a length change instead of value change.
     * @this {ObservableArray}
     */
    value: function (length) {
      if (length === true)
        return root.emit(path + '.length', this.length, root);

      return root.emit(path, this, root);
    }
  });

  if (data)
    Array.prototype.push.apply(this, data);
}

ObservableArray.prototype = Object.create(Array.prototype);
Object.defineProperty(ObservableArray.prototype, 'constructor', {
  /**
   * @expose
   * @type {function(new: ObservableArray, ?Array.<*>, Observable, string)}
   */
  value: ObservableArray
});

/**
 * @expose
 * @param {boolean=} length If true, emit a length change instead of value change.
 */
ObservableArray.prototype.emit;

/**
 * @override
 * @param {...[*]} item
 * @return {number}
 */
ObservableArray.prototype.push;

Object.defineProperty(ObservableArray.prototype, 'push', {
  /**
   * @expose
   * @param {...[*]} item
   * @return {number}
   * @this {ObservableArray}
   */
  value: function (item) {
    var length = this.length;

    Array.prototype.push.apply(this, arguments[1] ? arguments : [item]);

    this.emit();

    if (this.length !== length)
      this.emit(true);

    return this.length;
  }
});

/**
 * @override
 * @param {...[*]} item
 * @return {number}
 */
ObservableArray.prototype.unshift;

Object.defineProperty(ObservableArray.prototype, 'unshift', {
  /**
   * @expose
   * @param {...[*]} item
   * @return {number}
   * @this {ObservableArray}
   */
  value: function (item) {
    var length = this.length;

    Array.prototype.unshift.apply(this, arguments[1] ? arguments : [item]);

    this.emit();

    if (this.length !== length)
      this.emit(true);

    return this.length;
  }
});

/**
 * @override
 * @return {?}
 */
ObservableArray.prototype.pop;

Object.defineProperty(ObservableArray.prototype, 'pop', {
  /**
   * @expose
   * @return {?}
   * @this {ObservableArray}
   */
  value: function () {
    var length = this.length,
      item = Array.prototype.pop.call(this);

    this.emit();

    if (this.length !== length)
      this.emit(true);

    return item;
  }
});

/**
 * @override
 * @return {?}
 */
ObservableArray.prototype.shift;

Object.defineProperty(ObservableArray.prototype, 'shift', {
  /**
   * @expose
   * @return {?}
   * @this {ObservableArray}
   */
  value: function () {
    var length = this.length,
      item = Array.prototype.shift.call(this);

    this.emit();

    if (this.length !== length)
      this.emit(true);

    return item;
  }
});

/**
 * @override
 * @param {*=} index
 * @param {*=} remove
 * @param {...[*]} item
 * @return {Array.<*>}
 */
ObservableArray.prototype.splice;

Object.defineProperty(ObservableArray.prototype, 'splice', {
  /**
   * @expose
   * @param {*=} index
   * @param {*=} remove
   * @param {...[*]} item
   * @return {Array.<*>}
   * @this {ObservableArray}
   */
  value: function (index, remove, item) {
    var length = this.length;

    item = Array.prototype.splice.apply(this, arguments);

    this.emit();

    if (this.length !== length)
      this.emit(true);

    return item;
  }
});

/**
 * @override
 * @return {Array.<*>}
 */
ObservableArray.prototype.toJSON;

Object.defineProperty(ObservableArray.prototype, 'toJSON', {
  /**
   * @return {Array.<*>}
   * @this {ObservableArray}
   */
  value: function () {
    return this.slice();
  }
});


/**
 * Return a new Observable object.
 * @expose
 * @param {?} data
 * @param {Observable=} root
 * @return {Observable}
 */
var panoptic = function (data, root) {
  if (data instanceof Observable)
    return root ? (data._root = root, data) : data;

  return new Observable(data, root);
};

if (typeof window !== 'undefined' && window.self === window) {
  /** @expose */
  window.panoptic = panoptic;
}

if (typeof module !== 'undefined' && typeof module['exports'] === 'object') {
  /** @expose */
  module.exports = panoptic;
}

if (typeof define === 'function')
  define('panoptic', panoptic);
