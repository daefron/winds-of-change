angular.module("beamng.apps").directive("windsOfChange", [
  function () {
    return {
      templateUrl: "/ui/modules/apps/windsOfChange/app.html",
      replace: true,
      scope: true,

      link: function (scope, element, attrs) {
        var windLoop;
        bngApi.engineLua("extensions.windsOfChange.retrieveStoredLoop()");
        scope.$on("RetrieveLoop", function (_, data) {
          windLoop = data;
        });

        scope.carDirection = 0;
        scope.windDirection = 0;
        scope.windSpeed = 0;
        scope.direction = scope.windDirection + scope.carDirection;

        scope.animationLines = [];

        const windLines = document.getElementById("windLineHolder");

        var streamsList = ["sensors"];
        StreamsManager.add(streamsList);

        let frame = 0;
        const animationSettings = {
          lineCount: 18,
          radius: 110,
          spawnDistance: 40,
          frameSpeed: 1,
          moveDistance: 0,
        };

        scope.$on("streamsUpdate", function (event, streams) {
          if (!streams.sensors) {
            return;
          }
          updateValues();
          scope.carDirection = Number.parseFloat(
            (-streams.sensors.yaw * 360) / (2 * Math.PI)
          ).toFixed(2);
          if (scope.carDirection < 0) {
            scope.carDirection += 360;
          }
          scope.direction =
            Number(scope.windDirection) - Number(scope.carDirection);
          if (scope.direction > 360) {
            scope.direction -= 360;
          }
          windLines.style.transform = "rotate(" + scope.direction + "deg)";

          if (scope.windSpeed / 20 < animationSettings.spawnDistance / 2) {
            animationSettings.frameSpeed = scope.windSpeed / 20;
          } else {
            animationSettings.frameSpeed = animationSettings.spawnDistance / 2;
          }
          if (scope.windSpeed * 1.8 > 20 && scope.windSpeed * 1.8 < 60) {
            animationSettings.moveDistance = scope.windSpeed * 1.8;
          } else {
            if (scope.windSpeed * 1.8 < 20) {
              animationSettings.moveDistance = 20;
            } else {
              animationSettings.moveDistance = 60;
            }
          }

          if (frame > animationSettings.spawnDistance) {
            frame = 0;
          }
          frame += 1 * animationSettings.frameSpeed;
          scope.animationLines = makeLines(-300 + frame, 200 + frame);
          function makeLines(min, max) {
            let lineHolder = [];
            for (let i = min; i <= max; i += animationSettings.spawnDistance) {
              lineHolder.push(lineMaker(i));
              function lineMaker(height) {
                let lineArray = [];
                for (let i = animationSettings.lineCount / 2; i >= 0; i--) {
                  lineArray.push((i - 0.9999) * -1);
                }
                for (let i = 1; i <= animationSettings.lineCount / 2; i++) {
                  lineArray.push(i - 0.9999);
                }
                class Dash {
                  constructor(xPos) {
                    this.X = xPos * 30;
                    this.Y = height * 2;
                    this.distance = Math.sqrt(this.X ** 2 + (this.Y / 1) ** 2);
                    this.style = {
                      width: 3,
                      height: 15,
                      backgroundColor: "white",
                      position: "absolute",
                      left: this.X + 147,
                      marginTop: this.Y + 50,
                      marginLeft:
                        this.distance < animationSettings.radius
                          ? this.X > 0
                            ? (1 -
                                this.distance ** 2 /
                                  animationSettings.radius ** 2) *
                              animationSettings.moveDistance
                            : (1 -
                                this.distance ** 2 /
                                  animationSettings.radius ** 2) *
                              -animationSettings.moveDistance
                          : 0,
                    };
                  }
                }
                return Array.from(lineArray, (value) => new Dash(value));
              }
            }
            return lineHolder;
          }
        });
        scope.$on("destroy", function () {
          StreamsManager.remove(streamsList);
          clearInterval(windLoop);
        });

        let minSpeed, maxSpeed, minAngle, maxAngle, gapMult;
        function updateValues() {
          if (!document.getElementById("minSpeedInput")) {
            {
              return;
            }
          }
          minSpeed = Number(document.getElementById("minSpeedInput").value);
          maxSpeed = Number(document.getElementById("maxSpeedInput").value);
          if (minSpeed >= maxSpeed) {
            document.getElementById("maxSpeedInput").value = minSpeed;
            document.getElementById("minSpeedInput").value = maxSpeed;
          }
          minAngle = Number(document.getElementById("minAngleInput").value);
          maxAngle = Number(document.getElementById("maxAngleInput").value);
          if (minAngle >= maxAngle) {
            document.getElementById("maxAngleInput").value = minAngle;
            document.getElementById("minAngleInput").value = maxAngle;
          }
          if (minAngle < 0) {
            document.getElementById("minAngleInput").value = 0;
          }
          if (minAngle > 360) {
            document.getElementById("minAngleInput").value = 360;
          }
          if (maxAngle < 0) {
            document.getElementById("maxAngleInput").value = 0;
          }
          if (maxAngle > 360) {
            document.getElementById("maxAngleInput").value = 360;
          }
          gapMult = Number(document.getElementById("gapMultInput").value);
          let storedValues =
            minSpeed +
            "," +
            maxSpeed +
            "," +
            minAngle +
            "," +
            maxAngle +
            "," +
            gapMult;
          bngApi.engineLua(
            "extensions.windsOfChange.storeSettings(" + storedValues + ")"
          );
        }
        function startWind() {
          windLoop = setInterval(() => {
            updateValues();
            bngApi.engineLua(
              "extensions.windsOfChange.updateWind(" +
                minSpeed +
                "," +
                maxSpeed +
                "," +
                minAngle +
                "," +
                maxAngle +
                "," +
                gapMult +
                ")"
            );
          }, 200);
          bngApi.engineLua(
            "extensions.windsOfChange.storeLoop(" + windLoop + ")"
          );
        }

        scope.startWind = function (event) {
          if (windLoop) {
            bngApi.engineLua("extensions.windsOfChange.refreshWind()");
            return;
          }
          startWind();
        };

        scope.endWind = function (event) {
          clearInterval(windLoop);
          windLoop = null;
          bngApi.engineLua("extensions.windsOfChange.stopWind()");
        };

        let settings = document.getElementById("settings");
        settings.style.display = "none";
        scope.hideSettings = function (event) {
          if (settings.style.display == "none") {
            settings.style.display = "flex";
          } else {
            settings.style.display = "none";
          }
        };

        scope.$on("ReceiveData", function (_, data) {
          const newSpeed = data.split(":")[0];
          const newDirection = data.split(":")[1];
          scope.windSpeed = Number.parseFloat(newSpeed).toFixed(1);
          scope.windDirection = Number.parseFloat(
            Number(newDirection) - 90
          ).toFixed(1);
          if (scope.windDirection < 0) {
            scope.windDirection = Number.parseFloat(
              Number.parseFloat(scope.windDirection) + 360
            ).toFixed(1);
          }
          scope.direction =
            Number(scope.windDirection) - Number(scope.carDirection) + 180;
          if (scope.direction > 360) {
            scope.direction -= 360;
          }
        });
        scope.$on("RetrieveSettings", function (_, data) {
          const savedSettings = data.split(":");
          const minSpeed = savedSettings[0];
          const maxSpeed = savedSettings[1];
          const minAngle = savedSettings[2];
          const maxAngle = savedSettings[3];
          const gapMult = savedSettings[4];
          document.getElementById("minSpeedInput").value = minSpeed;
          document.getElementById("maxSpeedInput").value = maxSpeed;
          document.getElementById("minAngleInput").value = minAngle;
          document.getElementById("maxAngleInput").value = maxAngle;
          document.getElementById("gapMultInput").value = gapMult;
        });
      },
    };
  },
]);
