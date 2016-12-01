/**
 * Created by medna on 14/10/2016.
 */

app.directive("backtop", function($document,$window,$anchorScroll){
        return{
            restrict: 'E',
            template: '<i ng-click="scrollToTop()" class="back-top ion ion-chevron-up animated fadeIn"  title="Back to Top"></i>',
            controller : function($scope){
                $scope.scrollToTop = function(){
                    $('html, body').animate({scrollTop : 0},900);
                };
            },
            link:function (scope,elem) {
                if ($window.scrollY < 50)
                    angular.element(elem).css("visibility","hidden");
                $document.bind('scroll',function(){
                    if ($window.scrollY > 50){
                        angular.element(elem).css({"visibility":"visible"});
                    }else{
                        angular.element(elem).css("visibility","hidden");

                    }
                });
            }
        }

}).
directive('dropzone', function ($http) {
    return {
        restrict: 'C',
        scope: {
            dzValid: '=dzvalid'
        },
        link: function (scope, element, attrs) {
            scope.fileCount = 0;
            scope.dzValid = false;
            scope.dzMinFile = attrs.dzminfile;
            var config = {
                url: '/api/article/add/images',
                method: 'post',
                headers: {Authorization: $http.defaults.headers.common.Authorization},
                maxFiles: 5,
                acceptedFiles: 'image/*',
                maxFilesize: 10,
                paramName: "file",
                addRemoveLinks: true,
                parallelUploads: 5,
                autoProcessQueue: false
            };

            scope.$watch('fileCount', function (newV) {
                if (newV >= scope.dzMinFile) {
                    scope.dzValid = true;
                }
                else
                    scope.dzValid = false;
            });

            var eventHandlers = {
                'addedfile': function () {
                    scope.fileCount += 1;
                    scope.$apply();
                },
                'removedfile': function () {
                    scope.fileCount -= 1;
                    scope.$apply();
                },
                'sending': function (file, xhr, formData) {
                    formData.append('article_id', scope.data);
                },
                'success': function (file, response) {
                    scope.resetDropzone();
                },
                'uploadprogress': function (file, progress) {
                    scope.$parent.progress.value = progress;
                    scope.$parent.$apply();
                }
            };

            var dropzone = new Dropzone(element[0], config);

            angular.forEach(eventHandlers, function (handler, event) {
                dropzone.on(event, handler);
            });


            scope.$on('dropzoneProcess', function (event, data) {
                scope.data = data;
                dropzone.processQueue();
            });

            scope.resetDropzone = function () {
                dropzone.removeAllFiles();
            };

        }
    }
}).directive('clock',['$interval', function ($interval) {
    return {
        restrict: 'E',
        $scope: {},
        template: ' <div class="widget widget-info widget-padding-sm">' +
                        '<div style="color: whitesmoke" class="widget-big-int plugin-clock">{{date|date:\'hh\'}}<span>:</span>{{date|date:\'mm\'}}</div> ' +
            '<div class="widget-subtitle ">{{date|date:\'fullDate\'}}</div> ' +
        '<div class="widget-controls"> ' +
        '<a href="#" class="widget-control-right widget-remove" data-toggle="tooltip" data-placement="left" title="Remove Widget"><span class="fa fa-times"></span></a> ' +
        '</div> ' +
        '<div class="widget-buttons widget-c3"> ' +
        '<div class="col"> ' +
        '<a href="#"><span class="fa fa-clock-o"></span></a> ' +
        '</div> ' +
        '<div class="col"> ' +
        '<a href="#"><span class="fa fa-bell"></span></a> ' +
        '</div> ' +
        '<div class="col"> ' +
        '<a href="#"><span class="fa fa-calendar"></span></a> </div> </div> </div>',
        link:function (scope,e,a) {
            scope.date=Date.now();
            $interval(function () {
                scope.date=Date.now();
            },30000);
        }
    }
}]).directive('owl',['$window','$timeout',function ($window,$timeout) {
    return{
        restrict:'A',
        link:function (scope,e,a) {
            var uiOwlCarousel=function () {
                e.owlCarousel({mouseDrag: false, touchDrag: true, slideSpeed: 300, paginationSpeed: 400, singleItem: true, navigation: false,autoPlay: true});
            };
            if(e.length>0)
                // timeout for perfect width calc
                $timeout(function(){
                    uiOwlCarousel();
                },2000);



            angular.element($window).bind('resize', function(){
                if(e && e.length > 0 && e.data('owlCarousel')) {
                    e.data('owlCarousel').destroy();
                    uiOwlCarousel();
                }
            });
        }
    }
}]).directive('mask', function($http) {
    return {
        require: 'ngModel',
        scope:{
            mask:"@"
        },
        link: function(scope, element, attrs, ngModelCtrl) {
            var jquery_element = $(element);
            if(scope.mask=="phone")
                jquery_element.mask("99-999-999");

            jquery_element.on('keyup paste focus blur', function() {
                var val = $(this).val();

                ngModelCtrl.$setViewValue(val);
                ngModelCtrl.$render();

            })

        }
    }
});

