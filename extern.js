/**
 * @file Externs for panoptic.
 * @author  David Rekow <d@davidrekow.com>
 * @copyright (c) David Rekow 2014
 * @externs
 */

/**
 * @typedef {Object}
 */
var Observable;

/**
 * @param {string} key
 * @return {*}
 */
Observable.prototype.get = function (key) {};

/**
 * @param {string} key
 * @param {*} value
 */
Observable.prototype.set = function (key, value) {};

/**
 * @param {string} key
 * @param {function(this:Observable, *)} observer
 */
Observable.prototype.watch = function (key, observer) {};

/**
 * @param {string} key
 * @param {function(this:Observable, *)=} observer
 */
Observable.prototype.unwatch = function (key, observer) {};

/**
 * @return {string}
 */
Observable.prototype.toJSON = function () {};

/**
 * @typedef {function(*): Observable}
 */
var panoptic;
