'use strict';

const _ 			= require('lodash');
const nextTick		= process.nextTick;
const isModel 		= require('./is_model');

// Class function
const Wunsch = function(){};

// promise wrapper fn
const wrapPromise 	= require('./wrapper');

// Symbols for hidden methods
const keep_promises 		= Symbol('keep_promises');
const reset_promises 		= Symbol('reset_promises');
const resolve_promise 		= Symbol('resolve_promise');
const keeping_promises 		= Symbol('keeping_promises');
const current_promise 		= Symbol('current_promise');
const current_promise_index = Symbol('current_promise_index');
const promise_locked 		= Symbol('promise_locked');
const promise_async 		= Symbol('promise_async');
const promises 				= Symbol('promises');
const catch_fn 				= Symbol('catch_fn');
const promise_throwable 	= Symbol('promise_throwable');
const wrap_promise 			= Symbol('wrap_promise');

// Prototype
Wunsch.prototype = {
	//---------------------------------------
	[keeping_promises]:			false,
	[current_promise]:			null,
	[current_promise_index]: 	0,
	[promise_locked]: 			false,
	[promise_async]: 			false,
	[promises]: 				null,
	[catch_fn]: 				null,
	[promise_throwable]: 		false,
	[wrap_promise]: 			wrapPromise,
	/*---------------------------------------*/
	[keep_promises]: function(){
		if(this[keeping_promises])
			return this;
		this[keeping_promises] = true;
		this[resolve_promise]();
		return this;
	},
	/*---------------------------------------*/
	[reset_promises]: function(){
		this[promise_locked] = true;
		this[promises] = [];
		this[keeping_promises] = false;
		this[current_promise_index] = 0;
		this[current_promise] = null;
		this[catch_fn] = null;
		this[promise_locked] = false;
		return this;
	},
	/*---------------------------------------*/
	[resolve_promise]: function(step, args){
		step = ~~step;
		var index = this[current_promise_index] + step;
		var self = this;
		const is_model = isModel(this);
		const length = this[promises] ? this[promises].length : 0;
		if(this[promises] && this[promises][index]){
			this[current_promise_index] = index;
			let item = this[promises][index];
			let ctx = item.ctx;
			ctx || (ctx = this);
			let item_args = item.args;
			let then = item.then;
			if(item.append)
				item_args = item_args ? item_args.concat(args) : args;
			nextTick(()=>{
				if(!then){
					let promise = this[current_promise] = this[wrap_promise](ctx, item.fn, item_args, item.append);
					promise.then(function(){
						if(is_model)
							nextTick(()=>self.trigger('promise:resolved', index, length));
						var args = [...arguments];
						self[resolve_promise](true, args);
					}).catch(err=>{
						if(is_model)
							nextTick(()=>this.trigger('promise:rejected', index, length));
						if(this[catch_fn]){
							// console.warn('Error Catched', err);
							this[catch_fn](err);
							this[reset_promises]();
						}else{
							this[reset_promises]();
							if(this[promise_throwable])
								throw err;
						}
					});
				}else{
					try{
						item.fn.apply(ctx, item_args);
						if(is_model)
							nextTick(()=>this.trigger('then:resolved', index, length));
						this[resolve_promise](true);
					}catch(err){
						if(is_model)
							nextTick(()=>this.trigger('then:rejected', index, length));
						if(this[catch_fn]){
							console.warn('Catch', err);
							this[catch_fn](err);
							this[reset_promises]();
						}else{
							this[reset_promises]();
							if(this[promise_throwable])
								throw err;
						}
					}
				}
			});
		}else{
			this[reset_promises]();
		}
		return this;
	},
	/*---------------------------------------*/
	promise: function(fn, args, ctx, append){
		if(!this[promises]) this[promises] = [];
		if(!fn) return this;
		if(this[promise_locked]) throw new Error('locked promise, "promise" function might be ignored');
		this[promises].push({
			fn: 	fn,
			args: 	args,
			ctx:	ctx,
			append: append
		});
		this[keep_promises]();
		return this;
	},
	/*---------------------------------------*/
	then: function(fn, ctx, append){
		if(!this[promises]) this[promises] = [];
		if(!fn) return this;
		if(this[promise_locked]) throw new Error('locked promise, "then" promise function might be ignored');
		this[promises].push({
			fn: 	fn,
			args: 	[],
			ctx:	ctx,
			append: append,
			then:	true
		});
		this[keep_promises]();
		return this;
	},
	/*---------------------------------------*/
	catch: function(fn, ctx, append){
		ctx || (ctx = this);
		this[catch_fn] = _.bind(fn, ctx);
		return this;
	},
	/*---------------------------------------*/
};

module.exports = Wunsch