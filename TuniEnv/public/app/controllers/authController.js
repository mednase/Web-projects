/**
 * Created by medna on 02/10/2016.
 */
app.
controller('loginController', ['$scope','$rootScope', 'authService', 'flashMessage', '$state',
    function ($scope, $rootScope,authService, flashMessage, $state) {

        if (authService.isAuthenticated()) {
            $state.go('home');
        }

        $scope.doLogin = function () {
            data = $scope.login;
            authService.login(data).then(function (msg) {
                $rootScope.$broadcast("login");
                $state.go('home');
            }, function (error_msg) {
                flashMessage.create(error_msg, 'danger', 6000);
            });
        }

}]).
controller('registerController', ['$scope', 'authService', '$state', 'flashMessage','toastr',
    function ($scope, authService, $state, flashMessage,toastr) {
    if (authService.isAuthenticated())
        $state.go('user.profile');
    $scope.doRegister = function () {
        data = $scope.register;
        authService.register(data).then(function (data) {
            toastr.success(data.msg,'success','Create account');
            $state.go('login');
        }, function (response) {
            angular.forEach(response.errors, function (error) {
                flashMessage.create(error.message, 'danger', 6000);
            });
        });
    }

}]).
controller('logoutController', ['authService', '$state', '$scope', function (authService, $state, $scope) {
    authService.logout();
    $scope.$parent.authenticated = false;
    $state.go('home');

}]).
controller('forgotController',['authService','$scope','flashMessage',function (authService,$scope,flashMessage) {
    $scope.email="";
    $scope.forgetProcess=function () {
        authService.forgot($scope.email).then(function (success) {
            flashMessage.create(success.data.msg, 'info', 6000);
        },function(fail){
            flashMessage.create(fail.data.msg, 'danger', 6000);
        })
    }
}]).
controller('resetPasswordController',['authService','flashMessage','$stateParams','$state','$scope',
    '$http','toastr'
    ,function (authService,flashMessage, $stateParams,$state,$scope,toastr) {

    authService.resetTokenValid($stateParams.token).then(function (response) {
        if(response.data.success==false){
            flashMessage.create(response.data.msg,'danger',6000);
            $state.go('forget');
        }
        $scope.resetProcess=function () {
            authService.resetPassword($stateParams.token,$scope.password,$scope.cpassword).then(function (response) {
                if(response.data.success==false)
                    return flashMessage.create(response.data.msg,'danger',6000);

                console.log(response.data.msg);
                toastr.success(response.data.msg,'Reset Password');
                $state.go('login');
            })
        }

    });

}]);



