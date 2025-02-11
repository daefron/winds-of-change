angular.module("beamng.apps").directive("windsOfChange", [
  function () {
    return {
      templateUrl: "/ui/modules/apps/windsOfChange/app.html",
      replace: true,
      restrict: "EA",
      scope: true,

      link: function (scope, element, attrs) {
        scope.carDirection = 0;
        scope.windDirection = 0;
        scope.windSpeed = 0;
        scope.direction = scope.windDirection + scope.carDirection;

        const windLines = document.getElementById("windLineHolder");

        var streamsList = ["sensors"];
        StreamsManager.add(streamsList);

        scope.$on("streamsUpdate", function (event, streams) {
          if (!streams.sensors) {
            return;
          }
          scope.carDirection = Number.parseFloat(
            (-streams.sensors.yaw * 360) / (2 * Math.PI)
          ).toFixed(2);
          if (scope.carDirection < 0) {
            scope.carDirection += 360;
          }
          scope.direction =
            Number(scope.windDirection) - Number(scope.carDirection) + 180;
          if (scope.direction > 360) {
            scope.direction -= 360;
          }
          const maxSpeed = document.getElementById("maxSpeedInput").value;
          windLines.style.transform = "rotate(" + scope.direction + "deg)";
          windLines.style.margin =
            -200 * (1 - scope.windSpeed / maxSpeed) + "px";
        });

        scope.$on("destroy", function () {
          StreamsManager.remove(streamsList);
        });

        let windLoop;
        scope.startWind = function (event) {
          if (windLoop) {
            return;
          }
          windLoop = setInterval(() => {
            let minSpeed = document.getElementById("minSpeedInput").value;
            if (minSpeed < 0) {
              document.getElementById("minSpeedInput").value = 0;
            }
            let maxSpeed = document.getElementById("maxSpeedInput").value;
            if (minSpeed > maxSpeed) {
              document.getElementById("maxSpeedInput").value = minSpeed;
            }
            if (maxSpeed < 0) {
              document.getElementById("maxSpeedInput").value = 0;
            }
            let minAngle =
              Number(document.getElementById("minAngleInput").value) + 90;
            if (minAngle < 90) {
              document.getElementById("minAngleInput").value = 0;
            }
            if (minAngle > 449) {
              document.getElementById("minAngleInput").value = 359;
            }
            let maxAngle =
              Number(document.getElementById("maxAngleInput").value) + 90;
            if (maxAngle < 91) {
              document.getElementById("maxAngleInput").value = 1;
            }
            if (maxAngle > 450) {
              document.getElementById("maxAngleInput").value = 360;
            }
            if (minAngle > maxAngle) {
              document.getElementById("maxAngleInput").value =
                minAngle - 90 + 1;
            }
            bngApi.engineLua(
              "extensions.windsOfChange.updateWind(" +
                minSpeed +
                "," +
                maxSpeed +
                "," +
                minAngle +
                "," +
                maxAngle +
                ")"
            );
          }, 50);
        };

        scope.endWind = function (event) {
          clearInterval(windLoop);
          windLoop = null;
          bngApi.engineLua("extensions.windsOfChange.stopWind()");
        };

        scope.$on("ReceiveData", function (_, data) {
          const newSpeed = data.split(":")[0];
          const newDirection = data.split(":")[1];
          scope.windSpeed = Number.parseFloat(newSpeed).toFixed(2);
          scope.windDirection = Number.parseFloat(
            Number(newDirection) - 90
          ).toFixed(2);
          if (scope.windDirection < 0) {
            scope.windDirection = Number.parseFloat(
              Number.parseFloat(scope.windDirection) + 360
            ).toFixed(2);
          }
          scope.direction =
            Number(scope.windDirection) - Number(scope.carDirection) + 180;
          if (scope.direction > 360) {
            scope.direction -= 360;
          }
        });
      },
    };
  },
]);
