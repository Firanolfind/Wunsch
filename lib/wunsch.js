'use strict';

const _ 			= require('lodash');
const wrapPromise 	= require('./wrapper');
const nextTick		= process.nextTick;
const isModel 		= require('./is_model');

const Wunsch = function(){};

// Prototype
Wunsch.prototype = {
	//---------------------------------------
	__keeping_promises:			false,
	__current_promise:			null,
	__current_promise_index: 	0,
	__promise_locked: 			false,
	__promise_async: 			false,
	__promises: 				null,
	__catch_fn: 				null,
	__promise_throwable: 		false,
	// can be redefined by custom function
	_wrap_promise: 				wrapPromise,
	/*---------------------------------------*/
	promise: function(fn, args, ctx, append){
		if(!this.__promises) this.__promises = [];
		if(!fn) return this;
		if(this._locked_promise) throw new Error('locked promise, promise function might be ignored');
		this.__promises.push({
			fn: 	fn,
			args: 	args,
			ctx:	ctx,
			append: append
		});
		this.__keep_promises();
		return this;
	},
	/*---------------------------------------*/
	then: function(fn, ctx, append){
		if(!this.__promises) this.__promises = [];
		if(!fn) return this;
		if(this._locked_promise) throw new Error('locked promise, "then" promise function might be ignored');
		this.__promises.push({
			fn: 	fn,
			args: 	[],
			ctx:	ctx,
			append: append,
			then:	true
		});
		this.__keep_promises();
		return this;
	},
	/*---------------------------------------*/
	catch: function(fn, ctx, append){
		ctx || (ctx = this);
		this.__catch_fn = _.bind(fn, ctx);
		return this;
	},
	/*---------------------------------------*/
	__keep_promises: function(){
		if(this.__keeping_promises)
			return this;
		this.__keeping_promises = true;
		this.__resolve_promise();
		return this;
	},
	/*---------------------------------------*/
	__reset_promises: function(){
		this.__promise_locked = true;
		this.__promises = [];
		this.__keeping_promises = false;
		this.__current_promise_index = 0;
		this.__current_promise = null;
		this.__catch_fn = null;
		this.__promise_locked = false;
		return this;
	},
	/*---------------------------------------*/
	__resolve_promise: function(step, args){
		step = ~~step;
		var index = this.__current_promise_index + step;
		var self = this;
		const is_model = isModel(this);
		const length = this.__promises ? this.__promises.length : 0;
		if(this.__promises && this.__promises[index]){
			this.__current_promise_index = index;
			let item = this.__promises[index];
			let ctx = item.ctx;
			ctx || (ctx = this);
			let item_args = item.args;
			let then = item.then;
			if(item.append)
				item_args = item_args ? item_args.concat(args) : args;
			nextTick(()=>{
				if(!then){
					let promise = this.__current_promise = this._wrap_promise(ctx, item.fn, item_args, item.append);
					promise.then(function(){
						if(is_model)
							nextTick(()=>self.trigger('promise:resolved', index, length));
						var args = Array.prototype.slice.call(arguments);
						self.__resolve_promise(true, args);
					}).catch(err=>{
						if(is_model)
							nextTick(()=>this.trigger('promise:rejected', index, length));
						if(this.__catch_fn){
							console.warn('Catch', err);
							this.__catch_fn(err);
							this.__reset_promises();
						}else{
							this.__reset_promises();
							if(this.__promise_throwable)
								throw err;
						}
					});
				}else{
					try{
						item.fn.apply(ctx, item_args);
						if(is_model)
							nextTick(()=>this.trigger('then:resolved', index, length));
						this.__resolve_promise(true);
					}catch(err){
						if(is_model)
							nextTick(()=>this.trigger('then:rejected', index, length));
						if(this.__catch_fn){
							console.warn('Catch', err);
							this.__catch_fn(err);
							this.__reset_promises();
						}else{
							this.__reset_promises();
							if(this.__promise_throwable)
								throw err;
						}
					}
				}
			});
		}else{
			this.__reset_promises();
		}
		return this;
	},
	/*---------------------------------------*/
};

module.exports = Wunsch