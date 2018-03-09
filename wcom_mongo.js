angular.module("wcom_mongo", []).service('mongo', function($http, $timeout, socket){
	var self = this;
	this.cl = {}; // collection
	this.clpc = {}; // complete collection pulled boolean
	this.clp = {}; // collection pulled boolean
	this._id = function(cb){
		if(typeof cb != 'function') return;
		$http.get('/waw/newId').then(function(resp){
			cb(resp.data);
		});
	};
	var replace = function(doc, value, rpl){
		if(typeof rpl == 'function'){
			rpl(doc[value], function(newValue){
				doc[value] = newValue;
			}, doc);
		}
	};
	this.push = function(part, doc, rpl){
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}
		Array.isArray(self.cl[part])&&self.cl[part].push(doc);
	};
	this.unshift = function(part, doc, rpl){
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}
		Array.isArray(self.cl[part])&&self.cl[part].unshift(doc);
	};
	this.get = function(part, rpl, opts, cb){
		if(typeof rpl == 'function') cb = rpl;
		if(typeof opts == 'function') cb = opts;
		if(!Array.isArray(self.cl[part])) self.cl[part] = [];
		if(self.clp[part]) return self.cl[part];
		self.clp[part] = true;
		let pull;
		if(opts&&opts.query){
			pull = $http.get('/api/'+part+'/'+opts.query);
		}else pull = $http.get('/api/'+part+'/get');
		pull.then(function(resp){
			if(Array.isArray(resp.data)){
				for (var i = 0; i < resp.data.length; i++) {
					self.cl[part].push(resp.data[i]);
					if(rpl){
						for(var key in rpl){
							replace(resp.data[i], key, rpl[key]);
						}
					}
				}
			}
			if(opts&&opts.sort) self.cl[part].sort(opts.sort);
			self.clpc[part] = true;
			typeof cb=='function'&&cb(self.cl[part]);
		}, function(err){
			console.log(err);
		});
		return self.cl[part];
	};
	this.use = function(part, cb){
		if(!self.clpc[part]){
			return $timeout(function(){
				self.use(part, cb);
			}, 250);
		}
		return cb&&cb(self.cl[part]);
	};
	this.run = function(parts, cb){
		if(Array.isArray(parts)){
			for (var i = 0; i < parts.length; i++) {
				if (!self.clpc[parts[i]]) {
					return $timeout(function() {
						self.run(parts, cb);
					}, 250);
				}
			}
		}else if(typeof parts == 'string'){
			if (!self.clpc[parts]) {
				return $timeout(function() {
					self.run(parts, cb);
				}, 250);
			}
		}
		cb();
	};
	this.fill = function(obj, fromPart, toField, fields, cb){
		if(typeof fields == 'function') cb = fields;
		if(!self.clpc[fromPart]){
			return $timeout(function(){
				self.fill(obj, fromPart, toField, fields, cb);
			}, 250);
		}
		for (var j = 0; j < self.cl[fromPart].length; j++) {
			if(Array.isArray(obj[toField])){
				for (var k = 0; k < obj[toField].length; k++) {
					if (self.cl[fromPart][j]._id == obj[toField][k]) {
						if (fields && typeof fields != 'function') {
							obj[toField][k] = {};
							for (var key in fields) {
								obj[toField][k][key] = self.cl[fromPart][j][key];
							}
						} else obj[toField][k] = self.cl[fromPart][j];
						break;
					}
				}
			}else{
				if(self.cl[fromPart][j]._id == obj[toField]){
					if(fields&&typeof fields!='function'){
						obj[toField]={};
						for(var key in fields){
							obj[toField][key]=self.cl[fromPart][j][key];
						}
					}else obj[toField]=self.cl[fromPart][j];
					break;
				}
			}
		}
		cb&&cb();
	};
	this.populate = function(toPart, fromPart, toField, fields, cb){
		if(typeof fields == 'function') cb = fields;
		if(!self.clpc[toPart]||!self.clpc[fromPart]){
			return $timeout(function(){
				self.populate(toPart, fromPart, toField, fields, cb);
			}, 250);
		}
		for (var i = 0; i < self.cl[toPart].length; i++) {
			if(Array.isArray(self.cl[toPart][i][toField])){
				for (var k = 0; k < self.cl[toPart][i][toField].length; k++) {
					if(typeof self.cl[toPart][i][toField][k] != 'string') continue;
					for (var j = 0; j < self.cl[fromPart].length; j++) {
						if(self.cl[fromPart][j]._id == self.cl[toPart][i][toField][k]){
							if(fields&&typeof fields!='function'){
								self.cl[toPart][i][toField][k]={};
								for(var key in fields){
									self.cl[toPart][i][toField][k][key]=self.cl[fromPart][j][key];
								}
							}else self.cl[toPart][i][toField][k]=self.cl[fromPart][j];
							break;
						}
					}
				}
			}else{
				if(typeof self.cl[toPart][i][toField] != 'string') continue;
				for (var j = 0; j < self.cl[fromPart].length; j++) {
					if(self.cl[fromPart][j]._id == self.cl[toPart][i][toField]){
						if(fields&&typeof fields!='function'){
							self.cl[toPart][i][toField]={};
							for(var key in fields){
								self.cl[toPart][i][toField][key]=self.cl[fromPart][j][key];
							}
						}else self.cl[toPart][i][toField]=self.cl[fromPart][j];
						break;
					}
				}
			}
		}
		cb&&cb();
	};
	this.create = function(part, obj, cb){
		$http.post('/api/'+part+'/create', obj||{})
		.then(function(resp){
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	this.update = function(part, obj, custom, cb){
		if(typeof custom == 'function') cb = custom;
		if(typeof custom != 'string') custom = '';
		if(!obj) return;
		$timeout.cancel(obj.updateTimeout);
		if(socket) obj.print = socket.id;
		$http.post('/api/'+part+'/update'+(obj._name||''), obj)
		.then(function(resp){
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	this.updateAfterWhile = function(part, obj, cb){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(function(){
			self.update(part, obj, cb);
		}, 1000);
	};
	this.updateAll = function(part, obj, custom, cb){
		if(typeof custom == 'function') cb = custom;
		if(typeof custom != 'string') custom = '';
		$http.post('/api/'+part+'/update/all'+custom, obj).then(function(resp){
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	this.updateAfterWhileAll = function(part, obj, cb){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(function(){
			self.updateAll(part, obj, cb);
		}, 1000);
	};
	this.afterWhile = function(obj, cb, time){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(cb, time||1000);
	};
	this.delete = function(part, obj, custom, cb){
		if(typeof custom == 'function') cb = custom;
		if(typeof custom != 'string') custom = '';
		if(!obj) return;
		if(socket) obj.print = socket.id;
		$http.post('/api/'+part+'/delete'+custom, {
			_id: obj._id
		}).then(function(resp){
			if(resp.data&&Array.isArray(self.cl[part])){
				for (var i = 0; i < self.cl[part].length; i++) {
					if(self.cl[part][i]._id == obj._id){
						self.cl[part].splice(i, 1);
						break;
					}
				}
			}
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	this.inDocs = function(doc, docs){
		for (var i = 0; i < docs.length; i++) {
			if(docs[i]._id == doc._id) return true;
		}
		return false;
	};
	this.c_text = function(text, clear){
		text = text.split(clear||' ');
		for (var i = text.length - 1; i >= 0; i--) {
			if(text[i]=='') text.splice(i, 1);
		}
		return text.join('');
	};
	// doc fill
	this.beArray = function(val, cb){
		if(!Array.isArray(val)) cb([]);
		else cb(val);
	};
	this.forceObj = function(val, cb){
		cb({});
	};
	// search in docs
	this.keepByBiggerNumber = function(docs, field, number){
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				let keep = false;
				for (var j = 0; j < docs[i][field].length; j++) {
					if (docs[i][field][j] >= number) {
						keep = true;
						break;
					}
				}
				if(keep) continue;
			}else{
				if(docs[i][field] >= number){
					continue;
				}
			}
			docs.splice(i, 1);
		}
	};
	this.keepBySmallerNumber = function(docs, field, number){
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				let keep = false;
				for (var j = 0; j < docs[i][field].length; j++) {
					if (docs[i][field][j] <= number) {
						keep = true;
						break;
					}
				}
				if(keep) continue;
			}else{
				if(docs[i][field] <= number){
					continue;
				}
			}
			docs.splice(i, 1);
		}
	};
	this.cutByBiggerNumber = function(docs, field, number){};
	this.cutBySmallerNumber = function(docs, field, number){};
	this.keepByText = function(docs, field, string, equal){
		string = string.toLowerCase();
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				let keep = false;
				for (var j = 0; j < docs[i][field].length; j++) {
					if (equal) {
						if (docs[i][field][j].toLowerCase() == string) {
							keep = true;
							break;
						}
					} else {
						if (docs[i][field][j].toLowerCase().indexOf(string)>-1) {
							keep = true;
							break;
						}
					}
				}
				if(keep) continue;
			}else{
				if(equal){
					if(docs[i][field].toLowerCase() == string){
						continue;
					}
				}else{
					if(docs[i][field].toLowerCase().indexOf(string)>-1){
						continue;
					}
				}
			}
			docs.splice(i, 1);
		}
	};
	this.cutByText = function(docs, field, string, equal){
		string = string.toLowerCase();
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				for (var j = 0; j < docs[i][field].length; j++) {
					if (equal) {
						if (docs[i][field][j].toLowerCase() == string) {
							docs.splice(i, 1);
							break;
						}
					} else {
						if (docs[i][field][j].toLowerCase().indexOf(string)>-1) {
							docs.splice(i, 1);
							break;
						}
					}
				}
			}else{
				if(equal){
					if(docs[i][field].toLowerCase() == string){
						docs.splice(i, 1);
					}
				}else{
					if(docs[i][field].toLowerCase().indexOf(string)>-1){
						docs.splice(i, 1);
					}
				}
			}
		}
	};
});