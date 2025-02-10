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
          $scope.speed = 0;
          $scope.direction = 0;

          let streamList = ["engineInfo"];
          StreamsManager.add(streamList);

          $scope.$on("destroy", function () {
            StreamsManager.remove(streamList);
          });
          let windLoop;
          $scope.startWind = function (event) {
            if (windLoop) {
              return;
            }
            windLoop = setInterval(() => {
              bngApi.engineLua("extensions.windsOfChange.updateWind()");
            }, 50);
          };

          $scope.endWind = function (event) {
            clearInterval(windLoop);
            windLoop = null;
            bngApi.engineLua("extensions.windsOfChange.stopWind()");
          };

          $scope.$on("ReceiveData", function (_, data) {
            const newSpeed = data.split(":")[0];
            const newDirection = data.split(":")[1];
            $scope.speed = Number.parseFloat(newSpeed).toFixed(2);
            $scope.direction = Number.parseFloat(newDirection).toFixed(2);
          });
        },
      ],
    };
  },
]);
