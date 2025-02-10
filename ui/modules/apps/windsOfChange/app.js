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
          $scope.carDirection = 0;
          $scope.windDirection = 0;
          $scope.windSpeed = 0;
          $scope.direction = $scope.windDirection + $scope.carDirection;

          var streamsList = ["sensors"];
          StreamsManager.add(streamsList);
          $scope.$on("streamsUpdate", function (event, streams) {
            if (!streams.sensors) {
              return;
            }
            $scope.carDirection = Number.parseFloat(
              (-streams.sensors.yaw * 360) / (2 * Math.PI)
            ).toFixed(2);
            if ($scope.carDirection < 0) {
              $scope.carDirection += 360;
            }
            $scope.direction =
              Number($scope.windDirection) - Number($scope.carDirection) + 180;
            if ($scope.direction > 360) {
              $scope.direction -= 360;
            }
          });
          $scope.$on("destroy", function () {
            StreamsManager.remove(streamsList);
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
            $scope.windSpeed = Number.parseFloat(newSpeed).toFixed(2);
            $scope.windDirection = Number.parseFloat(newDirection - 90).toFixed(
              2
            );
            if ($scope.windDirection < 0) {
              $scope.windDirection += 360;
            }
            $scope.direction =
              Number($scope.windDirection) - Number($scope.carDirection) + 180;
            if ($scope.direction > 360) {
              $scope.direction -= 360;
            }
          });
        },
      ],
    };
  },
]);
