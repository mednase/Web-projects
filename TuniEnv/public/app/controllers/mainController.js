app.controller('mainController', ['authService', '$location', '$scope', 'GOVERNORATE', 'socket', 'toastr',
    'API_ENDPOINT', '$http','$timeout','ngProgressFactory',
    function (authService, $location, $scope, GOVERNORATE, socket, toastr, API_ENDPOINT, $http,$timeout,
              ngProgressFactory) {

        $scope.governorate = GOVERNORATE;
        $scope.authenticated = authService.isAuthenticated();
        $scope.user={};
        $scope.MainReady=false;
        $scope.isLoading=true;
        var getUser=function(){
            authService.getUser(function (user) {
                $scope.user = user;
                socket.emit("join",{username:user.username});
                $scope.new_notifications = 0;
                $scope.new_messages = 0;
                user.discussions.forEach(function (discussion) {
                    if (discussion.messages.last().seen == false && discussion.messages.last().from.username!=$scope.user.username)
                        $scope.new_messages++;
                });
                user.notifications.forEach(function (notif) {
                    if (notif.seen == false)
                        $scope.new_notifications++;
                });
                $scope.MainReady=true;
            });
        };
        if ($scope.authenticated) {
            getUser()
        }else
            $scope.MainReady=true;

        $scope.$on('login',function () {
            $scope.authenticated=true;
            getUser();
        });
        $scope.setNotificationSeen = function () {
            $scope.new_notifications = 0;

            $http.post(API_ENDPOINT.url + '/user/notification/setSeen').then(function (res) {
                $scope.user.notifications.every(function (notif) {
                    notif.seen = true;
                });
            });
        };

        $scope.setMessageSeen = function () {
            $scope.new_messages = 0;
            $http.post(API_ENDPOINT.url + '/discussion/setSeen').then(function (res) {
                $scope.user.messages.every(function (msg) {
                    msg.seen = true;
                });
            });
        };
        socket.on('notification', function (data) {
            $scope.new_notifications+=1;
            $scope.user.notifications.push(data);
                    toastr.info(data.message);
        });
        socket.on('new-message', function (data) {
            $scope.new_messages+=1;
            if($scope.user.discussions.length>0)
            $scope.user.discussions.every(function (disc) {
                if(disc._id==data.discussion_id._id)
                    return disc.messages.push(data.msg);
            });
            else{
                var newDiscussion={_id:data.discussion_id._id,messages:[data.msg],users:[data.msg.from]};
                $scope.user.discussions.push(newDiscussion);

            }
            toastr.info("new message from "+data.msg.from.username + " : " + data.msg.body);
        });
        $scope.searchNav={text:""};

        /* Navigation Search !!! */
        $scope.resetSearch=function(){
            $timeout(function () {
                $scope.searchNav={text:""};
                $scope.searchResult=[{}];
            },300)
        };
        $scope.resetSearch();
        $scope.$watch('searchNav.text',function (newV) {
           if(newV.length>0){
                $http.post(API_ENDPOINT.url+"/article/find",{search:$scope.searchNav.text}).then(function (res) {
                    $scope.searchResult=res.data;
                })
           }}
        );

        $scope.$on("dashboard-enter",function () {
            $scope.dashboard=true;
            $timeout(function () {
                $scope.isLoading=false;
            },1500);
        });

        $scope.$on("dashboard-leave",function () {
            $scope.dashboard=false;
            $timeout(function () {
            },1500);
        });

        $(document).ready(function () {
            $timeout(function () {
                $scope.isLoading=false;
            },1000);        });

        $scope.message = {body: ""};
        $scope.sendMessage = function (username) {
            $scope.message.to = username;
            if ($scope.message.body.length > 0) {
                $scope.progressbar = ngProgressFactory.createInstance();
                $scope.progressbar.setHeight('4px');
                $scope.progressbar.setColor("#95b75d");
                $scope.progressbar.start();
                $timeout(function () {
                    $http.post(API_ENDPOINT.url + '/discussion/sendMessage', $scope.message).then(function (success) {
                        $scope.progressbar.complete();
                        toastr.success('Your message has been sent  ! ', 'Send Message');
                        $scope.message = {};
                    }, function (err) {
                        $scope.progressbar.setColor("red");
                        $scope.progressbar.stop();
                        $timeout(function () {
                            $scope.progressbar.reset();
                        }, 4000);
                        toastr.error('There was an error  ! ', 'Send Message');
                    });
                }, 2000);
            }

        };
    }]).
controller('discussionRoomController',['$scope','$http','API_ENDPOINT','$timeout','socket','$stateParams',
    function ($scope,$http,API_ENDPOINT,$timeout,socket,$stateParams) {

        $scope.dicussion={};
        $scope.discussionWith="";
        $scope.message={};
        var getDiscussion=function () {
            $http.get(API_ENDPOINT.url+'/discussion/messages/'+$stateParams.channel).then(function (result) {
                $scope.dicussion=result.data.messages;
                result.data.users.filter(function (user) {
                    return $scope.user.username!=user.username?$scope.discussionWith=user.username:"";
                });
                $scope.$parent.title="Messages > "+ $scope.discussionWith;
                $timeout(function () {
                    $(".messages .item").each(function(index){
                        var elm = $(this);
                        setInterval(function(){
                            elm.addClass("item-visible");
                        },index*200);
                    });
                    $('html, body').animate({
                        scrollTop: $("#scroll").offset().top
                    }, 1500);
                },200);

            });
        };
        getDiscussion();

        $scope.sendMessage = function () {
            $scope.message.to = $scope.discussionWith;
            $http.post(API_ENDPOINT.url + '/discussion/sendMessage', $scope.message).then(function (result) {
                $scope.dicussion.push(result.data.message);
                $timeout(function () {
                    $(".messages .item").each(function(index){
                        var elm = $(this);
                        setInterval(function(){
                            elm.addClass("item-visible");
                        },index);
                    });
                    $('html, body').animate({
                        scrollTop: $("#scroll").offset().top
                    }, 1500);
                },50);
                $scope.message = {};
            });
        };
        socket.on('new-message', function (data) {
            if(data.msg.from.username==$scope.discussionWith){
                $scope.dicussion.push(data.msg);
                $timeout(function () {
                    $(".messages .item").each(function(index){
                        var elm = $(this);
                        setInterval(function(){
                            elm.addClass("item-visible");
                        },index);
                    });
                    $('html, body').animate({
                        scrollTop: $("#scroll").offset().top
                    }, 1500);
                },200);
            }
        });
    }]);