angular.module("wcom_popup", [])
.service('popup', function($compile, $rootScope){
	"ngInject";
	/*
	*	Popups
	*/
	var self = this;
	this.popups = [];
	this.popup_link = function(scope, el){
		scope.close = function(){
			for (var i = 0; i < this.popups.length; i++) {
				if(this.popups[i].id==scope.id){
					this.popups.splice(i, 1);
					break;
				}
			}
			if(this.popups.length == 0){
				angular.element(document).find('html').removeClass('noscroll');
			}
			if(scope.cb) scope.cb();
			el.remove();
		}
		for (var i = 0; i < this.popups.length; i++) {
			if(this.popups[i].id==scope.id){
				this.popups[i].close = scope.close;
				scope._data = this.popups[i];
				for(var key in this.popups[i]){
					scope[key] = this.popups[i][key];
				}
				break;
			}
		}
	}
	this.popup = function(obj){
		if(!obj.id) obj.id = Date.now();
		var modal = '<popup id="'+obj.id+'">';
		if(obj.template) modal += obj.template;
		else if(obj.templateUrl){
			modal += '<ng-include src="';
			modal += "'"+obj.templateUrl+"'";
			modal += '" ng-controller="wparent"></ng-include>';
		}
		modal += '</popup>';
		self.modals.push(obj);
		var body = angular.element(document).find('body').eq(0);
		body.append($compile(angular.element(modal))($rootScope));
		angular.element(document).find('html').addClass('noscroll');
	}
}).directive('popup', function(modal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: modal.popup_link, templateUrl: 'wmodal_popup.html'
	};
});