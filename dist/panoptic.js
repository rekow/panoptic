(function () {/*
 David Rekow 2014
*/
function Observable(data, root, path) {
  var k;
  if (root) {
    Observable.setRoot(this, root, path);
  }
  this._prop = {};
  this._cb = {};
  for (k in data) {
    if (data.hasOwnProperty(k) && typeof data[k] !== "function") {
      this.bind(k, data[k]);
    }
  }
}
Observable.prototype = {get:function(key) {
  return Observable.resolve(this, key);
}, set:function(key, value) {
  Observable.resolve(this, key, value);
}, watch:function(key, observer) {
  if (this._root) {
    return this._root.watch(this._path + "." + key, observer);
  }
  if (!this._cb[key]) {
    this._cb[key] = [];
  }
  this._cb[key].push(observer);
}, unwatch:function(key, observer) {
  var i;
  if (this._root) {
    return this._root.unwatch(this._path + "." + key, observer);
  }
  if (!this._cb[key]) {
    return;
  }
  if (!observer) {
    this._cb[key] = [];
    return;
  }
  i = this._cb[key].indexOf(observer);
  if (i > -1) {
    this._cb[key].splice(i, 1);
  }
}, toJSON:function() {
  return this._prop;
}, _root:null, _path:null, constructor:Observable, emit:function(key, value, observed) {
  var observers;
  if (this._root) {
    return this._root.emit(this._path + "." + key, value, observed);
  }
  observers = this._cb[key];
  if (!observers) {
    return;
  }
  observers.forEach(function(observer) {
    observer.call(observed, value);
  });
}, bind:function(key, value) {
  Object.defineProperty(this, key, {enumerable:true, get:function() {
    return this._prop[key];
  }, set:function(value) {
    this._prop[key] = value;
    this.emit(key, value, this);
  }});
  this.set(key, value);
}};
Observable.resolve = function(observed, key, value) {
  var path = key.split("."), pathname = path.pop(), fullpath = observed._path || "", root = observed._root || observed, _path, i;
  for (i = 0;i < path.length;i++) {
    _path = path[i];
    fullpath += "." + _path;
    if (!observed.hasOwnProperty(_path)) {
      if (value === undefined || value === null) {
        return null;
      }
      observed.bind(_path, new Observable(null, root, fullpath));
    }
    observed = observed[_path];
  }
  fullpath += fullpath ? "." + pathname : pathname;
  if (value === undefined) {
    return observed[pathname];
  }
  if (typeof value === "object" && !(value instanceof Observable || value instanceof Array)) {
    value = new Observable(value, root, fullpath);
  }
  if (!observed.hasOwnProperty(pathname)) {
    observed.bind(pathname);
  }
  observed[pathname] = value;
};
Observable.setRoot = function(observed, root, path) {
  Object.defineProperty(observed, "_root", {value:root});
  Object.defineProperty(observed, "_path", {value:path});
};
this.panoptic = function(data) {
  return new Observable(data);
};
if (typeof module !== "undefined" && typeof module["exports"] === "object") {
  module.exports = this.panoptic;
}
if (typeof define === "function") {
  define("panoptic", this.panoptic);
}
;}).call(this);
