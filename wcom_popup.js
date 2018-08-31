angular.module("wcom_popup", [])
    .service('popup', function($compile, $rootScope) {
        "ngInject"; 
        var self = this;
        this.open = function(size, config) {     
            console.log(config);
            console.log(size);
            if (!config || (!config.templateUrl && !config.template))
                return console.warn('Please add templateUrl or template');
            if (!config) config = Date.now();
            var popup = '<popup config="' + config + '">'; 
            if (config.template) popup += config.template;
            else if (config.templateUrl) {
                popup += '<ng-include src="';
                popup += "'" + config.templateUrl + "'";
                popup += '" ng-controller="wparent"></ng-include>';
            }
            popup += '</popup>';
            popup.push(size, config);
            var body = angular.element(document).find('body').eq(0);
            body.append($compile(angular.element(modal))($rootScope));
            angular.element(document).find('html').addClass('noscroll');
           
        }
    }).directive('pop', function(popup) {
        "ngInject";
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                config: '='
            },  
            link: function($scope) {
                $scope.size = {
                    top: -5000,
                    left: -5000
                };
                $scope.open = function() {
                    //Add to scope.size span element left, top from event
                    popup.open($scope.size, $scope.config);
                    
                }
            },
            templateUrl: 'wmodal_popup.html'
        };
    }).directive('popup', function(popup) {
        "ngInject";
        return {
            link: function(config, size) {
                console.log('something');
                /*switch (size) {
                    case 'rt':
                        size.left = config.clientX - config.offsetX + config.target.offsetWidth;
                        size.top = config.clientY - config.offsetY - (config.target.offsetHeight * 2);
                        break;
                    case 'r':
                        size.left = config.clientX - config.offsetX + config.target.offsetWidth;
                        size.top = config.clientY - config.offsetY - (config.target.offsetHeight / 2);
                        break;
                    case 'rb':
                        size.left = config.clientX - config.offsetX + config.target.offsetWidth;
                        size.top = config.clientY - config.offsetY + config.target.offsetHeight;
                        break;
                    case 'b':
                        size.left = config.clientX - config.offsetX + (config.target.offsetWidth / 2) - ($scope.size.offsetWidth / 2);
                        size.top = config.clientY - config.offsetY + config.target.offsetHeight;
                        break;
                    case 'lb':
                        size.left = config.clientX - config.offsetX - size.offsetWidth;
                        size.top = config.clientY - config.offsetY + config.target.offsetHeight;
                        break;
                    case 'l':
                        size.left = config.clientX - config.offsetX - size.offsetWidth;
                        size.top = config.clientY - config.offsetY - (config.target.offsetHeight / 2);
                        break;
                    case 'lt':
                        size.left = config.clientX - config.offsetX - size.offsetWidth;
                        size.top = config.clientY - config.offsetY - (config.target.offsetHeight * 2);
                        break;
                    case 't':
                        size.left = config.clientX - config.offsetX + (config.target.offsetWidth / 2) - ($scope.size.offsetWidth / 2);
                        size.top = config.clientY - config.offsetY - size.offsetHeight;
                        break;
                    default:
                        return self.default(config, size);
                }

                this.default = function() {

                    var top = config.clientY - config.offsetY > size.offsetHeight;

                    var left = config.clientX - config.offsetX > size.offsetWidth;

                    var bottom = document.documentElement.clientHeight - ((config.clientX - config.offsetX) + size.offsetHeight) > size.offsetHeight;

                    var right = document.documentElement.clientWidth - ((config.clientX - config.offsetX) + size.offsetWidth) > size.offsetWidth;



                    console.log(top);
                    console.log(left);
                    console.log(bottom);
                    console.log(right);


                    if (left && top) {
                        size = 'lt';
                    } else if (right && top) {
                        size = 'rt';
                    } else if (right && bottom) {
                        size = 'rb';
                    } else if (left && bottom) {
                        size = 'lb';
                    } else if (top) {
                        size = 't';
                    } else if (right) {
                        size = 'r';
                    } else if (bottom) {
                        size = 'b';
                    } else if (left) {
                        size = 'l';
                    } else size = 'b';
                    self.open(event, size, config);
                }*/
            }
        }
    });