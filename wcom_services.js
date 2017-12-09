angular.module("wcom_services", []).run(function($rootScope, $compile){
	let body = angular.element(document).find('body').eq(0);
	body.append($compile(angular.element('<pullfiles></pullfiles>'))($rootScope));
}).service('socket', function(){
	"ngInject";
	if(!io) return {};
	var loc = window.location.host;
	var socket = io.connect(loc);
	return socket;
}).service('fm', function($timeout){
	"ngInject";
	var self = this;
	self.add = function(opts, cb){
		if(typeof self.addDelay != 'function'){
			$timeout(function(){
				self.add(opts, cb);
			}, 100);
		}else{
			self.addDelay(opts, cb);
		}
	}
}).service('mongo', function($http, $timeout){
	var self = this;
	this.cl = {}; // collection
	this.clpc = {}; // complete collection pulled boolean
	this.clp = {}; // collection pulled boolean
	var replace = function(doc, value, rpl){
		if(typeof rpl == 'function'){
			rpl(doc[value], function(newValue){
				doc[value] = newValue;
			});
		}
	}
	this.get = function(part, rpl){
		if(!Array.isArray(self.cl[part])) self.cl[part] = [];
		if(self.clp[part]) return self.cl[part];
		self.clp[part] = true;
		$http.get('/api/'+part+'/get').then(function(resp){
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
			self.clpc[part] = true;
		}, function(err){
			console.log(err);
		});
		return self.cl[part];
	}
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
	}
	this.populate = function(toPart, fromPart, toField, fields, cb){
		if(typeof fields == 'function') cb = fields;
		if(!self.clpc[toPart]||!self.clpc[fromPart]){
			return $timeout(function(){
				self.populate(toPart, fromPart, toField, fields, cb);
			}, 250);
		}
		for (var i = 0; i < self.cl[toPart].length; i++) {
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
		cb&&cb();
	}
	this.create = function(part, obj, callback){
		$http.post('/api/'+part+'/create', obj||{})
		.then(function(resp){
			if(resp.data&&typeof callback == 'function'){
				callback(resp.data);
			}else if(typeof callback == 'function'){
				callback(false);
			}
		});
	}
	this.update = function(part, obj, callback){
		if(!obj) return;
		$timeout.cancel(obj.updateTimeout);
		if(!obj.name) obj.name='';
		if(socket) obj.print = socket.id;
		$http.post('/api/'+part+'/update'+obj.name, obj)
		.then(function(resp){
			if(resp.data&&typeof callback == 'function'){
				callback(resp.data);
			}else if(typeof callback == 'function'){
				callback(false);
			}
		});		
	}
	this.updateAfterWhile = function(part, obj, callback){
		$timeout.cancel(obj.updateTimeout);
		obj.updateTimeout = $timeout(function(){
			self.update(part, obj, callback);
		}, 1000);
	}
	this.delete = function(part, obj, callback){
		if(!obj) return;
		if(socket) obj.print = socket.id;
		$http.post('/api/'+part+'/delete', obj)
		.then(function(resp){
			if(resp.data&&typeof callback == 'function'){
				callback(resp.data);
			}else if(typeof callback == 'function'){
				callback(false);
			}
		});
	}
}).service('img', function(){
	"ngInject";
	this.fileToDataUrl = function(file, callback){
		var a = new FileReader();
		a.onload = function(e) {
			callback(e.target.result);
		}
		a.readAsDataURL(file);
	}
	this.resizeUpTo = function(info, callback){
		if(!info.file) return console.log('No image');
		info.width = info.width || 1920;
		info.height = info.height || 1080;
		if(info.file.type!="image/jpeg" && info.file.type!="image/png")
			return console.log("You must upload file only JPEG or PNG format.");
		var reader = new FileReader();
		reader.onload = function (loadEvent) {
			var canvasElement = document.createElement('canvas');
			var imageElement = document.createElement('img');
			imageElement.onload = function() {
				var infoRatio = info.width / info.height;
				var imgRatio = imageElement.width / imageElement.height;
				if (imgRatio > infoRatio) {
					width = info.width;
					height = width / imgRatio;
				} else {
					height = info.height;
					width = height * imgRatio;
				}
				canvasElement.width = width;
				canvasElement.height = height;
				var context = canvasElement.getContext('2d');
				context.drawImage(imageElement, 0, 0 , width, height);
				callback(canvasElement.toDataURL('image/png', 1));
			};
			imageElement.src = loadEvent.target.result;
		};
		reader.readAsDataURL(info.file);
	}
});