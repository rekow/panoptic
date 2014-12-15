/**
 * @file Package test specs for panoptic.
 * @author David Rekow <d@davidrekow.com>
 * @copyright David Rekow 2014
 */

var assert = require("assert"),
  panoptic = require("../src/index.js"),
  equal = assert.equal;

describe("Panopt module", function () {

  var data,
    observed;

  beforeEach(function () {
    data = {
      a: 1,
      b: {
        c: 2,
        d: "3",
        e: [4],
        f: {
          g: "5"
        },
        h: 6
      }
    };

    observed = panoptic(data);
  });

  afterEach(function () {
    data = observed = null;
  });

  it("instantiates an observable object proxy, also proxying subobjects", function () {
    equal(observed.constructor.name, "Observable",
      "observed object's constructor should be Observable, got " + observed.constructor.name);
    equal(observed.b.constructor.name, "Observable",
      "nested observed object should be Observable, got " + observed.b.constructor.name);
    equal(observed.b.f.constructor.name, "Observable",
      "deeply nested observed object should be Observable, got " + observed.b.f.constructor.name);
  });

  it("only observes and proxies instance properties", function () {
    var ct = function () { this.b = 2; };
    ct.prototype.a = 1;
    observed = panoptic(new ct());
    equal(observed.a, undefined,
      "prototype property 'a' should be undefined on observable proxy, got " + observed.a);
    equal(observed.b, 2,
      "instance property 'b' should be 2 on observable proxy, got " + observed.b);
  });

  it("resolves object properties", function () {
    equal(observed.a, 1, "a should be 1, got " + observed.a);
    equal(observed.b.c, 2, "b.c should be 2, got " + observed.b.c);
    equal(observed.b.d, "3", "b.d should be '3', got " + observed.b.d);
    equal(observed.b.e[0], 4, "b.e[0] should be 4, got " + observed.b.e[0]);
    equal(observed.b.f.g, "5", "b.f.g should be '5', got " + observed.b.f.g);
    equal(observed.b.h, 6, "b.h should be 6, got " + observed.b.h);
    equal(observed.b.i, undefined, "b.i should be undefined, got " + observed.b.i);
  });

  it("resolves nested namespaces from the root", function () {
    equal(observed.get("a"), 1, "a is 1");
    equal(observed.get("b.c"), 2, "b.c is 2");
    equal(observed.get("b.d"), "3", "b.d is '3'");
    equal(observed.get("b.e")[0], 4, "b.e[0] is 4");
    equal(observed.get("b.f.g"), "5", "b.f.g is '5'");
    equal(observed.get("b.h"), 6, "b.h is 6");
    equal(observed.get("i.j.k"), undefined, "i.j.k is undefined");
  });

  it("sets object properties", function () {
    observed.a = 2;
    observed.b.c = 3;
    observed.b.d = "4";
    observed.b.e = [5];
    observed.b.f.g = "6";
    observed.b.h = 7;
    equal(observed.get("a"), 2, "updated a is 2");
    equal(observed.get("b.c"), 3, "updated b.c is 3");
    equal(observed.get("b.d"), "4", "updated b.d is '4'");
    equal(observed.get("b.e")[0], 5, "updated b.e[0] is 5");
    equal(observed.get("b.f.g"), "6", "updated b.f.g is '6'");
    equal(observed.get("b.h"), 7, "updated b.h is 7");
  });

  it("sets nested namespaces from the root", function () {
    observed.set("a", 2);
    observed.set("b.c", 3);
    observed.set("b.d", "4");
    observed.set("b.e", [5]);
    observed.set("b.f.g", "6");
    observed.set("b.h", 7);
    observed.set("i.j.k", 8);
    equal(observed.a, 2, "updated a is 2");
    equal(observed.b.c, 3, "updated b.c is 3");
    equal(observed.b.d, "4", "updated b.d is '4'");
    equal(observed.b.e[0], 5, "updated b.e[0] is 5");
    equal(observed.b.f.g, "6", "updated b.f.g is '6'");
    equal(observed.b.h, 7, "updated b.h is 7");
    equal(observed.i.j.k, 8, "new i.j.k is 8");
  });

  it("multisets a flat namespaced object", function () {
    observed.set({
      'b.c': 3,
      'b.d': "4",
      'b.e': [5],
      'b.f.g': "6"
    });

    equal(observed.a, 1, "unchanged a is 1");
    equal(observed.b.c, 3, "updated b.c is 3");
    equal(observed.b.d, "4", "updated b.d is '4'");
    equal(observed.b.e[0], 5, "updated b.e[0] is 5");
    equal(observed.b.f.g, "6", "updated b.f.g is '6'");
    equal(observed.b.h, 6, "expected unchanged b.h is 6, was " + observed.b.h);
  });

  it("multisets a deeply structured object as a diff", function () {
    observed.set({
      b: {
        c: 3,
        d: "4",
        e: [5],
        f: {
          g: "6"
        }
      }
    });

    equal(observed.a, 1, "unchanged a is 1");
    equal(observed.b.c, 3, "updated b.c should be 3, is " + observed.b.c);
    equal(observed.b.d, "4", "updated b.d is '4'");
    equal(observed.b.e[0], 5, "updated b.e[0] is 5");
    equal(observed.b.f.g, "6", "updated b.f.g is '6'");
    equal(observed.b.h, 6, "unchanged b.h is 6");
  });

  it("watches existing observable object properties", function () {
    var updated = 0;

    observed.watch('a', function (v) {
      equal(v, 2, "updated a is 2");
      updated++;
    });
    observed.b.watch('c', function (v) {
      equal(v, 3, "updated b.c is 3");
      updated++;
    });
    observed.b.watch('d', function (v) {
      equal(v, "4", "updated b.d is '4'");
      updated++;
    });
    observed.b.watch('e', function (v) {
      equal(v[0], 5, "updated b.e[0] is 5");
      updated++;
    });
    observed.b.f.watch('g', function (v) {
      equal(v, "6", "updated b.f.g is '6'");
      updated++;
    });
    observed.b.watch('h', function (v) {
      equal(v, 7, "updated b.h is 7");
      updated++;
    });

    observed.a = 2;
    observed.b.c = 3;
    observed.b.d = "4";
    observed.b.e = [5];
    observed.b.f.g = "6";
    observed.b.h = 7;

    equal(updated, 6, "all watchers were called");
  });

  it("watches existing and future nested namespaces from the root", function () {
    var updated = 0
      called = [];

    observed.watch('a', function (v) {
      equal(v, 2, "updated a is 2");
      called.push('a');
      updated++;
    });
    observed.watch('b.c', function (v) {
      equal(v, 3, "updated b.c is 3");
      called.push('b.c');
      updated++;
    });
    observed.watch('b.d', function (v) {
      equal(v, "4", "updated b.d is '4'");
      called.push('b.d');
      updated++;
    });
    observed.watch('b.e', function (v) {
      equal(v[0], 5, "updated b.e[0] is 5");
      called.push('b.e[0]');
      updated++;
    });
    observed.watch('b.f.g', function (v) {
      equal(v, "6", "updated b.f.g is '6'");
      called.push('b.f.g');
      updated++;
    });
    observed.watch('b.h', function (v) {
      equal(v, 7, "updated b.h is 7");
      called.push('b.h');
      updated++;
    });

    observed.watch('b.f.i', function (v) {
      equal(v, 8, "new b.f.i is 8");
      called.push('b.f.i');
      updated++;
    });

    observed.watch('b.j', function (v) {
      equal(v, "9", "new b.j is '9'");
      called.push('b.j');
      updated++;
    });

    observed.watch('b.j', function (v) {
      equal(v, "9", "updated b.j is '9'");
    });

    observed.set("a", 2);
    observed.set("b.c", 3);
    observed.set("b.d", "4");
    observed.set("b.e", [5]);
    observed.set("b.f.g", "6");
    observed.set("b.h", 7);
    observed.set("b.f.i", 8);
    observed.set("b.j", "9");

    equal(updated, 8,
      "expected exactly 8 watchers to be called, called " + updated + ": " + called.join(','));
  });

  it("removes watchers on existing observable object properties", function () {
    var updated = 0,
      aWatcher = function (v) {
        equal(v, 2, "updated a is 2");
        updated++;
      },
      cWatcher = function (v) {
        equal(v, 3, "updated b.c is 3");
        updated++;
      },
      dWatcher = function (v) {
        equal(v, "4", "updated b.d is '4'");
        updated++;
      },
      eWatcher = function (v) {
        equal(v[0], 5, "updated b.e[0] is 5");
        updated++;
      },
      gWatcher = function (v) {
        equal(v, "6", "updated b.f.g is '6'");
        updated++;
      },
      hWatcher = function (v) {
        equal(v, 7, "updated b.h is 7");
        updated++;
      };

    observed.watch('a', aWatcher);
    observed.b.watch('c', cWatcher);
    observed.b.watch('d', dWatcher);
    observed.b.watch('e', eWatcher);
    observed.b.f.watch('g', gWatcher);
    observed.b.watch('h', hWatcher);

    observed.a = 2;
    observed.b.c = 3;
    observed.b.d = "4";
    observed.b.e = [5];
    observed.b.f.g = "6";
    observed.b.h = 7;

    equal(updated, 6, "all watchers were called");

    observed.unwatch('a', aWatcher);
    observed.b.unwatch('c', cWatcher);
    observed.b.unwatch('d', dWatcher);
    observed.b.unwatch('e', eWatcher);
    observed.b.f.unwatch('g', gWatcher);
    observed.b.unwatch('h', hWatcher);
    observed.b.unwatch('h', function () {});

    observed.a = 1;
    observed.b.c = 2;
    observed.b.d = "3";
    observed.b.e = [4];
    observed.b.f.g = "5";
    observed.b.h = 6;

    equal(updated, 6, "no further watchers were called");

  });

  it("removes watchers on nested namespaces from the root", function () {
    var updated = 0,
      aWatcher = function (v) {
        equal(v, 2, "updated a is 2");
        updated++;
      },
      cWatcher = function (v) {
        equal(v, 3, "updated b.c is 3");
        updated++;
      },
      dWatcher = function (v) {
        equal(v, "4", "updated b.d is '4'");
        updated++;
      },
      eWatcher = function (v) {
        equal(v[0], 5, "updated b.e[0] is 5");
        updated++;
      },
      gWatcher = function (v) {
        equal(v, "6", "updated b.f.g is '6'");
        updated++;
      },
      iWatcher = function (v) {
        equal(v, 8, "new b.f.i is 8");
        updated++;
      },
      jWatcher = function (v) {
        equal(v, "9", "new b.j is '9'");
        updated++;
      };

    observed.watch('a', aWatcher);
    observed.watch('b.c', cWatcher);
    observed.watch('b.d', dWatcher);
    observed.watch('b.e', eWatcher);
    observed.watch('b.f.g', gWatcher);
    observed.watch('b.f.i', iWatcher);
    observed.watch('b.j', jWatcher);

    observed.set("a", 2);
    observed.set("b.c", 3);
    observed.set("b.d", "4");
    observed.set("b.e", [5]);
    observed.set("b.f.g", "6");
    observed.set("b.h", 7);
    observed.set("b.f.i", 8);
    observed.set("b.j", "9");

    equal(updated, 7, "all watchers were called");

    observed.unwatch('a', aWatcher);
    observed.unwatch('b.c', cWatcher);
    observed.unwatch('b.d', dWatcher);
    observed.unwatch('b.e', eWatcher);
    observed.unwatch('b.f.g', gWatcher);
    observed.unwatch('b.h');
    observed.unwatch('b.f.i', iWatcher);
    observed.unwatch('b.j');

    observed.set("a", 1);
    observed.set("b.c", 2);
    observed.set("b.d", "3");
    observed.set("b.e", [4]);
    observed.set("b.f.g", "5");
    observed.set("b.h", 6);
    observed.set("b.f.i", 7);
    observed.set("b.j", "8");

    equal(updated, 7, "no further watchers were called");
  });

  it("serializes to JSON", function () {
    equal(JSON.stringify(observed), JSON.stringify(data),
      "expected JSON " + JSON.stringify(observed) + " to equal JSON " + JSON.stringify(data));
  });

  it("removes a key from the observed object, triggering any nested watchers", function () {
    var updated = 0,
      called = [];

    observed.watch('b', function () {
      called.push('b'); updated++;
    });
    observed.watch('b.c', function () {
      called.push('b.c'); updated++;
    });
    observed.watch('b.d', function () {
      called.push('b.d'); updated++;
    });
    observed.watch('b.e', function () {
      called.push('b.e'); updated++;
    });
    observed.watch('b.f.g', function () {
      called.push('b.f.g'); updated++;
    });
    observed.watch('b.h', function () {
      called.push('b.h'); updated++;
    });

    observed.b = null;

    equal(updated, 6,
      "expected exactly 6 watchers to be called, called " + updated + ": " + called.join(','));
  });

  it("removes a key from the observed object, only triggering watchers for existing properties", function () {
    var updated = 0,
      called = [];

    observed.watch('b', function () {
      called.push('b'); updated++;
    });
    observed.watch('b.c', function () {
      called.push('b.c'); updated++;
    });
    observed.watch('b.d', function () {
      called.push('b.d'); updated++;
    });
    observed.watch('b.e', function () {
      called.push('b.e'); updated++;
    });
    observed.watch('b.f.g', function () {
      called.push('b.f.g'); updated++;
    });
    observed.watch('b.h', function () {
      called.push('b.h'); updated++;
    });
    observed.watch('b.f.i', function () {
      called.push('b.f.i'); updated++;
    });
    observed.watch('b.j', function () {
      called.push('b.j'); updated++;
    });

    observed.b = null;

    equal(updated, 6,
      "expected exactly 6 watchers to be called, called " + updated + ": " + called.join(','));
  });

  it("replaces the entire watched dataset, triggering any nested watchers", function () {
    var updated = 0,
      called = [];

    observed.watch('a', function () {
      called.push('a'); updated++;
    });
    observed.watch('b', function () {
      called.push('b'); updated++;
    });
    observed.watch('b.c', function () {
      called.push('b.c'); updated++;
    });
    observed.watch('b.d', function () {
      called.push('b.d'); updated++;
    });
    observed.watch('b.e', function () {
      called.push('b.e'); updated++;
    });
    observed.watch('b.f.g', function () {
      called.push('b.f.g'); updated++;
    });
    observed.watch('b.h', function () {
      called.push('b.h'); updated++;
    });
    observed.watch('i', function () {
      called.push('i'); updated++;
    });

    observed.replace({i: 2});

    equal(updated, 8,
      "expected exactly 8 watchers to be called, called " + updated + ": " + called.join(','));
  });

  it("replaces the entire watched dataset, only triggering watchers for existing properties", function () {
    var updated = 0,
      called = [];

    observed.watch('a', function () {
      called.push('a'); updated++;
    });
    observed.watch('b', function () {
      called.push('b'); updated++;
    });
    observed.watch('b.c', function () {
      called.push('b.c'); updated++;
    });
    observed.watch('b.d', function () {
      called.push('b.d'); updated++;
    });
    observed.watch('b.e', function () {
      called.push('b.e'); updated++;
    });
    observed.watch('b.f.g', function () {
      called.push('b.f.g'); updated++;
    });
    observed.watch('b.h', function () {
      called.push('b.h'); updated++;
    });
    observed.watch('i', function () {
      called.push('i'); updated++;
    });
    observed.watch('X', function () {
      called.push('X'); updated++;
    });

    observed.replace({i: 2});

    equal(updated, 8,
      "expected exactly 8 watchers to be called, called " + updated + ": " + called.join(','));
  });

});
