fm.add({
	_id: 'addImageID',
	width: 1920,
	height: 1080,
	multiple: true
}, function(dataUrl, file) {
	// manage dataUrl or file, if multiple callback will be called as much times as files given.
});
// CRUD management
this.posts = mongo.get('post');
this.create = function(obj, callback){
	mongo.create('post', obj, callback);
}
this.update = function(obj, callback){
	mongo.update('post', obj, callback);
}
this.updateAfterWhile = function(obj, callback){
	mongo.updateAfterWhile('post', obj, callback);
}
this.delete = function(obj, callback){
	mongo.delete('post', obj, callback);
}