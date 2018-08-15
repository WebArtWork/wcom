angular.module("wcom_mongo", []).service('mongo', function($http, $timeout, socket){
	/*
    *    Data will be storage for all information we are pulling from waw crud.
    *    data['arr' + part] will host all docs from collection part in array form
    *    data['obj' + part] will host all docs from collection part in object form
    *    data['opts' + part] will host options for docs from collection part
    *        Will be initialized only inside get
    *        Will be used inside push
    */
		var data = {};
	/*
	*	waw crud connect functions
	*/
		this.create = function(part, doc, cb) {
			if (typeof doc == 'function') {
				cb = doc;
				doc = {};
			}
			$http.post('/api/' + part + '/create/', doc || {})
				.then(function(resp) {
					if (resp.data) {
						push(part, resp.data);
						if (typeof cb == 'function') cb(resp.data);
					} else if (typeof cb == 'function') {
						cb(false);
					}
				})
		};
		this.get = function(part, opts, cb) {
			if (typeof opts == 'function') {
				cb = opts;
				opts = {};
			}
			if(Array.isArray(data['arr' + part])){
				if(typeof cb == 'function'){
					cb(data['arr' + part], data['obj' + part]);
				}
				return data['arr' + part];
			}
			data['arr' + part] = [];
			data['obj' + part] = {};
			data['opts' + part] = opts || {};
			$http.get('/api/' + part + '/get')
				.then(function(resp) {
					if (resp.data) {
						for (var i = 0; i < resp.data.length; i++) {
							push(part, resp.data[i]);
						}
						if (typeof cb == 'function') cb(data['arr' + part], data['obj' + part]);
					} else if (typeof cb == 'function') {
						cb(false);
					}
					data['loaded'+part]= true;
				})
			return data['arr' + part];
		};
		this.updateAll = function(part, doc, opts, cb) {
			if (typeof opts == 'function') {
				cb = opts;
				opts = {};
			}
			if (typeof opts != 'object') opts = {};
			if (opts.fields) {
				if (typeof opts.fields == 'string') opts.fields = opts.fields.split(' ');
				var _doc = {};
				for (var i = 0; i < opts.fields.length; i++) {
					_doc[opts.fields[i]] = doc[opts.fields[i]];
				}
				doc = _doc;
			}
			$http.post('/api/' + part + '/update/all' + (opts.name || ''), doc)
				.then(function(resp) {
					if (resp.data && typeof cb == 'function') {
						cb(resp.data);
					} else if (typeof cb == 'function') {
						cb(false);
					}
				});
		};
		this.updateUnique = function(part, doc, opts, cb) {
			if (!opts) opts = '';
			if (typeof opts == 'function') {
				cb = opts;
				opts = '';
			}
			if (typeof opts != 'object') opts = {};
			if (opts.fields) {
				if (typeof opts.fields == 'string') opts.fields = opts.fields.split(' ');
				var _doc = {};
				for (var i = 0; i < opts.fields.length; i++) {
					_doc[opts.fields[i]] = doc[opts.fields[i]];
				}
				doc = _doc;
			}
			$http.post('/api/' + part + '/unique/field' + opts, doc).
			then(function(resp) {
				if (typeof cb == 'function') {
					cb(resp.data);
				}
			});
		};
		this.delete = function(part, doc, opts, cb) {
			if (!opts) opts = '';
			if (!doc) return;
			if (typeof opts == 'function') {
				cb = opts;
				opts = '';
			}
			$http.post('/api/' + part + '/delete' + opts, doc)
				.then(function(resp) {
					if (resp.data && Array.isArray(data['arr' + part])) {
						for (var i = 0; i < data['arr' + part].length; i++) {
							if (data['arr' + part][i]._id == doc._id) {
								data['arr' + part].splice(i, 1);
								break;
							}
						}
						delete data['obj' + part][doc._id];
					}
					if (resp && typeof cb == 'function') {
						cb(resp.data);
					} else if (typeof cb == 'function') {
						cb(false);
					}
				});
		};
		this._id = function(cb) {
			if (typeof cb != 'function') return;
			$http.get('/waw/newId').then(function(resp) {
				cb(resp.data);
			});
		};
		this.to_id = function(docs) {
			if (!arr) return [];
			if(Array.isArray(docs)){
	        	docs = docs.slice();
	        }else if(typeof docs == 'object'){
	        	if(docs._id) return [docs._id];
	        	var _docs = [];
	        	for(var key in docs){
	        		if(docs[key]) _docs.push(docs[key]._id||docs[key]);
	        	}
	        	docs = _docs;
	        }
			for (var i = 0; i < docs.length; ++i) {
				if (docs[i]) docs[i] = docs[i]._id || docs[i];
			}
			return docs;
		}
		this.afterWhile = function(doc, cb, time) {
			if (cb && typeof time == 'number') {
				$timeout.cancel(doc.updateTimeout);
				doc.updateTimeout = $timeout(cb, time || 1000);
			}
		};
		var populate = this.populate = function(doc, field, part){	
			if(!doc||!field||!part) return;
			if(data['loaded'+part]){
				console.log(data['arr' + part]);
				console.log(data['obj' + part]);
				if(Array.isArray(field)){
					for(var i = 0; i < field.length; i++){
						populate(doc, field[i], part);
					}
					return;
				}else if(field.indexOf('.')>-1){
					field = field.split('.');
					var sub = field.shift();
					if(typeof doc[sub] != 'object') return;
					return populate(doc[sub], field.join('.'), part);
				}
				if(Array.isArray(doc[field])){
					for(var i = doc[field].length-1; i >= 0; i--){
						if(data['obj'+part][doc[field][i]]){
							doc[field][i] = data['obj'+part][doc[field][i]]
						}else{
							doc[field].splice(i, 1);
						}
					}
					return;
				}else if(typeof doc[field] == 'string'){
					doc[field] = data['obj'+part][doc[field]] || null;
				}else return;
			    }else {
	            	  $timeout(function(){
					  populate(doc, field, part);
				      }, 250);
                }
                console.log(data['obj' + part]);
                console.log(data['arr' + part]);
        }
	/*
	*	mongo replace support functions
	*/
		this.beArr = function(val, cb) {
			if (!Array.isArray(val)) cb([]);
			else cb(val);
		};
		this.beObj = function(val, cb) {
			if (typeof val != 'object' || Array.isArray(val)) {
				val = {};
			}
			cb(val);
		}
		this.beDate = function(val, cb) {
				cb(new Date(val) ) 
		}
		this.forceArr = function(cb) {
			cb([]);
		};
		this.forceObj = function(cb) {
			cb({});
		}
	/*
	*	mongo local support functions
	*/
		var replace = function(doc, value, rpl) {
			if (value.indexOf('.') > -1) {
				value = value.split('.');
				var sub = value.shift();
				if (doc[sub] && (typeof doc[sub] != 'object' || Array.isArray(doc[sub])))
					return;
				if (!doc[sub]) doc[sub] = {};
				return replace(doc[sub], value.join('.'), rpl);
			}
			if (typeof rpl == 'function') {
				rpl(doc[value], function(newValue) {
					doc[value] = newValue;
				}, doc);
			}
		};
		var push = function(part, doc) {
			if (data['opts' + part].replace) {
				for (var key in data['opts' + part].replace) {
					replace(doc, key, data['opts' + part].replace[key]);
				}
			}
			if(data['opts'+part].populate){
				var p = data['opts'+part].populate;
				if(Array.isArray(p)){
					for(var i = 0; i < p.length; i++){
						if(typeof p == 'object' && p[i].field && p[i].part){
							populate(doc, p[i].field, p[i].part);
						}
					}
				}else if(typeof p == 'object' && p.field && p.part){
					populate(doc, p.field, p.part);
				}
			}
			data['arr' + part].push(doc);
			data['obj' + part][doc._id] = doc;
		}
	/*
	*	Endof Mongo Service
	*/
});