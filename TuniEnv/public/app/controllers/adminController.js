/**
 * Created by medna on 09/10/2016.
 */
app.controller('dashboardController',['$scope','$http','API_ENDPOINT',
    function ($scope,$http,API_ENDPOINT) {

        $scope.$parent.title="Dashboard";
        $scope.registered=0;
        $http.get(API_ENDPOINT.url+'/admin/dashboard').then(function (result) {
            $scope.registered=result.data.registred;
            $scope.postedArticle=result.data.postedArticle;
        })
}]).
controller('adminUsersController',['$scope','$http','API_ENDPOINT','flashMessage',
    function ($scope,$http,API_ENDPOINT,flashMessage) {
        $scope.searchAccount="";
        $scope.$parent.title="Users";
        $scope.currentPage= 1;

        var loadUsers=function (pagination) {
            $http.get(API_ENDPOINT.url+'/admin/users/'+pagination).then(function (result) {
                $scope.totalUsers=result.data.total;
                $scope.users=result.data.users;
            });
        };

        $scope.pageChanged = function () {
            loadUsers($scope.currentPage);
        };
        loadUsers($scope.currentPage);

        $scope.foundAccount={};

        $scope.promoteUser=function () {
            $scope.foundAccount.role=$scope.foundAccount.promote;
            $http.post(API_ENDPOINT.url+"/admin/users/promote",$scope.foundAccount).then(function () {
                flashMessage.create("user has been promoted","success",5000)
                $scope.searchAccount="";
                $scope.foundAccount={};
            },function () {
                flashMessage.create("unauthorized !","danger",5000)
            })

        };


        $scope.banUser=function (user) {
            $http.post(API_ENDPOINT.url+'/admin/users/ban',user).then(function () {
                user.enable=false;
            },function () {
                flashMessage.create("unauthorized !","danger",5000)
            });
        };

        $scope.activateUser=function (user) {
            $http.post(API_ENDPOINT.url+'/admin/users/activate',user).then(function () {
                user.enable=true;
            });
        }
    }]).
controller('adminArticlesController',['$scope','$http','API_ENDPOINT','SweetAlert','GOVERNORATE',
    function ($scope,$http,API_ENDPOINT,SweetAlert,GOVERNORATE) {

        $scope.governorate=GOVERNORATE;
        $scope.$parent.title="Articles";
        $scope.currentPage= 1;

        var loadArticle=function (pagination) {
            $http.get(API_ENDPOINT.url+'/article/all/'+pagination).then(function (result) {
                $scope.totalArticles=result.data.total;
                $scope.articles=result.data.articles;
            });
        };

        $scope.deleteArticle=function (article,$index) {
            SweetAlert.swal({
                    title: "Are you sure?",
                    text: "Your will not be able to recover this article again !",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55", confirmButtonText: "Yes, delete it!",
                    cancelButtonText: "No, cancel!",
                    closeOnConfirm: false,
                    closeOnCancel: false
                },
                function (isConfirm) {
                    if (isConfirm) {
                        $http.post(API_ENDPOINT.url+'/admin/articles/delete',article).then(function () {
                            $scope.articles.splice($index,1);
                            SweetAlert.swal("Deleted!", "Your article has been deleted.", "success");
                        });
                    } else {
                        SweetAlert.swal("Cancelled", "Your imaginary file is safe :)", "error");
                    }
                });
        };
        $scope.pageChanged = function () {
            loadArticle($scope.currentPage);
        };
        loadArticle($scope.currentPage);

    }]).
controller('adminArticlesEditController',['$scope','$http','API_ENDPOINT','SweetAlert','GOVERNORATE','flashMessage',
    '$location','$stateParams',
    function ($scope,$http,API_ENDPOINT,SweetAlert,GOVERNORATE,flashMessage,$location,$stateParams) {

        $scope.governorate=GOVERNORATE;
        $scope.$parent.title="Article";



        var loadArticle=function () {
            $http.get(API_ENDPOINT.url+'/article/show/'+$stateParams.article_id).then(function (result) {
                $scope.article=result.data;
            });
        };
        loadArticle();

        $scope.updateArticle=function () {
           console.log($scope.article);
        };

        $scope.reset=function(){
            loadArticle();
        }

    }]).
controller('adminProfileController',['$scope','$http','API_ENDPOINT',
    function ($scope,$http,API_ENDPOINT) {

        $scope.$parent.title="Profile";
        $scope.registered=0;
        $http.get(API_ENDPOINT.url+'/admin/dashboard').then(function (result) {
            $scope.registered=result.data.registred;
            $scope.postedArticle=result.data.postedArticle;
        });
    }]).
controller('adminMessagesController',['$scope','API_ENDPOINT','$http', function ($scope,API_ENDPOINT,$http) {
        $scope.$parent.title="Messages";
        $scope.currentPage= 1;
        var loadDisucssions=function (pagination) {
            $http.get(API_ENDPOINT.url+'/discussion/'+pagination).then(function (result) {
            $scope.totalDiscussions=result.data.total;
            $scope.discussions=result.data.discussions;
            });
        };

        $scope.pageChanged = function () {
            loadDisucssions($scope.currentPage);
        };
        loadDisucssions($scope.currentPage);
}]).
controller('adminReportsController',['$scope','$http','API_ENDPOINT',
    function ($scope,$http,API_ENDPOINT) {

        $scope.$parent.title="Report";
        $scope.currentPage= 1;

        var loadReports=function (pagination) {
            $http.get(API_ENDPOINT.url+'/admin/reports/'+pagination).then(function (result) {
                $scope.totalReports=result.data.total;
                $scope.reports=result.data.reports;
            });
        };

        $scope.deleteReport=function (report) {
            $http.post(API_ENDPOINT.url+'/admin/reportDelete',report).then(function () {
            $scope.reports.splice($scope.reports.indexOf(report),1);
            });
        };


        $scope.pageChanged = function () {
            loadReports($scope.currentPage);
        };
        loadReports($scope.currentPage);



    }]).
controller('adminContactusController',['$scope','$http','API_ENDPOINT',
    function ($scope,$http,API_ENDPOINT) {

        $scope.$parent.title="Dashboard";
        $scope.registered=0;
        $http.get(API_ENDPOINT.url+'/admin/dashboard').then(function (result) {
            $scope.registered=result.data.registred;
            $scope.postedArticle=result.data.postedArticle;
        })
    }]);


