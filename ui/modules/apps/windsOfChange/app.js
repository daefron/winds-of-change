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

        scope.values = {
          carDirection: 0,
          windDirection: 0,
          windSpeed: 0,
          direction: 0,
        };

        scope.animationLines = [];

        scope.settingsOpen = false;

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

        const defaultPresets = [
          {
            id: 0,
            name: "Light breeze",
            minSpeed: 5,
            maxSpeed: 20,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 5,
            angleGapMult: 5,
          },
          {
            id: 1,
            name: "Moderate breeze",
            minSpeed: 20,
            maxSpeed: 35,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 10,
            angleGapMult: 10,
          },
          {
            id: 2,
            name: "Stong breeze",
            minSpeed: 35,
            maxSpeed: 55,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 15,
            angleGapMult: 15,
          },
          {
            id: 3,
            name: "Storm",
            minSpeed: 85,
            maxSpeed: 105,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 50,
            angleGapMult: 30,
          },
          {
            id: 4,
            name: "Tornado",
            minSpeed: 200,
            maxSpeed: 350,
            minAngle: 0,
            maxAngle: 360,
            speedGapMult: 1000,
            angleGapMult: 1000,
          },
        ];

        scope.presets = JSON.parse(JSON.stringify(defaultPresets));
        scope.selectedPreset = scope.presets[0];

        bngApi.engineLua("extensions.windsOfChange.retrieveStoredSettings()");

        scope.changeSetting = function () {
          updateSettings();
        };

        scope.$on("streamsUpdate", function (event, streams) {
          if (!streams.sensors) {
            return;
          }
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
          if (!windLoop) {
            return;
          }
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
                    this.distance = Math.sqrt(this.X ** 2 + this.Y ** 2);
                    this.style =
                      "width: 3px; " +
                      "height: 10px; " +
                      "background-color: white; " +
                      "position: absolute; " +
                      "left: " +
                      (this.X + 147) +
                      "px ; margin-top: " +
                      (this.Y + 50) +
                      "px ; margin-left: " +
                      (this.distance < animationSettings.radius
                        ? this.X > 0
                          ? (1 -
                              this.distance ** 2 /
                                animationSettings.radius ** 2) *
                            animationSettings.moveDistance
                          : (1 -
                              this.distance ** 2 /
                                animationSettings.radius ** 2) *
                            -animationSettings.moveDistance
                        : 0) +
                      "px ;";
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

        function updateSettings() {
          if (!document.getElementById("minSpeedInput")) {
            return;
          }
          const minSpeed = scope.selectedPreset.minSpeed;
          const maxSpeed = scope.selectedPreset.maxSpeed;
          const minAngle = scope.selectedPreset.minAngle;
          const maxAngle = scope.selectedPreset.maxAngle;
          if (minSpeed >= maxSpeed) {
            scope.selectedPreset.minSpeed = minSpeed;
            scope.selectedPreset.maxSpeed = maxSpeed;
          }
          if (minAngle >= maxAngle) {
            scope.selectedPreset.maxAngle = minAngle;
            scope.selectedPreset.minAngle = maxAngle;
          }
          if (minAngle < 0) {
            scope.selectedPreset.minAngle = 0;
          }
          if (minAngle > 360) {
            scope.selectedPreset.minAngle = 360;
          }
          if (maxAngle < 0) {
            scope.selectedPreset.maxAngle = 0;
          }
          if (maxAngle > 360) {
            scope.selectedPreset.maxAngle = 360;
          }
          let storedValues =
            scope.selectedPreset.id +
            "," +
            scope.selectedPreset.minSpeed +
            "," +
            scope.selectedPreset.maxSpeed +
            "," +
            scope.selectedPreset.minAngle +
            "," +
            scope.selectedPreset.maxAngle +
            "," +
            scope.selectedPreset.speedGapMult +
            "," +
            scope.selectedPreset.angleGapMult +
            "," +
            scope.settingsOpen;
          bngApi.engineLua(
            "extensions.windsOfChange.storeSettings(" + storedValues + ")"
          );
        }

        function startWind() {
          bngApi.engineLua(
            "extensions.windsOfChange.refreshWind(" +
              scope.selectedPreset.minAngle +
              "," +
              scope.selectedPreset.maxAngle +
              "," +
              scope.selectedPreset.minSpeed +
              "," +
              scope.selectedPreset.maxSpeed +
              ")"
          );
          windLoop = setInterval(() => {
            bngApi.engineLua(
              "extensions.windsOfChange.updateWind(" +
                scope.selectedPreset.minSpeed +
                "," +
                scope.selectedPreset.maxSpeed +
                "," +
                scope.selectedPreset.minAngle +
                "," +
                scope.selectedPreset.maxAngle +
                "," +
                scope.selectedPreset.speedGapMult +
                "," +
                scope.selectedPreset.angleGapMult +
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
                scope.selectedPreset.minAngle +
                "," +
                scope.selectedPreset.maxAngle +
                "," +
                scope.selectedPreset.minSpeed +
                "," +
                scope.selectedPreset.maxSpeed +
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

        
        scope.hideSettings = function () {
          let settings = document.getElementById("settings");
          if (!scope.settingsOpen) {
            settings.style.display = "flex";
            scope.settingsOpen = true;
          } else {
            settings.style.display = "none";
            scope.settingsOpen = false;
          }
          updateSettings();
        };

        scope.resetSettings = function () {
          scope.presets = JSON.parse(JSON.stringify(defaultPresets));
          scope.selectedPreset = scope.presets[scope.selectedPreset.id];
        };

        scope.$on("ReceiveData", function (_, data) {
          const newSpeed = data[0];
          const newDirection = data[1];
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
          if (!data) {
            return;
          }
          scope.selectedPreset = scope.presets[data[0]];
          scope.selectedPreset.minSpeed = data[1];
          scope.selectedPreset.maxSpeed = data[2];
          scope.selectedPreset.minAngle = data[3];
          scope.selectedPreset.maxAngle = data[4];
          scope.selectedPreset.speedGapMult = data[5];
          scope.selectedPreset.angleGapMult = data[6];
          scope.settingsOpen = data[7];
          if (scope.settingsOpen) {
            settings.style.display = "flex";
          }
        });
      },
    };
  },
]);
