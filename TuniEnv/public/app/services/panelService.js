/**
 * Created by medna on 22/10/2016.
 */

app.factory('baPanel', baPanel);

/** @ngInject */
function baPanel() {

    /** Base baPanel directive */
    return {
        restrict: 'A',
        transclude: true,
        template: function(elem, attrs) {
            var res = '<div class="panel-body" ng-transclude></div>';
            if (attrs.baPanelTitle) {
                var header = '<div class="panel-heading text-center "><h3 class="panel-title">' + attrs.baPanelTitle + '</h3></div>';
                res = header + res; // title should be before
            }

            return res;
        }
    };
}
app.service('baPanelBlurHelper', baPanelBlurHelper);

/** @ngInject */
function baPanelBlurHelper($q) {
    var res = $q.defer();
    var computedStyle = getComputedStyle(document.body, ':before');
    var image = new Image();
    image.src = computedStyle.backgroundImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2');
    image.onerror = function() {
        res.reject();
    };
    image.onload = function() {
        res.resolve();
    };

    this.bodyBgLoad = function() {
        return res.promise;
    };

    this.getBodyBgImageSizes = function() {
        var elemW = document.documentElement.clientWidth;
        var elemH = document.documentElement.clientHeight;
        if(elemW <= 640) return;
        var imgRatio = (image.height / image.width);       // original img ratio
        var containerRatio = (elemH / elemW);     // container ratio

        var finalHeight, finalWidth;
        if (containerRatio > imgRatio) {
            finalHeight = elemH;
            finalWidth = (elemH / imgRatio);
        } else {
            finalWidth = elemW;
            finalHeight = (elemW * imgRatio);
        }
        return { width: finalWidth, height: finalHeight, positionX: (elemW - finalWidth)/2, positionY: (elemH - finalHeight)/2};
    };
}
