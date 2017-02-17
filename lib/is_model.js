'use strict';

var hasBM;
var Backbone;
var Marionette;

try{
	Backbone 	= require('backbone');
	Marionette 	= require('marionette');
	hasBM = true;
}catch(e){
	hasBM = false;
}

module.exports = function(obj){
	if(!hasBM) return false;
	return obj instanceof Backbone.Model || obj instanceof Marionette.Object;
};

