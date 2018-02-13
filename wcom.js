angular.module("wcom", ["wcom_services", "wcom_filters", "wcom_directives"]);
angular.module("wcom_services", []).run(function($rootScope, $compile){
	let body = angular.element(document).find('body').eq(0);
	body.append($compile(angular.element('<pullfiles></pullfiles>'))($rootScope));
}).factory('socket', function(){
	"ngInject";
	if(typeof io != 'object') return {};
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
}).run(function (ctrl) {
	"ngInject";
	angular.element(document).bind('keyup', function (e) {
		ctrl.press(e.keyCode);
	});
}).service('ctrl', function($timeout){
	var self = this;
	var cbs = [];
	var enums = {
		'space': 32,
		'esc': 27,
		'backspace': 8,
		'tab': 9,
		'enter': 13,
		'shift': 16,
		'ctrl': 17,
		'alt': 18,
		'pause/break': 19,
		'caps lock': 20,
		'escape': 27,
		'page up': 33,
		'page down': 34,
		'end': 35,
		'home': 36,
		'left': 37,
		'up': 38,
		'right': 39,
		'down': 40,
		'insert': 45,
		'delete': 46,
		'0': 48,
		'1': 49,
		'2': 50,
		'3': 51,
		'4': 52,
		'5': 53,
		'6': 54,
		'7': 55,
		'8': 56,
		'9': 57,
		'a': 65,
		'b': 66,
		'c': 67,
		'd': 68,
		'e': 69,
		'f': 70,
		'g': 71,
		'h': 72,
		'i': 73,
		'j': 74,
		'k': 75,
		'l': 76,
		'm': 77,
		'n': 78,
		'o': 79,
		'p': 80,
		'q': 81,
		'r': 82,
		's': 83,
		't': 84,
		'u': 85,
		'v': 86,
		'w': 87,
		'x': 88,
		'y': 89,
		'z': 90,
		'left window key': 91,
		'right window key': 92,
		'select key': 93,
		'numpad 0': 96,
		'numpad 1': 97,
		'numpad 2': 98,
		'numpad 3': 99,
		'numpad 4': 100,
		'numpad 5': 101,
		'numpad 6': 102,
		'numpad 7': 103,
		'numpad 8': 104,
		'numpad 9': 105,
		'multiply': 106,
		'add': 107,
		'subtract': 109,
		'decimal point': 110,
		'divide': 111,
		'f1': 112,
		'f2': 113,
		'f3': 114,
		'f4': 115,
		'f5': 116,
		'f6': 117,
		'f7': 118,
		'f8': 119,
		'f9': 120,
		'f10': 121,
		'f11': 122,
		'f12': 123,
		'num lock': 144,
		'scroll lock': 145,
		'semi-colon': 186,
		'equal sign': 187,
		'comma': 188,
		'dash': 189,
		'period': 190,
		'forward slash': 191,
		'grave accent': 192,
		'open bracket': 219,
		'back slash': 220,
		'close braket': 221,
		'single quote': 222,
	};
	this.press = function(code){
		for (var i = 0; i < cbs.length; i++) {
			if(cbs[i].key == code) $timeout(cbs[i].cb);
		}
	}
	this.on = function(btns, cb){
		if(typeof cb != 'function') return;
		if(!Array.isArray(btns)&&typeof btns != 'object') return;
		if(!Array.isArray(btns)&&typeof btns == 'object') btns = [btns];
		for (var i = 0; i < btns.length; i++) {
			if(typeof enums[btns[i]] == 'number'){
				cbs.push({
					key: enums[btns[i]],
					cb: cb
				});
			}
		}
	}
}).service('mongo', function($http, $timeout, socket){
	var self = this;
	this.cl = {}; // collection
	this.clpc = {}; // complete collection pulled boolean
	this.clp = {}; // collection pulled boolean
	var replace = function(doc, value, rpl){
		if(typeof rpl == 'function'){
			rpl(doc[value], function(newValue){
				doc[value] = newValue;
			}, doc);
		}
	}
	this.push = function(part, doc, rpl){
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}
		Array.isArray(self.cl[part])&&self.cl[part].push(doc);
	}
	this.unshift = function(part, doc, rpl){
		if(rpl){
			for(var key in rpl){
				replace(doc, key, rpl[key]);
			}
		}		
		Array.isArray(self.cl[part])&&self.cl[part].unshift(doc);
	}
	this.get = function(part, rpl, opts){
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
		}, function(err){
			console.log(err);
		});
		return self.cl[part];
	}
	this.use = function(part, cb){
		if(!self.clpc[part]){
			return $timeout(function(){
				self.use(part, cb);
			}, 250);
		}
		return cb&&cb(self.cl[part]);
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
	}
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
	this.update = function(part, obj, cb){
		if(!obj) return;
		$timeout.cancel(obj.updateTimeout);
		if(!obj.name) obj.name='';
		if(socket) obj.print = socket.id;
		$http.post('/api/'+part+'/update'+obj.name, obj)
		.then(function(resp){
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
			}
		});
	}
	this.updateAll = function(part, obj, cb){
		$http.post('/api/'+part+'/update/all'+(obj.name||''), obj).then(function(resp){
			if(resp.data&&typeof cb == 'function'){
				cb(resp.data);
			}else if(typeof cb == 'function'){
				cb(false);
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
		$http.post('/api/'+part+'/delete', {
			_id: obj._id
		}).then(function(resp){
			if(resp.data&&typeof callback == 'function'){
				callback(resp.data);
			}else if(typeof callback == 'function'){
				callback(false);
			}
		});
	}
	this.inDocs = function(doc, docs){
		for (var i = 0; i < docs.length; i++) {
			if(docs[i]._id == doc._id) return true;
		}
		return false;
	}
	this.c_text = function(text, clear){
		text = text.split(clear||' ');
		for (var i = text.length - 1; i >= 0; i--) {
			if(text[i]=='') text.splice(i, 1);
		}
		return text.join('');
	}
	// doc fill
	this.beArray = function(val, cb){
		if(!Array.isArray(val)) cb([]);
		else cb(val);
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
String.prototype.rAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
angular.module("wcom_filters", [])
.filter('toArr', function(){
	"ngInject";
	return function(str, div){
		if(!str) return [];
		str=str.split((div||',')+' ').join(',');
		var arr = str.split(div||',');
		for (var i = arr.length - 1; i >= 0; i--) {
			if(!arr[i]) arr.splice(i, 1);
		}
		return arr;
	}
}).filter('mongodate', function(){
	"ngInject";
	return function(_id){
		if(!_id) return new Date();
		var timestamp = _id.toString().substring(0,8);
		return new Date(parseInt(timestamp,16)*1000);
	}
}).filter('fixlink', function(){
	"ngInject";
	return function(link){
		if(!link||link.indexOf('//')>0) return link;
		else return 'http://'+link;
	}
}).filter('wdate', function($filter){
	"ngInject";
	return function(time, addYear, addMonth, addDay){
		time = new Date(time);
		if(addYear){
			time.setFullYear(time.getFullYear() + parseInt(addYear));
		}
		if(addMonth){
			time.setMonth(time.getMonth() + parseInt(addMonth));
		}
		if(addDay){
			time.setDate(time.getDate() + parseInt(addDay));
		}
		var timems = time.getTime();
		var nowms = new Date().getTime();
		var dayms = nowms - 86400000;
		if(timems>dayms){
			return $filter('date')(time, 'hh:mm a');
		}
		var yearms = nowms - (2628000000*12);
		if(timems>yearms){
			return $filter('date')(time, 'MMM dd hh:mm a');
		}
		return $filter('date')(time, 'yyyy MMM dd hh:mm a');
	}
}).filter('messagetime', function($filter){
	"ngInject";
	return function(time){
		time = new Date(time);
		var timems = time.getTime();
		var nowms = new Date().getTime();
		var minago = nowms - 60000;
		if(timems>minago) return 'A min ago.';
		var dayms = nowms - 86400000;
		if(timems>dayms){
			return $filter('date')(time, 'hh:mm a');
		}
		var yearms = nowms - (2628000000*12);
		if(timems>yearms){
			return $filter('date')(time, 'MMM dd hh:mm a');
		}
		return $filter('date')(time, 'yyyy MMM dd hh:mm a');
	}
});
angular.module("wcom_directives", [])
.directive('pullfiles', function(){
	"ngInject";
	return{
		restrict: 'E', scope: true, replace: true,
		controller: function($scope, img, $timeout, fm){
			var inputs = $scope.inputs = [];
			fm.addDelay = function(opts, cb){
				if(typeof cb != 'function' || !opts._id) return;
				opts.multiple = !!opts.multiple;
				inputs.push(opts);
				$timeout(function(){
					if(opts.multiple){
						var addImage = function(file) {
							img.resizeUpTo({
								file: file,
								width: opts.width||1920,
								height: opts.height||1080
							}, function(dataUrl) {
								$timeout(function(){
									cb(dataUrl, file);
								});
							});
						}
						angular.element(document.getElementById(opts._id))
						.bind('change', function(evt) {
							var target = evt.currentTarget || evt.target;
							for (var i = 0; i < target.files.length; i++) {
								addImage(target.files[i]);
							}
						});
					}else{
						angular.element(document.getElementById(opts._id))
						.bind('change', function(evt) {
							var target = evt.currentTarget || evt.target;
							img.resizeUpTo({
								file: target.files[0],
								width: opts.width||1920,
								height: opts.height||1080
							}, function(dataUrl) {
								$timeout(function(){
									cb(dataUrl, target.files[0]);
								});
							});
						});
					}
				}, 250);
			}
		},
		template: '<input ng-repeat="i in inputs" type="file" ng-hide="true" id="{{i._id}}" multiple="{{i.multiple}}">'
	}
}).directive('elsize', function($timeout, $window){
	"ngInject";
	return {
		restrict: 'AE',
		scope: {
			elsize: '='
		}, link: function(scope, el){
			if(!scope.elsize) scope.elsize={};
			var resize = function(){
				scope.elsize.width = el[0].clientWidth;
				scope.elsize.height = el[0].clientHeight;
				$timeout();
			}
			resize();
			angular.element($window).bind('resize', resize);
			scope.$watch(function () {
				return [el[0].clientWidth, el[0].clientHeight].join('x');
			},function (value) {
				if(value.split('x')[0]>0) scope.elsize.width = value.split('x')[0];
				if(value.split('x')[1]>0) scope.elsize.height = value.split('x')[1];
			});
		}
	}
})