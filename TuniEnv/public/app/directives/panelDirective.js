/**
 * Created by medna on 22/10/2016.
 */
app.directive('baPanel', baPanel);

/** @ngInject */
function baPanel(baPanel) {
    return angular.extend({}, baPanel, {
        template: function(el, attrs) {
            var res = '<div  class="panel panel-blur animated zoomIn  full-invisible' + (attrs.baPanelClass || '');
            res += '"zoom-in ba-panel-blur " >';
            res += baPanel.template(el, attrs);
            res += '</div>';
            return res;
        }
    });
}
app.directive('baPanelBlur', baPanelBlur);

/** @ngInject */
function baPanelBlur(baPanelBlurHelper, $window, $rootScope) {
    var bodyBgSize;

    baPanelBlurHelper.bodyBgLoad().then(function() {
        bodyBgSize = baPanelBlurHelper.getBodyBgImageSizes();
    });

    $window.addEventListener('resize', function() {
        bodyBgSize = baPanelBlurHelper.getBodyBgImageSizes();
    });

    return {
        restrict: 'A',
        link: function($scope, elem) {
            if(!$rootScope.$isMobile) {
                baPanelBlurHelper.bodyBgLoad().then(function () {
                    setTimeout(recalculatePanelStyle);
                });
                $window.addEventListener('resize', recalculatePanelStyle);

                $scope.$on('$destroy', function () {
                    $window.removeEventListener('resize', recalculatePanelStyle);
                });
            }

            function recalculatePanelStyle() {
                if (!bodyBgSize) {
                    return;
                }
                elem.css({
                    backgroundSize: Math.round(bodyBgSize.width) + 'px ' + Math.round(bodyBgSize.height) + 'px',
                    backgroundPosition: Math.floor(bodyBgSize.positionX) + 'px ' + Math.floor(bodyBgSize.positionY) + 'px'
                });
            }

        }
    };
}
