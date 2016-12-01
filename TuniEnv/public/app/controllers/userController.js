/**
 * Created by medna on 09/10/2016.
 */
app.
controller('userProfileController', ['$http', '$scope', 'authService', 'flashMessage',
    '$anchorScroll', '$filter', 'Upload', 'toastr', 'API_ENDPOINT',
    function ($http, $scope, authService, flashMessage, $anchorScroll, $filter, Upload, toastr, API_ENDPOINT) {


        $scope.phoneRegex = "\\d{2}[-]\\d{3}[-]\\d{3}";
        var data = function () {
            return {
                username: $scope.user.username,
                email: $scope.user.email,
                firstname: $scope.user.firstname,
                lastname: $scope.user.lastname,
                phone: $scope.user.phone,
                facebook: $scope.user.facebook,
                twitter: $scope.user.twitter
            }
        };

        var initPass = function () {
            $scope.psw.password = "";
            $scope.psw.confirm = "";
            $scope.psw.confirmUpdate = "";
            $scope.userPrototype = data();
        };

        $scope.tryPassword = 0;
        $scope.psw = {};
        $scope.$watch('MainReady', function (newV) {
            if (newV) {
                initPass();
            }
        });
        $scope.removePicture = function () {
            $scope.user.avatar = null;
            $http.post('/api/user/removeAvatar').then(function (result) {
                toastr.error('Your avatar has been deleted ! ', 'Avatar Remove');
                angular.element('#avatar').attr('src', 'public/assets/img/no-photo.png');
            });
        };


        $scope.uploadProfileImage = function (file) {

            if (file) {
                Upload.upload({
                    url: API_ENDPOINT.url+'/user/uploadAvatar',
                    data: {file: file}
                }).then(function (resp) {
                    toastr.success('Your avatar has been updated ! ', 'Avatar Upload');
                    console.log(resp.data);
                    $scope.user.avatar = resp.data;
                }, function (resp) {
                }, function (evt) {
                });
            }
        };

        $scope.updatePassword = function () {
            if ($scope.psw.confirm != $scope.psw.password)
                flashMessage.create("Password & Confirmation Password does not match", 'danger', 5000);
            else
                $http.post('/api/user/updatePassword', $scope.psw).then(function (result) {
                    if (result.data.success)
                        flashMessage.create("Your password Has been updated", 'success', 5000);
                    else
                        result.data.errors.forEach(function (err) {
                            flashMessage.create(err.msg, 'danger', 5000);
                        });

                    initPass();
                });
        };

        $scope.updateProfile = function () {
            $http.post('/api/user/updateProfile', $scope.userPrototype).then(function (result) {
                if (result.data.success) {
                    toastr.success('Your profile is up to date  ! ', 'Profile update');
                    $anchorScroll();
                } else {
                    result.data.errors.forEach(function (errr) {
                        flashMessage.create(errr.message, 'danger', 5000);
                    });
                    $anchorScroll();
                }
            });
        }
    }]).
controller('userArticlesController', ['$scope', '$http', 'API_ENDPOINT', 'SweetAlert',
    function ($scope, $http, API_ENDPOINT, SweetAlert) {

        $scope.loading = true;
        $http.get(API_ENDPOINT.url + '/user/articles').then(function (response) {
            $scope.articles = response.data.articles;
            $scope.loading = false;
        });
        $scope.removeArticle = function (article, index) {
            SweetAlert.swal({
                    title: "Are you sure?",
                    text: "Your will not be able to recover this article again !",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55", confirmButtonText: "Yes, delete it!",
                    cancelButtonText: "No, cancel!",
                    closeOnConfirm: false,
                    closeOnCancel: false,
                    showLoaderOnConfirm: true,
                },
                function (isConfirm) {
                    if (isConfirm) {
                        $http.post(API_ENDPOINT.url + '/article/remove', article).then(function () {
                            $scope.articles.splice(index, 1);
                            SweetAlert.swal("Deleted!", "Your article has been deleted.", "success");
                        });
                    } else {
                        SweetAlert.swal("Cancelled", "Your imaginary file is safe :)", "error");
                    }
                });
        }

    }]).
controller('userDiscussionsController', ['$scope', 'API_ENDPOINT', '$http', 'toastr', '$timeout', '$state', '$stateParams',
    function ($scope, API_ENDPOINT, $http, toastr, $timeout) {
        $scope.isSelectedM = false;
        $scope.selection = [];
        $scope.message = {};
        $scope.discussions = [];
        $scope.loading = true;

        $scope.getDiscussions = function () {
            $scope.loading = true;
            $scope.discussions = $scope.user.discussions;
            $scope.isAllSelected = function () {
                return $scope.selection.length == $scope.discussions.length;
            };
            $timeout(function () {
                $scope.loading = false;
            }, 1000);
        };

        $scope.$watch('MainReady', function (newV) {
            if (newV)
                $scope.getDiscussions();
        });

        $scope.selectAll = function () {
            if ($scope.isAllSelected())
                $scope.selection = [];
            else {
                $scope.selection = [];
                $scope.discussions.forEach(function (discussion) {
                    $scope.selection.push(discussion._id);
                });
            }

        };

        $scope.toggle = function (item) {
            var idx = $scope.selection.indexOf(item);
            if (idx > -1) {
                $scope.selection.splice(idx, 1);
            }
            else {
                $scope.selection.push(item);
            }
        };
        $scope.delete = function () {
            $scope.discussions.map(function (discussion) {
                if ($scope.selection.indexOf(discussion._id) > -1) {
                    $scope.discussions.splice($scope.discussions.indexOf(discussion), 1);
                }
            });
            $http.post(API_ENDPOINT.url + '/discussion/delete', {discussions: $scope.selection}).then(function (res) {
                $scope.selection = [];
            })
        };

    }]).
controller('userFavoritesController', ['$scope', '$http', 'API_ENDPOINT',
    function ($scope, $http, API_ENDPOINT) {

        $scope.loading = true;
        $http.get(API_ENDPOINT.url + '/user/favorite').then(function (res) {
            $scope.favorites = res.data.favorites;
            $scope.loading = false;
        });

        $scope.removeFavorite = function (article, index) {
            console.log("remove !");
            $http.post(API_ENDPOINT.url + '/user/favorite/remove', {article_id: article._id}).then(function () {
                $scope.favorites.splice(index, 1);
            });
        }
    }]).
controller('displayUserProfileController', ['$scope', '$http', 'API_ENDPOINT', '$stateParams', 'toastr',
    'socket', 'ngProgressFactory', '$timeout',
    function ($scope, $http, API_ENDPOINT, $stateParams, toastr, socket, ngProgressFactory, $timeout) {
        $scope.$watch('MainReady', function (newV) {
            if (newV)
                $scope.currentUser = $scope.user;
        });
        $scope.loadItemNumber = 3;

        var load = function () {
            $http.get(API_ENDPOINT.url + '/user/profile/' + $stateParams.username).then(function (res) {
                $scope.userInfo = res.data;
            });
        };
        load();

        $scope.Unfollow = function () {
            $scope.user.following.splice($scope.user.following.indexOf($scope.userInfo), 1);
            $http.post(API_ENDPOINT.url + '/user/follow/remove', {username: $scope.userInfo.username});
        };
        $scope.Follow = function () {
            $scope.user.following.push($scope.userInfo.username);
            $http.post(API_ENDPOINT.url + '/user/follow/add', {username: $scope.userInfo.username});
        };

        $scope.loadMore = function () {
            $scope.loadItemNumber += 3;
        };

    }]);
/*

 $scope.messages.forEach(function (msg) {
 $scope.selection.push(msg._id);
 })
 */