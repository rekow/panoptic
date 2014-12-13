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

  if (root)
    this.setRoot(root, path || '');

  for (k in data) {
    if (data.hasOwnProperty(k) && typeof data[k] !== 'function')
      this.bind(k, data[k]);
  }
}

Observable.prototype = {
  /**
   * Returns a value by key.
   * @expose
   * @param {string} key
   * @return {?}
   */
  get: function (key) {
    return Observable.resolve(this, key);
  },

  /**
   * Sets a value by key. Pass an object to set multiple keys at once.
   * @expose
   * @param {(string|Object.<string, ?>)} key
   * @param {?=} value
   */
  set: function (key, value) {
    if (typeof key === 'object' && typeof value === 'undefined') {
      value = key;

      for (key in value) {
        if (value.hasOwnProperty(key))
          Observable.resolve(this, key, value[key]);
      }

      return;
    }

    Observable.resolve(this, /** @type {string} */(key), value);
  },

  /**
   * Replaces the current observed object with a new object. Triggers change events for
   * all removed, modified and added keys.
   * @expose
   * @param {!Object.<string, ?>} data
   * @throws {TypeError} If data is not an object.
   */
  replace: function (data) {
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
  },

  /**
   * Watches an observable object for changes on a key.
   * @expose
   * @param {string} key
   * @param {function(this:Observable, ?)} observer
   */
  watch: function (key, observer) {
    if (this._root)
      return this._root.watch(this._path + '.' + key, observer);

    if (!this._cb[key])
      this._cb[key] = [];

    this._cb[key].push(observer);
  },

  /**
   * Removes an existing watcher for changes on a key.
   * @expose
   * @param {string} key
   * @param {function(this:Observable, ?)=} observer
   */
  unwatch: function (key, observer) {
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
  },

  /**
   * @expose
   * @return {Object}
   */
  toJSON: function () {
    return this._prop;
  },

  /**
   * @expose
   * @private
   * @type {?Observable}
   */
  _root: null,

  /**
   * @expose
   * @private
   * @type {?string}
   */
  _path: null,

  /**
   * @expose
   * @private
   * @const
   */
  constructor: Observable,

  /**
   * Binds observation to a particular key path and value.
   * @private
   * @param {string} key
   * @param {?} value
   */
  bind: function (key, value) {
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

        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Observable))
          return Observable.resolve(this, key, value);

        this._prop[key] = value;
        this.emit(key, value, this);
      }
    });

    this.set(key, value);
  },

  /**
   * Emits a change event for a particular key.
   * @private
   * @param {string} key
   * @param {?} value
   * @param {Observable} observed
   */
  emit: function (key, value, observed) {
    var observers;

    if (this._root)
      return this._root.emit(this._path + '.' + key, value, observed);

    observers = this._cb[key];

    if (!observers)
      return;

    observers.forEach(function (observer) {
      observer.call(observed, value);
    });
  },

  /**
   * Removes a key from the observed object, triggering all nested watchers.
   * @private
   * @param {string} key
   */
  remove: function (key) {
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
  },

  /**
   * Sets another Observable object as the root for the current object.
   * @private
   * @param {!Observable} root
   * @param {!string} path
   */
  setRoot: function (root, path) {
    Object.defineProperty(this, '_root', {
      /**
       * @expose
       * @type {Observable}
       */
      value: root
    });

    Object.defineProperty(this, '_path', {
      /**
       * @expose
       * @type {string}
       */
      value: path
    });
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

    if (!(value instanceof Observable || value instanceof Array))
      value = new Observable(value, root, fullpath);
  }

  observed[pathname] = value;
};

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
