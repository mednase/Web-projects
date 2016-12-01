/**
 * Created by medna on 05/10/2016.
 */



app.factory('flashMessage', ['$rootScope', function ($rootScope) {

    var FlashMessage = {};
    $rootScope.Flash = [];
    FlashMessage.create = function (message, type,duration) {
        $rootScope.Flash.push({message: message, type: type});

        setTimeout(function () {
            $rootScope.Flash.pop();
            $rootScope.$digest();
        }, duration)

    };


    return FlashMessage;

}]);