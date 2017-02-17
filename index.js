'use strict';

const _ 			= require('lodash');
const wrapPromise 	= require('./lib/wrapper');
const Wunsch 		= require('./lib/wunsch');

Wunsch.wrapPromise = wrapPromise;
Wunsch.extend = function(core={}){
	return _.extend(core, Wunsch.prototype);
};

module.exports = Wunsch;