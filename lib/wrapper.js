'use strict';

const _ = require('lodash');

const wrapPromise = function wrapPromise(context, fn, args, append){
	if(_.isArray(fn)){
		let promises = [];
		for(let func of fn){
			promises.push(wrapPromise(context, func, args, append));
		}
		return Promise.all(promises);
	}else return new Promise((resolve, reject) => {
		const callback = function(result){
			var cbArgs = Array.prototype.slice.call(arguments);
			if(append)
				cbArgs = args ? cbArgs.concat(args) : cbArgs;
			if(result instanceof Error) {
				return reject.apply(this, cbArgs);
			}
			return resolve.apply(this, cbArgs);
		};
		fn.apply(context, args ? [callback,...args] : [callback]);
	});
};

module.exports = wrapPromise;