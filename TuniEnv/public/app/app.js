var app = angular.module('TuniEnv', ['ui.router', 'ngFileUpload',
    'toastr', 'ngAnimate', 'ui.bootstrap', 'gettext', 'ngMap', 'ngProgress', 'ngSweetAlert']);


app.config(['$urlRouterProvider', '$urlMatcherFactoryProvider', '$stateProvider', '$httpProvider', '$locationProvider'
    , '$logProvider', 'toastrConfig',
    function ($urlRouterProvider, $urlMatcherFactoryProvider, $stateProvider, $httpProvider, $locationProvider, $logProvider
        , toastrConfig) {

        /* Configurate Dropzone */
        Dropzone.autoDiscover = false;

        $logProvider.debugEnabled(true);
        $httpProvider.interceptors.push(function ($q, $location) {
            return {
                response: function (response) {
                    return response;
                },
                responseError: function (response) {
                    if (response.status == 404)
                        $location.url('/error');
                    if (response.status === 401)
                        $location.url('/login');
                    if (response.status === 403) {
                        $location.url('/logout');
                    }
                    return $q.reject(response);
                }
            };
        });

        /* disable ui-router # in url */
        $urlRouterProvider.otherwise('/error');
        $locationProvider.html5Mode(true);


        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: '/public/views/core/home.html',
                controller: 'homeController'
            })
            .state('login', {
                url: '/login',
                templateUrl: '/public/views/core/login.html',
                controller: 'loginController'

            })
            .state('authFacebook', {
                url: '/auth/facebook',
            })
            .state('authTwitter', {
                url: '/auth/twitter',
            })
            .state('authGoogle', {
                url: '/auth/google',
            })
            .
            state('socialMediaLoginResponse',{
                url: '/auth/successLoginSocialMedia?:token',
                controller:function ($rootScope,$state,$stateParams,authService) {
                    authService.storeUserCredentials($stateParams.token);
                    $rootScope.$broadcast("login");
                    $state.go('home');
                }
            })
            .state('logout', {
                url: '/logout',
                controller: 'logoutController'
            })
            .state('register', {
                url: '/register',
                templateUrl: '/public/views/core/register.html',
                controller: 'registerController'
            })
            .state('about', {
                url: '/about',
                templateUrl: '/public/views/core/about.html'
            })
            .state('faq', {
                url: '/faq',
                templateUrl: '/public/views/core/faq.html'
            })
            .state('forget', {
                url: '/forget',
                templateUrl: '/public/views/core/forget-password.html',
                controller: 'forgotController'
            })
            .state('resetPassword', {
                url: '/resetpassword/:token',
                templateUrl: '/public/views/core/reset.html',
                controller: 'resetPasswordController'
            })
            .state('governorate', {
                url: '/governorate/:name',
                templateUrl: '/public/views/core/home.html',
                controller: 'homeController'
            })
            .state('popular',{
                url: '/popular',
                templateUrl: '/public/views/core/home.html',
                controller: 'homeController'
            })
            .state('user_profile', {
                url: '/user/profile/:username',
                templateUrl: '/public/views/core/user_profile.html',
                controller: 'displayUserProfileController'
            })

            .state('new_article', {
                url: '/article/new',
                templateUrl: '/public/views/article/new.html',
                controller: 'newArticleController',
                data: {
                    authenticate: true
                }
            })
            .state('edit_article', {
                url: '/article/edit/:article_id',
                templateUrl: '/public/views/article/edit.html',
                controller: 'editArticleController',
                data: {
                    authenticate: true
                },
                resolve:{
                    article: function ($http, API_ENDPOINT, $stateParams, $state) {
                        return $http.get(API_ENDPOINT.url + '/article/show/' + $stateParams.article_id).then(function (res) {
                            console.log(res.data);
                            return res.data;
                        },function () {
                            $state.go("error");
                        });
                    }
                }

            })
            .state('show_article', {
                url: '/article/show/:article_id',
                templateUrl: '/public/views/article/show.html',
                controller: 'showArticleController',
                resolve: {
                    article: function ($http, API_ENDPOINT, $stateParams, $state) {
                        return $http.get(API_ENDPOINT.url + '/article/show/' + $stateParams.article_id).then(function (res) {
                            return res.data;
                        },function () {
                            $state.go("error");
                        });
                    }
                }
            })


            .state('user', {
                url: '/user',
                abstract: true,
                template: ' <div ui-view></div>',
                data: {
                    authenticate: true
                }

            })
            .state('user.profile', {
                url: '/profile',
                templateUrl: '/public/views/user/profile.html',
                controller: 'userProfileController'
            })
            .state('user.user_articles', {
                url: '/articles',
                templateUrl: '/public/views/user/user_articles.html',
                controller: 'userArticlesController'
            })
            .state('user.Discussions', {
                url: '/discussions',
                templateUrl: '/public/views/user/user_discussions.html',
                controller: 'userDiscussionsController'
            })
            .state('user.discussion_room', {
                url: '/discussion_room/:channel',
                templateUrl: '/public/views/user/user_discussionRoom.html',
                controller: 'discussionRoomController'
            })
            .state('user.user_favorites', {
                url: '/favorites',
                templateUrl: '/public/views/user/user_favorites.html',
                controller: 'userFavoritesController'
            })
            .state('user.user_notifications', {
                url: '/notifications',
                templateUrl: '/public/views/user/user_notifications.html'
            })
            .state('admin', {
                url: '/admin',
                abstract: true,
                templateUrl: '/public/views/admin/admin.html',
                data: {
                    authenticate: true,
                    admin: true
                }

            })
            .state('admin.dashboard', {
                url: '/dashboard',
                templateUrl: '/public/views/admin/dashboard.html',
                controller: 'dashboardController'
            })
            .state('admin.profile', {
                url: '/profile',
                templateUrl: '/public/views/admin/admin_profile.html',
                controller: 'userProfileController'
            })
            .state('admin.discussions', {
                url: '/discussions',
                templateUrl: '/public/views/admin/admin_discussions.html',
                controller: 'adminMessagesController'
            })
            .state('admin.discussion_room', {
                url: '/discussion_room/:channel',
                templateUrl: '/public/views/admin/admin_discussionRoom.html',
                controller: 'discussionRoomController'
            })
            .state('admin.users', {
                url: '/users',
                templateUrl: '/public/views/admin/users.html',
                controller: 'adminUsersController'
            })
            .state('admin.articles', {
                url: '/articles',
                templateUrl: '/public/views/admin/admin_articles.html',
                controller: 'adminArticlesController'
            })
            .state('admin.articleEdit', {
                url: '/article/:article_id',
                templateUrl: '/public/views/admin/admin_article_edit.html',
                controller: 'adminArticlesEditController'
            })
            .state('admin.reports', {
                url: '/reports',
                templateUrl: '/public/views/admin/reports.html',
                controller: 'adminReportsController'
            })
            .state('admin.contactUs', {
                url: '/contactUs',
                templateUrl: '/public/views/admin/contactUs.html',
                controller: 'adminContactusController'
            })

            .state('error', {
                url: '/error',
                templateUrl: '/public/views/core/error.html'
            });


        /* Toast Config */
        angular.extend(toastrConfig, {
            autoDismiss: false,
            containerId: 'toast-container',
            maxOpened: 0,
            newestOnTop: true,
            positionClass: 'toast-top-right',
            preventDuplicates: false,
            preventOpenDuplicates: false,
            target: 'body'
        });

    }])
// run blocks
    .run(function ($rootScope, $state, authService, flashMessage, toastr, $window, API_ENDPOINT) {
        Array.prototype.last = function() {
            return this[this.length-1];
        };
        $rootScope.$watch('isLoading',function (newV) {
            console.log(newV);
        })

        $rootScope.$on('$stateChangeStart', function (event, next, toParams, current) {
            var SocialMedia=['authFacebook','authTwitter','authGoogle'];

            /* important for redirect to social media callbacks */
            if (SocialMedia.indexOf(next.name)>-1 ) {
                event.preventDefault();
                $window.open(API_ENDPOINT.url+ next.url, '_self');
            }

            /* for admin template switch :hide current navbar & sidebar*/
            if (current.data && current.data.admin && !next.data) {
                $rootScope.isLoading=true;
                $rootScope.$broadcast("dashboard-leave", {});
            }





            if (next.data && next.data.authenticate && !authService.isAuthenticated()) {
                event.preventDefault();
                flashMessage.create("You shoud login first ", "danger", 5000);
                $state.go('login');
            } else {
                if (next.name == "edit_article") {
                    authService.getUser(function (user) {
                        if (user.articles == null || user.articles.indexOf(toParams.article_id) == -1) {
                            toastr.error("You are not allowed", "Unauthorized");
                            $state.go("home");
                        }
                    });
                }
                if (next.data && next.data.admin && (!current.data || !current.data.admin)) {
                    authService.getUser(function (user) {
                        if (user.role == "admin" || user.role == "super-admin") {
                            $rootScope.isLoading=true;
                            $rootScope.$broadcast("dashboard-enter", {});
                        }
                        else {
                            event.preventDefault();
                            toastr.error("You are not allowed", "Unauthorized");
                            $state.go("home");
                        }

                    })
                }


            }
            $rootScope.$on('$stateChangeSuccess', function () {
                document.body.scrollTop = document.documentElement.scrollTop = 0;
            });


        });
    });
