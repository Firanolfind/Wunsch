'use strict';

const wrapPromise 	= require('./lib/wrapper');
const Wunsch 		= require('./lib/wunsch');

Wunsch.wrapPromise = wrapPromise;
Wunsch.extend = (obj={}) => Object.assign(obj, Wunsch.prototype);

module.exports = Wunsch;