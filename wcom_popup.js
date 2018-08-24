angular.module("wcom_popup", [])
    .service('popup', function($compile, $rootScope) {
        "ngInject";
        /*
         *	Popups
         */
        var self = this;
        this.popups = [];
        this.close = function(id) {
            for (var i = 0; i < self.popups.length; i++) {
                if (self.popups[i].id == id) {
                    self.popups[i].el.remove();
                    self.popups.splice(i, 1);
                    break;
                }
            }

        }
        this.add = function(obj) {
            if (!obj) obj = {};
            if (!obj.id) obj.id = Date.now();
            this.modals.push(obj);
            var body = angular.element(document).find('body').eq(0);
            body.append($compile(angular.element(modal))($rootScope));
            angular.element(document).find('html').addClass('noscroll');
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
            link: function(scope, el) {
                for (var i = 0; i < popup.popups.length; i++) {
                    if (popup.popups[i].id == scope.id) {
                        popup.popups[i].el = el;
                    }
                }
            },
            templateUrl: 'wmodal_popup.html'
        };
    });