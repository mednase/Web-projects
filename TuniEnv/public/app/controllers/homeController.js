/**
 * Created by medna on 21/10/2016.
 */
app.controller('homeController', ['$scope', '$http', 'API_ENDPOINT', '$state', '$stateParams','$rootScope',
    function ($scope, $http, API_ENDPOINT, $state, $stateParams,$rootScope) {
        $scope.currentPage = 1;
        $rootScope.location=$state.current.name;
        var setPage = function (pageNo) {
            $scope.currentPage = pageNo;
            if ($scope.location == "governorate")
                $http.get(API_ENDPOINT.url + '/article/governorate/' + $stateParams.name+'/'+$scope.currentPage).then(function (res) {
                    $scope.indicator="Result For : "+$stateParams.name;
                    $scope.totalArticles=res.data.total;
                    $scope.articles = res.data.articles;
                    if(!$scope.$$phase){$scope.$apply();}
                });
            if($scope.location =="popular")
                $http.get(API_ENDPOINT.url + '/article/popular/'+$scope.currentPage).then(function (res) {
                    $scope.indicator="Popular ";
                    $scope.totalArticles=res.data.total;
                    $scope.articles = res.data.articles;
                    if(!$scope.$$phase){$scope.$apply();}
                });
            else
                $http.get(API_ENDPOINT.url + '/article/all/' + $scope.currentPage).then(function (res) {

                    $scope.totalArticles=res.data.total;
                    $scope.articles = res.data.articles;
                    if(!$scope.$$phase){$scope.$apply();}
                });
        };

        setPage($scope.currentPage);


        /* pagination */
        $scope.pageChanged = function () {
            setPage($scope.currentPage);
            $('html, body').animate({scrollTop : 0},900);

        };

    }]);