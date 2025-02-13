angular.module("beamng.apps").directive("windsOfChange", [
  function () {
    return {
      templateUrl: "/ui/modules/apps/windsOfChange/app.html",
      replace: true,
      scope: true,
      restrict: "EA",

      link: function (scope, element, attrs) {
        let windLoop;
        bngApi.engineLua("extensions.windsOfChange.retrieveStoredLoop()");
        scope.$on("RetrieveLoop", function (_, data) {
          windLoop = data;
        });

        bngApi.engineLua("extensions.windsOfChange.retrieveStoredSettings()");

        scope.values = {
          carDirection: 0,
          windDirection: 0,
          windSpeed: 0,
          direction: 0,
        };

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

        const presets = {
          lightBreeze: {
            name: "Light breeze",
            minSpeed: 5,
            maxSpeed: 20,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 5,
            angleGapMult: 5,
          },
          moderate: {
            name: "Moderate breeze",
            minSpeed: 20,
            maxSpeed: 35,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 10,
            angleGapMult: 10,
          },
          strongWinds: {
            name: "Stong breeze",
            minSpeed: 35,
            maxSpeed: 55,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 15,
            angleGapMult: 15,
          },
          tornado: {
            name: "Tornado",
            minSpeed: 200,
            maxSpeed: 350,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 1000,
            angleGapMult: 1000,
          },
        };

        let selectedPreset = "lightBreeze";
        scope.preset = presets[selectedPreset];

        scope.$on("streamsUpdate", function (event, streams) {
          if (!streams.sensors) {
            return;
          }
          updateSettings();

          scope.values.carDirection = Number.parseFloat(
            (-streams.sensors.yaw * 360) / (2 * Math.PI)
          ).toFixed(2);
          if (scope.values.carDirection < 0) {
            scope.values.carDirection += 360;
          }
          scope.values.direction =
            Number(scope.values.windDirection) -
            Number(scope.values.carDirection);
          if (scope.values.direction > 360) {
            scope.values.direction -= 360;
          }
          windLines.style.transform =
            "rotate(" + scope.values.direction + "deg)";

          if (
            scope.values.windSpeed / 20 <
            animationSettings.spawnDistance / 2
          ) {
            animationSettings.frameSpeed = scope.values.windSpeed / 20;
          } else {
            animationSettings.frameSpeed = animationSettings.spawnDistance / 2;
          }
          if (
            scope.values.windSpeed * 1.8 > 20 &&
            scope.values.windSpeed * 1.8 < 60
          ) {
            animationSettings.moveDistance = scope.values.windSpeed * 1.8;
          } else {
            if (scope.values.windSpeed * 1.8 < 20) {
              animationSettings.moveDistance = 20;
            } else {
              animationSettings.moveDistance = 60;
            }
          }

          if (!windLoop) {
            return;
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
                    this.style =
                      "width: 3; " +
                        "height: 10; " +
                        "backgroundColor: white; " +
                        "position: absolute; " +
                        "left: " +
                        this.X +
                        147 +
                        "; marginTop: " +
                        this.Y +
                        50 +
                        "; marginLeft: " +
                        this.distance <
                      animationSettings.radius
                        ? this.X > 0
                          ? (1 -
                              this.distance ** 2 /
                                animationSettings.radius ** 2) *
                            animationSettings.moveDistance
                          : (1 -
                              this.distance ** 2 /
                                animationSettings.radius ** 2) *
                            -animationSettings.moveDistance
                        : 0;
                    +";";
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

        let minSpeed, maxSpeed, minAngle, maxAngle, speedGapMult, angleGapMult;
        function updateSettings() {
          if (!document.getElementById("minSpeedInput")) {
            return;
          }
          const minSpeedInput = document.getElementById("minSpeedInput");
          const maxSpeedInput = document.getElementById("maxSpeedInput");
          const minAngleInput = document.getElementById("minAngleInput");
          const maxAngleInput = document.getElementById("maxAngleInput");
          const speedGapMultInput =
            document.getElementById("speedGapMultInput");
          const angleGapMultInput =
            document.getElementById("angleGapMultInput");
          minSpeed = Number(minSpeedInput.value);
          maxSpeed = Number(maxSpeedInput.value);
          if (minSpeed >= maxSpeed) {
            maxSpeedInput.value = minSpeed;
            minSpeedInput.value = maxSpeed;
          }
          minAngle = Number(minAngleInput.value);
          maxAngle = Number(maxAngleInput.value);
          if (minAngle >= maxAngle) {
            maxAngleInput.value = minAngle;
            minAngleInput.value = maxAngle;
          }
          if (minAngle < 0) {
            minAngleInput.value = 0;
          }
          if (minAngle > 360) {
            minAngleInput.value = 360;
          }
          if (maxAngle < 0) {
            maxAngleInput.value = 0;
          }
          if (maxAngle > 360) {
            maxAngleInput.value = 360;
          }
          speedGapMult = Number(speedGapMultInput.value);
          angleGapMult = Number(angleGapMultInput.value);
          const selectedPreset = document.getElementById("presetSelect").value;
          let storedValues =
            minSpeed +
            "," +
            maxSpeed +
            "," +
            minAngle +
            "," +
            maxAngle +
            "," +
            speedGapMult +
            "," +
            angleGapMult +
            "," +
            selectedPreset;
          bngApi.engineLua(
            "extensions.windsOfChange.storeSettings(" + storedValues + ")"
          );
        }

        function startWind() {
          windLoop = setInterval(() => {
            updateSettings();
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
                speedGapMult +
                "," +
                angleGapMult +
                ")"
            );
          }, 200);
          bngApi.engineLua(
            "extensions.windsOfChange.storeLoop(" + windLoop + ")"
          );
        }

        scope.startWind = function () {
          if (windLoop) {
            bngApi.engineLua(
              "extensions.windsOfChange.refreshWind(" +
                minAngle +
                "," +
                maxAngle +
                "," +
                minSpeed +
                "," +
                maxSpeed +
                ")"
            );
            return;
          }
          startWind();
        };

        scope.endWind = function () {
          clearInterval(windLoop);
          windLoop = null;
          bngApi.engineLua("extensions.windsOfChange.stopWind()");
        };

        let settings = document.getElementById("settings");
        settings.style.display = "none";
        scope.hideSettings = function () {
          if (settings.style.display == "none") {
            settings.style.display = "flex";
          } else {
            settings.style.display = "none";
          }
        };

        scope.resetSettings = function () {
          document.getElementById("minSpeedInput").value =
            presets[selectedPreset].minSpeed;
          document.getElementById("maxSpeedInput").value =
            presets[selectedPreset].maxSpeed;
          document.getElementById("minAngleInput").value =
            presets[selectedPreset].minAngle;
          document.getElementById("maxAngleInput").value =
            presets[selectedPreset].minAngle;
          document.getElementById("speedGapMultInput").value =
            presets[selectedPreset].speedGapMult;
          document.getElementById("angleGapMultInput").value =
            presets[selectedPreset].angleGapMult;
        };

        scope.$on("ReceiveData", function (_, data) {
          const newSpeed = data.split(":")[0];
          const newDirection = data.split(":")[1];
          scope.values.windSpeed = Number.parseFloat(newSpeed).toFixed(1);
          scope.values.windDirection = Number.parseFloat(
            Number(newDirection)
          ).toFixed(1);
          if (scope.values.windDirection < 0) {
            scope.values.windDirection = Number.parseFloat(
              Number.parseFloat(scope.values.windDirection) + 360
            ).toFixed(1);
          }
        });

        scope.$on("RetrieveSettings", function (_, data) {
          const savedSettings = data.split(":");
          const minSpeed = savedSettings[0];
          const maxSpeed = savedSettings[1];
          const minAngle = savedSettings[2];
          const maxAngle = savedSettings[3];
          const speedGapMult = savedSettings[4];
          const angleGapMult = savedSettings[5];
          document.getElementById("minSpeedInput").value = minSpeed;
          document.getElementById("maxSpeedInput").value = maxSpeed;
          document.getElementById("minAngleInput").value = minAngle;
          document.getElementById("maxAngleInput").value = maxAngle;
          document.getElementById("speedGapMultInput").value = speedGapMult;
          document.getElementById("angleGapMultInput").value = angleGapMult;
        });
      },
    };
  },
]);
