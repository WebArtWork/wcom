angular.module("wcom_mongo", []).service('mongo', function($http, $timeout, socket){
	var self = this, replaces={}, options={}, docs={};
	self.cl = {}; // collection
	self.clpc = {}; // complete collection pulled boolean
	self._id = function(cb){
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
	self.push = function(part, doc, rpl){
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}
		if(Array.isArray(self.cl[part])){
			self.cl[part].push(doc);
		}
	};
	self.unshift = function(part, doc, rpl){
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}
		Array.isArray(self.cl[part])&&self.cl[part].unshift(doc);
	};
	self.use = function(part, cb){
		if(!self.clpc[part]){
			return $timeout(function(){
				self.use(part, cb);
			}, 250);
		}
		return cb&&cb(self.cl[part]);
	};
	self.get = function(part, rpl, opts, cb){
		if(typeof rpl == 'function') cb = rpl;
		if(typeof opts == 'function') cb = opts;
		if(Array.isArray(self.cl[part])) return self.cl[part];
		if(!Array.isArray(self.cl[part])) self.cl[part] = [];
		replaces[part] = rpl;
		options[part] = opts;
		var pull;
		if(opts&&opts.query){
			pull = $http.get('/api/'+part+'/'+opts.query);
		}else pull = $http.get('/api/'+part+'/get');
		pull.then(function(resp){
			if(Array.isArray(resp.data)){
				for (var i = 0; i < resp.data.length; i++) {
					docs[part+'_'+resp.data[i]._id] = resp.data[i];
					self.cl[part].push(resp.data[i]);
					if(rpl){
						for(var key in rpl){
							replace(resp.data[i], key, rpl[key]);
						}
					}
				}
			}
			if(opts){
				if(opts.sort) self.cl[part].sort(opts.sort);
				if(opts.populate){
					if(Array.isArray(opts.populate)){
						for (var i = 0; i < opts.populate.length; i++) {
							self.populate(part, opts.populate[i].model, opts.populate[i].path);
						}
					}else if(typeof opts.populate == 'object'){
						self.populate(part, opts.populate.model, opts.populate.path);
					}
				};
			}
			self.clpc[part] = true;
			typeof cb=='function'&&cb(self.cl[part]);
		}, function(err){
			console.log(err);
		});
		return self.cl[part];
	};
	self.run = function(parts, cb){
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

	self.populate = function(toPart, fromPart, toField, fields, cb){
		if(typeof fields == 'function'){
			cb = fields;
			fields = null;
		}
		if(!self.clpc[toPart]||!self.clpc[fromPart]){
			return $timeout(function(){
				self.populate(toPart, fromPart, toField, fields, cb);
			}, 250);
		}
		for (var i = 0; i < self.cl[toPart].length; i++) {
			fill(self.cl[toPart][i], fromPart, toField, fields, cb);
		}
		cb&&cb();
	};
	self.fill = function(obj, fromPart, toField, fields, cb){
		if(typeof fields == 'function'){
			cb = fields;
			fields = null;
		}
		if(!self.clpc[fromPart]){
			return $timeout(function(){
				self.fill(obj, fromPart, toField, fields, cb);
			}, 250);
		}
		fill(obj, fromPart, toField, fields, cb);
	};
	var fill = function(obj, fromPart, toField, fields, cb){
		while(toField.indexOf('.')>-1){
			toField = toField.split('.');
			obj = obj[toField.shift()];
			toField = toField.join('.');
			if(Array.isArray(obj)){
				for (var i = 0; i < obj.length; i++) {
					self.fill(obj[i], fromPart, toField, fields, cb);
				}
				return;
			}
		}
		if(Array.isArray(obj[toField])){
			for (var k = obj[toField].length - 1; k >= 0; k--) {
				if(docs[fromPart+'_'+obj[toField][k]]){
					fill_obj(obj[toField], k, docs[fromPart+'_'+obj[toField][k]], fields);
				}else{
					obj[toField].splice(k, 1);
				}
			}
		}else if(docs[fromPart+'_'+obj[toField]]){
			fill_obj(obj, toField, docs[fromPart+'_'+obj[toField]], fields);
		}else{
			delete obj[toField];
		}
		cb&&cb();
	}
	var fill_obj = function(obj, to, doc, fields){
		if (fields) {
			obj[to] = {};
			for (var key in fields) {
				obj[to][key] = doc[key];
			}
		} else obj[to] = doc;
	}

	self.create = function(part, obj, cb){
		if(typeof obj == 'function'){
			cb = obj;
			obj = {};
		}
		$http.post('/api/'+part+'/create', obj||{})
		.then(function(resp){
			if(resp.data){
				self.push(part, resp.data, replaces[part]);
				var o = options[part];
				if(o&&o.sort)
					self.cl[part].sort(o.sort);
				if(o&&o.populate){
					if (Array.isArray(o.populate)) {
						for (var i = 0; i < o.populate.length; i++) {
							self.fill(resp.data, o.populate[i].model, o.populate[i].path);
						}
					} else if (typeof o.populate == 'object') {
						self.fill(resp.data, o.populate.model, o.populate.path);
					}
				}
				if(typeof cb == 'function') cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	};
	self.afterWhile = function(obj, cb, time){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(cb, time||1000);
	};
	self.update = function(part, obj, custom, cb){
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
	self.updateAll = function(part, obj, custom, cb){
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
	self.updateUnique = function(part, obj, custom, cb){
		if(!custom) custom='';
		if(typeof custom == 'function'){
			cb = custom;
			custom='';
		}
		$http.post('/api/'+part+'/unique/field'+custom, obj).then(function(resp){
			if(typeof cb == 'function'){
				cb(resp.data);
			}
		});
	};

	self.updateAfterWhile = function(part, obj, cb){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(function(){
			self.update(part, obj, cb);
		}, 1000);
	};
	self.updateAfterWhileAll = function(part, obj, cb){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(function(){
			self.updateAll(part, obj, cb);
		}, 1000);
	};

	self.delete = function(part, obj, custom, cb){
		if(!custom) custom='';
		if(!obj) return;
		if(typeof custom == 'function'){
			cb = custom;
			custom = '';
		}
		$http.post('/api/'+part+'/delete'+custom, obj).then(function(resp){
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

	self.inDocs = function(doc, docs){
		for (var i = 0; i < docs.length; i++) {
			if(docs[i]._id == doc._id) return true;
		}
		return false;
	};
	self.c_text = function(text, clear){
		text = text.split(clear||' ');
		for (var i = text.length - 1; i >= 0; i--) {
			if(text[i]=='') text.splice(i, 1);
		}
		return text.join('');
	};
	// doc fill
	self.beArray = function(val, cb){
		if(!Array.isArray(val)) cb([]);
		else cb(val);
	};
	self.forceObj = function(val, cb){
		cb({})
	};
	self.user_is = function(users, is){
		var get_arr = [];
		for (var i = 0; i < users.length; i++) {
			if(users[i].is&&users[i].is[is]){
				get_arr.push(users[i]);
			}
		}
		return get_arr;
	}
	self.rpla = function(str, div){
		if(!div) div=' ';
		return str.split(div).join('');
	}
	self.arr_to_id =function(arr){
		var new_arr = [];
		for (var i = 0; i < arr.length; i++) {
			if(arr[i]._id) new_arr.push(arr[i]._id);
		}
		return new_arr;
	}
	// search in docs
	self.keepByBiggerNumber = function(docs, field, number){
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				var keep = false;
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
	self.keepBySmallerNumber = function(docs, field, number){
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				var keep = false;
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
	self.cutByBiggerNumber = function(docs, field, number){};
	self.cutBySmallerNumber = function(docs, field, number){};
	self.keepByText = function(docs, field, string, equal){
		string = string.toLowerCase();
		for (var i = docs.length - 1; i >= 0; i--) {
			if(Array.isArray(docs[i][field])){
				var keep = false;
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
	self.cutByText = function(docs, field, string, equal){
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