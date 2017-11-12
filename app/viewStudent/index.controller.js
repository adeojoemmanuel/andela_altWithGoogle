(function () {
    'use strict';

    angular.module('app')
    .controller('viewStudent.IndexController', Controller);

    function Controller(UserService) {
        var vm = this;

        vm.user = null;

        initController();

        function initController() {
            // getall user
            UserService.GetAll().then(function (response) {
                vm.user = response.data;
                console.log(response)
            });
        }
    }

})();