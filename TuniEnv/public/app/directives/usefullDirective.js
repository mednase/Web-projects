/**
 * Created by medna on 09/11/2016.
 */
app.directive('icheck', ['$timeout', function () {
    return {
        restrict: 'A',
        scope: {},
        link: function (scope, element) {
            element.iCheck({checkboxClass: 'icheckbox_minimal-grey', radioClass: 'iradio_minimal-grey'});
        }
    }
}]).directive("gitem", function ($timeout) {
    var template =
        "<a style='position: relative;' class='gallery-item col-md-3' href='{{image}}'  data-gallery='' title='{{imgtitle}}'>" +
        "<div class='image'>" +
        "<img src='{{image}}' class='img-responsive' alt='{{imgtitle}}'/>" +
        "<ul class='gallery-item-controls'>" +
        "<li>" +
        "<label class='check'>" +
        "<input icheck type = 'checkbox'/>" +
        "</label>" +
        "</li>" +
        "<li  >" +
        "<span class='gallery-item-remove'> <i class='fa fa-times'> </i></span>" +
        "</li>" +
        "</ul> " +
        "</div> " +
        "</a> ";
    return {
        restrict: "AE",
        replace: true,
        scope: {
            imgtitle: "@",
            images: "=images",
            image: "@"
        },
        template: template,
        link: function (scope, elem) {
            var ichk = elem[0].querySelector('.iCheck-helper');
            var iremove = elem[0].querySelector('.gallery-item-remove');
            angular.element(ichk).bind('click', function () {
                angular.element(elem).toggleClass("active")
            });
            angular.element(iremove).bind('click', function (event) {
                $timeout(function () {
                    event.preventDefault();
                    scope.$apply(function () {
                        scope.images.splice(scope.images.indexOf(scope.image), 1);
                    })
                },200)


            });

            var toggle = angular.element(document.querySelector("#gallery-toggle-items"));
            toggle.bind('click',function () {
                    angular.element(ichk).click();
            });

            var del = angular.element(document.querySelector("#deleteImages"));
            del.bind('click',function () {
                if (angular.element(elem).hasClass("active")) {
                    iremove.click();
                }
            });
        }
    }


}).directive("uis", function ($timeout) {
    var template =
        "<div>" +
        "<select ng-required='true' name='{{name}}' class='form-control select' ng-model='value' data-style='btn-success' data-live-search='true'>" +
        "<option  ng-repeat='choice in choices track by $index' value='{{choice}}'>{{choice}}</option>" +
        "</select>" +
        "</div>";
    return {
        restrict: 'E',
        replace: true,
        require: 'ngModel',
        transculde: true,
        scope: {
            choices: "=",
            value: "=ngModel",
            name: "@"
        },
        template: template,
        link: function (scope, elem, att) {
            $timeout(function () {
                if ($(".select").length > 0) {
                    $(".select").selectpicker();
                    $(".select").on("change", function () {
                        if ($(this).val() == "" || null === $(this).val()) {
                            if (!$(this).attr("multiple"))
                                $(this).val("").find("option").removeAttr("selected").prop("selected", false);
                        } else {
                            $(this).find("option[value=" + $(this).val() + "]").attr("selected", true);
                        }
                    });

                }

            }, 500);

        }
    }


}).directive('loading', function () {
    return {
        restrict: 'E',
        template: "<div class=' text-center container-loading'> " +
        "<div class='content-loading'> " +
        "<div class='circle'></div> " +
        "<div class='circle1'></div> " +
        "<div class='ball'></div> " +
        "</div> " +
        "</div>"
    }
})