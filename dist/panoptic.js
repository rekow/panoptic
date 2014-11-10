(function () {/*
 David Rekow 2014
*/
function Observable(a, b, c) {
  var d;
  b && Observable.setRoot(this, b, c || "");
  this._prop = {};
  this._cb = {};
  for (d in a) {
    a.hasOwnProperty(d) && "function" !== typeof a[d] && this.bind(d, a[d]);
  }
}
Observable.prototype = {get:function(a) {
  return Observable.resolve(this, a);
}, set:function(a, b) {
  if ("object" === typeof a && "undefined" === typeof b) {
    for (a in b = a, b) {
      b.hasOwnProperty(a) && Observable.resolve(this, a, b[a]);
    }
  } else {
    Observable.resolve(this, a, b);
  }
}, watch:function(a, b) {
  if (this._root) {
    return this._root.watch(this._path + "." + a, b);
  }
  this._cb[a] || (this._cb[a] = []);
  this._cb[a].push(b);
}, unwatch:function(a, b) {
  var c;
  if (this._root) {
    return this._root.unwatch(this._path + "." + a, b);
  }
  this._cb[a] && (b ? (c = this._cb[a].indexOf(b), -1 < c && this._cb[a].splice(c, 1)) : this._cb[a] = []);
}, toJSON:function() {
  return this._prop;
}, _root:null, _path:null, constructor:Observable, emit:function(a, b, c) {
  if (this._root) {
    return this._root.emit(this._path + "." + a, b, c);
  }
  (a = this._cb[a]) && a.forEach(function(a) {
    a.call(c, b);
  });
}, bind:function(a, b) {
  Object.defineProperty(this, a, {enumerable:!0, get:function() {
    return this._prop[a];
  }, set:function(b) {
    this._prop[a] = b;
    this.emit(a, b, this);
  }});
  this.set(a, b);
}};
Observable.resolve = function(a, b, c) {
  b = b.split(".");
  var d = b.pop(), e = a._path || "", h = a._root || a, f, g;
  for (g = 0;g < b.length;g++) {
    f = b[g];
    e += "." + f;
    if (!a.hasOwnProperty(f)) {
      if (void 0 === c || null === c) {
        return null;
      }
      a.bind(f, new Observable(null, h, e));
    }
    a = a[f];
  }
  e += e ? "." + d : d;
  if (void 0 === c) {
    return a[d];
  }
  a.hasOwnProperty(d) || a.bind(d);
  if ("object" === typeof c) {
    if (a[d] instanceof Observable) {
      return a[d].set(c);
    }
    c instanceof Observable || c instanceof Array || (c = new Observable(c, h, e));
  }
  a[d] = c;
};
Observable.setRoot = function(a, b, c) {
  Object.defineProperty(a, "_root", {value:b});
  Object.defineProperty(a, "_path", {value:c});
};
var panoptic = function(a) {
  return new Observable(a);
};
"undefined" !== typeof window && window.self === window && (window.panoptic = panoptic);
"undefined" !== typeof module && "object" === typeof module.exports && (module.exports = panoptic);
"function" === typeof define && define("panoptic", panoptic);
}).call(this);
