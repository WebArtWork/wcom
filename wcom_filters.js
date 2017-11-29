angular.module("wcom_filters", [])
.service('wcom_scripts', function($compile, $rootScope){
	"ngInject";
	this.modals = [];
	this.modal = function(obj){
		if(!obj.id) obj.id = Date.now();
		let modal = '<wmodal id="'+obj.id+'">';
		if(obj.template) modal += obj.template;
		else if(obj.templateUrl){
			modal += '<ng-include src="';
			modal += "'"+obj.templateUrl+"'";
			modal += '" ng-controller="wparent"></ng-include>';
		}
		modal += '</wmodal>';
		this.modals.push(obj);
		let body = angular.element(document).find('body').eq(0);
		body.append($compile(angular.element(modal))($rootScope));
		angular.element(document).find('html').addClass('bodynoscroll');
	}
	this.spinners = [];
	this.spinner = function(obj){
		if(!obj.id) obj.id = Date.now();
		var spinner = '<wspinner id="'+obj.id+'">';
		spinner += '</wspinner>';
		this.spinners.push(obj);
		document.body.innerHTML += spinner;
	}
}).directive('wcom_wmodal', function(wmodal) {
	"ngInject";
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		}, link: function(scope, el){
			scope.close = function(){
				for (var i = 0; i < wmodal.modals.length; i++) {
					if(wmodal.modals[i].id==scope.id){
						wmodal.modals.splice(i, 1);
						break;
					}
				}
				if(wmodal.modals.length == 0){
					angular.element(document).find('html').removeClass('bodynoscroll');
				}
				if(scope.cb) scope.cb();
				el.remove();
			}
			for (var i = 0; i < wmodal.modals.length; i++) {
				if(wmodal.modals[i].id==scope.id){
					wmodal.modals[i].close = scope.close;
					scope._data = wmodal.modals[i];
					for(var key in wmodal.modals[i]){
						scope[key] = wmodal.modals[i][key];
					}
					break;
				}
			}
		}, templateUrl: 'wmodal_modal.html'
	};
}).controller('wcom_wparent', function($scope, $timeout) {
	"ngInject";
	$timeout(function(){
		if($scope.$parent.$parent._data){
			for (var key in $scope.$parent.$parent._data) {
				$scope[key] = $scope.$parent.$parent._data[key];
			}
		}
		if($scope.$parent._data){
			for (var key in $scope.$parent._data) {
				$scope[key] = $scope.$parent._data[key];
			}
		}
	});
}).directive('wcom_wspinner', function() {
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			id: '@'
		},
		templateUrl: 'wmodal_spinner.html'
	};
});