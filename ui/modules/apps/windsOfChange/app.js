angular.module("beamng.apps").directive("windsOfChange", [
  function () {
    return {
      templateUrl: "/ui/modules/apps/windsOfChange/app.html",
      replace: true,
      restrict: "EA",
      scope: true,

      controller: [
        "$scope",
        function ($scope) {
          let streamList = ["engineInfo"];
          StreamsManager.add(streamList);

          $scope.$on("destroy", function () {
            StreamsManager.remove(streamList);
          });
          let windLoop;
          $scope.startWind = function (event) {
            windLoop = setInterval(() => {
              bngApi.engineLua("extensions.windsOfChange.updateWind()");
            }, 100);
          };

          $scope.endWind = function (event) {
            clearInterval(windLoop);
            bngApi.engineLua("extensions.windsOfChange.stopWind()");
          };
        },
      ],
    };
  },
]);
