# wcom waw AngularJS common
Module which support waw project on basic level, elements and scripts which is needed on all projects.

## Mongo Service
Mongo Service is an suportive service for combinating AngularJS client with waw CRUD back-end. Example of injecting mongo service:
```javasript
services.user = function(mongo){}
angular.service('user', function(mongo){});

```
### create `function`
connecting with waw CRUD create. As parameters accepting name of mongo collection, object with values for document and optionally callback function which will return the document. Document will be filled inside read callbacks. Example:
```javascript
mongo.create('colName', {
	    name: doc.name
}, function(created) {
	    console.log('document has been created');
});
``` 
### read `function`
connecting with waw CRUD read. As parameters accepting name of mongo collection, optionally options, optionally callback which will return all documents in array as first parameter and in object with doc._id placeholder for doc as second parameter. Function returning directing array which will host the documents. Example:
```javascript
mongo.get('colName', {
	replace: {
	    name: function(val ,cb, doc) {
		    cb(val + '_modified')
	    }
	}
}, function() {
	console.log('documents is loaded and field name is modified on each doc.');
});
```
### updateAll `function`
connecting with waw CRUD updateAll. As parameters accepting name of mongo collection, document object, optionally options and optionally callback function which will return the document. Example:
```javascript
mongo.updateAll('colName', {
		name: doc.name,
		_id: doc._id
}, {
		fields: 'name'
}, function() {
		console.log('document is updated');
});
``` 
### updateUnique `function`
connecting with waw CRUD updateUnique. As parameters accepting name of mongo collection, object with document _id and field value, optionally options and optionally callback function which will return if field has been updated. Example:
```javasript
mongo.updateUnique('colName', {
	name: doc.name,
	_id: doc._id
}, {
	name: 'name'
   }, function(resp) {
	        if(resp){
	   			console.log('field updated');
			} else {
	   			console.log("field not updated");
			}
});
```
### delete `function`
connecting with waw CRUD delete. As parameters accepting name of mongo collection, document object, optionally options and optionally callback function which will return the document. Example:
```javascript
mongo.delete('colName', {
		_id: doc._id
}, {
		name: 'admin'
}, () => {
		console.log('document is updated');
});
``` 
### _id `function`
provide new mongo _id. As parameters accepting callback function which will return the _id. Example:
```javascript
mongo._id(function(_id){
    	console.log(_id);
});
```
### to_id `function`
convert array of documents, object with documents, mixed documents or _id and converting it to array of _id. Example:
```javasript
mongo.to_id([{
		_id: '1'
}, '2'
//['1','2']
mongo.to_id({
	'1': true
	'2': false
});
// ['1']
```
### afterWhile `function`
provide delay on any action, usefull with input and model change. As parameters accepting document, callback and optionally time. Example:
```javascript
mongo.afterWhile(doc, function() {
    	console.log('text was wroten');
}, 2000)
```
### populate `function`
making population on specific field with specific collection. Example with doc which will have field as document of part provided:
```javasript
mongo.populate(doc, 'field', 'colName');
```
### beArr `function`
checking value if it's array then we keep it and in other case, we replace it with new array. Example where each doc will have data as array:
```javasript
mongo.get('colName', {
		replace: {
	   			'data': mongo.beArr
    	}
});
```
### beObj `function`
checking value if it's object then we keep it and in other case, we replace it with new object. Example where each doc will have data as array:
```javasript
mongo.get('colName', {
	replace: {
	   'data': mongo.beObj
    }
});

```
### forceArr `function`
convert any value to array within replace options. Example where each doc will have data as empty array:
```javasript
mongo.get('colName', {
		replace: {
	   		'data': mongo.forceArr
    	}
});
```
### forceObj `function`
convert any value to object within replace options. Example where each doc will have data as empty object:
```javasript
mongo.get('colName', {
		replace: {
	   		'data': mongo.forceObj
    	}
});
```
## SD Service
## Modal Service
## Popup Service
## Spinner Service
## File Service
## Socket Service
## Image Service
## Hash Service