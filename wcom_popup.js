angular.module("wcom_popup", [])
    .service('popup', function($compile, $rootScope) {
            "ngInject";
            this.open = function(event, size, $scope) {
                console.log('jkytj');
                var self = this;
                switch (size) {
                    case 'rt':
                        size.left = event.clientX - event.offsetX + event.target.offsetWidth;
                        size.top = event.clientY - event.offsetY - (event.target.offsetHeight * 2);
                        break;
                    case 'r':
                        size.left = event.clientX - event.offsetX + event.target.offsetWidth;
                        size.top = event.clientY - event.offsetY - (event.target.offsetHeight / 2);
                        break;
                    case 'rb':
                        size.left = event.clientX - event.offsetX + event.target.offsetWidth;
                        size.top = event.clientY - event.offsetY + event.target.offsetHeight;
                        break;
                    case 'b':
                        size.left = event.clientX - event.offsetX + (event.target.offsetWidth / 2) - ($scope.size.offsetWidth / 2);
                        size.top = event.clientY - event.offsetY + event.target.offsetHeight;
                        break;
                    case 'lb':
                        size.left = event.clientX - event.offsetX - size.offsetWidth;
                        size.top = event.clientY - event.offsetY + event.target.offsetHeight;
                        break;
                    case 'l':
                        size.left = event.clientX - event.offsetX - size.offsetWidth;
                        size.top = event.clientY - event.offsetY - (event.target.offsetHeight / 2);
                        break;
                    case 'lt':
                        size.left = event.clientX - event.offsetX - size.offsetWidth;
                        size.top = event.clientY - event.offsetY - (event.target.offsetHeight * 2);
                        break;
                    case 't':
                        size.left = event.clientX - event.offsetX + (event.target.offsetWidth / 2) - ($scope.size.offsetWidth / 2);
                        size.top = event.clientY - event.offsetY - size.offsetHeight;
                        break;
                    default:
                        return self.default(event, size);
                }
            }

            this.default = function(event, size) {

                var top = event.clientY - event.offsetY > size.offsetHeight;

                var left = event.clientX - event.offsetX > size.offsetWidth;

                var botton = document.documentElement.clientHeight - ((event.clientX - event.offsetX) + size.offsetHeight) > size.offsetHeight;

                var right = document.documentElement.clientWidth - ((event.clientX - event.offsetX) + size.offsetWidth) > size.offsetWidth;



                console.log(top);
                console.log(left);
                console.log(bottom);
                console.log(right);


                if (left && top) {
                    $scope.size = 'lt';
                } else if (right && top) {
                    $scope.size = 'rt';
                } else if (right && bottom) {
                    $scope.size = 'rb';
                } else if (left && bottom) {
                    $scope.size = 'lb';
                } else if (top) {
                    $scope.size = 't';
                } else if (right) {
                    $scope.size = 'r';
                } else if (botton) {
                    $scope.size = 'b';
                } else if (left) {
                    $scope.size = 'l';
                } else $scope.size = 'b';
                self.open(event);
            }
    }).directive('popup', function(popup) {
    "ngInject";
    return {
        restrict: 'E',
        transclude: {
            'view': 'view',
            'pop': 'pop',
        },
        scope: {
            id: '@'
        },
        link: function($scope) {
            $scope.size = {
                top: -5000,
                left: -5000
            };
            $scope.open = function(event, size) {
                console.log('hello');
                if (!$scope.size || !$scope.size.offsetWidth) {
                    return setTimeout(function() {
                        popup.open(event, $scope.size);
                    }, 50);
                }
            }
        },
        templateUrl: 'wmodal_popup.html'
    };
}).directive('side', function(popup) {
    "ngInject";
    return {
        link: function($scope) {
            var body = angular.element(document).find('body').eq(0);
            body.append($compile(angular.element(modal))($rootScope));
            angular.element(document).find('html').addClass('noscroll');
        }
    }
})