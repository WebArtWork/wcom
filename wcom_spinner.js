angular.module("wcom_spinner", [])
.service('spinner', function($compile, $rootScope){
	"ngInject";
	/*
	*	Spinners
	*/
	var self = this;
	this.spinners = [];
	this.spinner_link = function(scope, el){
		scope.close = function(){
			for (var i = 0; i < this.spinners.length; i++) {
				if(this.spinners[i].id==scope.id){
					this.spinners.splice(i, 1);
					break;
				}
			}
			if(this.spinners.length == 0){
				angular.element(document).find('html').removeClass('noscroll');
			}
			if(scope.cb) scope.cb();
			el.remove();
		}
		for (var i = 0; i < this.spinners.length; i++) {
			if(this.spinners[i].id==scope.id){
				this.spinners[i].close = scope.close;
				scope._data = this.spinners[i];
				for(var key in this.spinners[i]){
					scope[key] = this.spinners[i][key];
				}
				break;
			}
		}
	}
	this.spinner = function(obj){
		if(!obj.id) obj.id = Date.now();
		var modal = '<spinner id="'+obj.id+'">';
		if(obj.template) modal += obj.template;
		else if(obj.templateUrl){
			modal += '<ng-include src="';
			modal += "'"+obj.templateUrl+"'";
			modal += '" ng-controller="wparent"></ng-include>';
		}
		modal += '</spinner>';
		this.spinners.push(obj);
		var body = angular.element(document).find('body').eq(0);
		body.append($compile(angular.element(modal))($rootScope));
		angular.element(document).find('html').addClass('noscroll');
	}
}).directive('spinner', function(modal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: modal.spinner_link, templateUrl: 'wmodal_spinner.html'
	};
});