/**
 * Created by medna on 16/10/2016.
 */
app.
controller('newArticleController', ['$scope', "GOVERNORATE", 'API_ENDPOINT', '$http', 'NgMap', 'GOOGLE_MAP',
    '$rootScope', 'ngProgressFactory','$state',
    function ($scope, GOVERNORATE, API_ENDPOINT, $http, NgMap, GOOGLE_MAP, $rootScope, ngProgressFactory
        ,$state) {



        /* get Current Location */
        var options = {
            enableHighAccuracy: true
        };

        navigator.geolocation.getCurrentPosition(function (pos) {
            $scope.position = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        }, function (error) {
            console.log('Unable to get location: ' + error.message);
        }, options);

        $scope.getPosition = function (event) {
            $scope.position = [event.latLng.lat(), event.latLng.lng()];
            $scope.article.langitude = event.latLng.lng();
            $scope.article.latitude = event.latLng.lat();
        };

        $scope.governorate = GOVERNORATE;
        $scope.article = {};

        $scope.progressbar = ngProgressFactory.createInstance();
        $scope.progress={value:0};

        $scope.createArticle = function () {
            $http.post(API_ENDPOINT.url + '/article/new', $scope.article).then(function (res) {
                $scope.article_id = res.data;
                $scope.progressbar.start();
                $scope.progressbar.setColor("#95b75d");
                $rootScope.$broadcast('dropzoneProcess', $scope.article_id);
            });


        };

        $scope.$watch('progress.value', function (newV, oldV) {
            if (newV > 0)
                $scope.progressbar.set(newV);
            if (newV == 100) {
                $scope.progressbar.complete();
                $state.go("show_article", {article_id: $scope.article_id});
            }
        }, true);

    }]).
controller("showArticleController", ['article','$scope', '$window', '$stateParams', '$http', '$state'
    , 'API_ENDPOINT', 'authService', 'ngProgressFactory', 'toastr','socket','SweetAlert',
    function (article,$scope, $window, $stateParams, $http, $state, API_ENDPOINT, authService,
              ngProgressFactory, toastr,socket,SweetAlert) {

        $scope.article=article;
        $scope.position = [$scope.article.latitude, $scope.article.langitude];

        /* for favourite button */
        $scope.range = function(n) {
            return new Array(n);
        };

        $scope.notifyOwner=function (type) {
            if($scope.authenticated){
                if($scope.article.author.username!=$scope.user.username){
                var comment={type: type,article_id:$stateParams.article_id,for:$scope.article.author._id};
                    $http.post(API_ENDPOINT.url+'/user/notification/add',comment).then(function (cmt) {
                        socket.emit('notification',cmt.data);
                    });
                }
            }
        };
        $scope.checked=false;
        $scope.toggleCheck=function () {
            $scope.checked=!$scope.checked;
            $http.post(API_ENDPOINT.url+'/user/favorite/add',{article_id:$stateParams.article_id+"",addFav:$scope.checked})
                .then(function (res) {
                });
        };

        $http.post(API_ENDPOINT.url + '/article/' + $stateParams.article_id + '/addView').then(function (res) {
            $scope.article.views = res.data;
        });

        $scope.thumbs = function (value) {
            $http.post(API_ENDPOINT.url + '/article/' + $stateParams.article_id + '/thumb', {thumb: value}).then(function (res) {
                if(value==true)
                    $scope.notifyOwner("like");
                $scope.article.likes = res.data.likes;
                $scope.article.dislikes = res.data.dislikes;
            })
        };


        $scope.reportArticle = function (article) {
            var report={article:$scope.article._id};
            SweetAlert.swal({
                    title: "Are you sure?",
                    text: "Does this article have something wrong !",
                    type: "input",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55", confirmButtonText: "Yes, report it!",
                    cancelButtonText: "No, cancel!",
                    closeOnConfirm: false,
                    closeOnCancel: true,
                    inputPlaceholder: "Write the reason ",
                    showLoaderOnConfirm: true,

                },
                function(inputValue){
                    if (inputValue === false) return false;

                    if (inputValue === "") {
                        swal.showInputError("You need to write the reason!");
                        return false
                    }
                    report.reason=inputValue;


                    $http.post(API_ENDPOINT.url + '/article/report', report).then(function (res) {
                        if(res.data.done)
                            SweetAlert.swal("Report!", "this article has been reported.", "success");
                        else
                            SweetAlert.swal("Cancelled", "You already reported this article", "warning");


                    });

                    return false;
                });
        }

}]).
controller('editArticleController', ['article','$scope', "GOVERNORATE", 'API_ENDPOINT', '$http', 'NgMap', 'GOOGLE_MAP',
    '$rootScope', '$stateParams', 'ngProgressFactory', 'toastr', '$state','$timeout',
    function (article,$scope, GOVERNORATE, API_ENDPOINT, $http, NgMap, GOOGLE_MAP, $rootScope,
              $stateParams, ngProgressFactory, toastr, $state,$timeout) {

        $scope.article=article;
        $scope.position = [$scope.article.latitude, $scope.article.langitude];

        /* get Current Location */
        var options = {
            enableHighAccuracy: true
        };

        navigator.geolocation.getCurrentPosition(function (pos) {
            $scope.position = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        }, function (error) {
            console.log('Unable to get location: ' + error.message);
        }, options);

        $scope.getPosition = function (event) {
            $scope.position = [event.latLng.lat(), event.latLng.lng()];
            $scope.article.langitude = event.latLng.lng();
            $scope.article.latitude = event.latLng.lat();
        };

        $scope.governorate = GOVERNORATE;

        $scope.progressbar = ngProgressFactory.createInstance();


        $scope.editArticle = function () {
            $scope.progress = 0;
            $scope.progressbar.start();
            $scope.progressbar.setColor("#95b75d");
            $scope.progressbar.setHeight('4px');
            $http.post(API_ENDPOINT.url + '/article/edit', $scope.article).then(function (res) {
                $scope.article_id = $scope.article._id;
                $timeout(function () {
                    toastr.success('Your article has been updated   ! ', 'Edit article');
                    $scope.progressbar.complete();
                    $state.go("show_article", {article_id: $scope.article_id});
                }, 3000);
                $rootScope.$broadcast('dropzoneProcess', $scope.article_id);
            },function (err) {
                $scope.progressbar.setColor("red");
                toastr.error('There was an error   ! ', 'Edit article');
                $timeout(function () {
                    $scope.progressbar.reset();
                },2000);
            })
        };


        $scope.$watch('progress', function (newV, oldV) {
            if (newV > 0)
                $scope.progressbar.set(newV);
            if (newV == 100)
                $scope.progressbar.complete();
        }, true);

        $scope.$watch('article.images.length', function (newValue) {
            var elm = angular.element(".dz-default");
            if (newValue > 0 && elm != null)
                elm.remove();
            else if (newValue == 0)
                angular.element("#dropzone").children().append('<div class=\"dz-default dz-message\"></div>');

        });

    }]);