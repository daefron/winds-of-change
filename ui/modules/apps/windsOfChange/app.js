angular.module("beamng.apps").directive("windsOfChange", [
  function () {
    return {
      templateUrl: "/ui/modules/apps/windsOfChange/app.html",
      replace: true,
      scope: true,
      restrict: "EA",
      link: function (scope, element, attrs) {
        var streamsList = ["sensors"];
        StreamsManager.add(streamsList);

        scope.$on("$destroy", function () {
          StreamsManager.remove(streamsList);
        });

        let windLoop;

        scope.values = {
          carDirection: 0,
          windDirection: 0,
          windSpeed: 0,
          direction: 0,
        };

        scope.settingsOpen = false;

        const windLines = document.getElementById("windLineHolder");

        let frame = 0;
        const animationSettings = {
          lineCount: 16,
          radius: 110,
          spawnDistance: 40,
          frameSpeed: 1,
          moveDistance: 0,
          xSpacing: 30,
        };

        scope.animationLines = makeLines(-250, 140);
        for (const line of scope.animationLines) {
          for (const dash of line) {
            dash.update();
          }
        }

        function makeLines(min, max) {
          let lineHolder = [];
          for (
            let i = min;
            i <= max;
            i += animationSettings.spawnDistance
          ) {
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
                  this.X = xPos * animationSettings.xSpacing;
                  this.Y = height;
                  this.defaultStyles =
                    "width: 3px; " +
                    "height: 10px; " +
                    "background-color: white; " +
                    "position: absolute; " +
                    "left: " +
                    (this.X + 147) +
                    "px; ";
                }

                update() {
                  const Y = this.Y + frame;
                  this.yMarginRender = "margin-top: " + (Y + 50) + "px ; ";

                  this.distance = Math.sqrt(this.X ** 2 + Y ** 2);

                  if (this.distance < animationSettings.radius) {
                    this.xMargin =
                      (1 -
                        this.distance ** 2 /
                          animationSettings.radius ** 2) *
                      animationSettings.moveDistance;
                    if (this.X < 0) {
                      this.xMargin *= -1;
                    }
                    this.xMarginRender =
                      "margin-left: " + this.xMargin + "px;";
                  } else {
                    this.xMarginRender = "";
                  }

                  if (this.distance < animationSettings.radius) {
                    this.rotation =
                      Math.atan2(
                        Y * (animationSettings.moveDistance / 300),
                        this.X + this.xMargin
                      ) *
                      (180 / Math.PI);
                    this.rotationRender =
                      "transform: rotate(" + this.rotation + "deg);";
                  } else {
                    this.rotationRender = "";
                  }

                  this.style =
                    this.defaultStyles +
                    this.yMarginRender +
                    this.xMarginRender +
                    this.rotationRender;
                }
              }
              return Array.from(lineArray, (value) => new Dash(value));
            }
          }
          return lineHolder;
        }

        const defaultPresets = [
          {
            id: 0,
            name: "Light breeze",
            minSpeed: 5,
            maxSpeed: 20,
            minAngle: 0,
            maxAngle: 360,
            speedChange: 5,
            angleChange: 5,
          },
          {
            id: 1,
            name: "Moderate breeze",
            minSpeed: 20,
            maxSpeed: 35,
            minAngle: 0,
            maxAngle: 360,
            speedChange: 10,
            angleChange: 10,
          },
          {
            id: 2,
            name: "Stong breeze",
            minSpeed: 35,
            maxSpeed: 55,
            minAngle: 0,
            maxAngle: 360,
            speedChange: 15,
            angleChange: 15,
          },
          {
            id: 3,
            name: "Storm",
            minSpeed: 85,
            maxSpeed: 105,
            minAngle: 0,
            maxAngle: 360,
            speedChange: 50,
            angleChange: 30,
          },
          {
            id: 4,
            name: "Tornado",
            minSpeed: 200,
            maxSpeed: 350,
            minAngle: 0,
            maxAngle: 360,
            speedChange: 1000,
            angleChange: 1000,
          },
        ];

        scope.presets = JSON.parse(JSON.stringify(defaultPresets));

        bngApi.engineLua("extensions.windsOfChange.retrieveStoredSettings()");

        scope.changeSetting = function () {
          updateSettings();
        };

        scope.changePreset = function () {
          scope.presets = JSON.parse(JSON.stringify(defaultPresets));
          scope.selectedPreset = scope.presets[scope.selectedPreset.id];
          updateSettings();
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
        };

        scope.$on("streamsUpdate", function (event, streams) {
          scope.values.carDirection = (
            (-streams.sensors.yaw * 360) /
            (2 * Math.PI)
          ).toFixed(2);
          if (scope.values.carDirection < 0) {
            scope.values.carDirection += 360;
          }
          scope.values.direction =
            scope.values.windDirection - scope.values.carDirection;
          if (scope.values.direction > 360) {
            scope.values.direction -= 360;
          }
          windLines.style.transform =
            "rotate(" + scope.values.direction + "deg)";
        });

        function updateSettings() {
          const minSpeed = scope.selectedPreset.minSpeed;
          const maxSpeed = scope.selectedPreset.maxSpeed;
          const minAngle = scope.selectedPreset.minAngle;
          const maxAngle = scope.selectedPreset.maxAngle;
          if (minSpeed >= maxSpeed) {
            scope.selectedPreset.minSpeed = maxSpeed;
            scope.selectedPreset.maxSpeed = minSpeed;
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
            scope.selectedPreset.speedChange +
            "," +
            scope.selectedPreset.angleChange +
            "," +
            scope.settingsOpen +
            "," +
            windLoop;
          bngApi.engineLua(
            "extensions.windsOfChange.storeSettings(" + storedValues + ")"
          );
        }

        scope.startWind = function () {
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
          if (windLoop) {
            return;
          }
          windLoop = true;
          updateSettings();
        };

        scope.endWind = function () {
          windLoop = false;
          updateSettings();
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
          if (windLoop) {
            updateSettings();
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
          }
        };

        scope.$on("ReceiveData", function (_, data) {
          scope.$applyAsync(function () {
            const newSpeed = data[0];
            const newDirection = data[1];
            scope.values.windSpeed = Number(newSpeed.toFixed(1));
            scope.values.windDirection = newDirection.toFixed(1);
            if (scope.values.windDirection < 0) {
              scope.values.windDirection = (
                scope.values.windDirection + 360
              ).toFixed(1);
            }
          });
          if (
            scope.values.windSpeed / 10 <
            animationSettings.spawnDistance / 2
          ) {
            animationSettings.frameSpeed = scope.values.windSpeed / 10;
          } else {
            animationSettings.frameSpeed = animationSettings.spawnDistance / 2;
          }
          if (scope.values.windSpeed > 80) {
            animationSettings.moveDistance = 80;
          } else if (scope.values.windSpeed < 25) {
            animationSettings.moveDistance = 25;
          } else {
            animationSettings.moveDistance = scope.values.windSpeed;
          }
          if (scope.values.windSpeed < 110) {
            animationSettings.radius = 110;
          } else if (scope.values.windSpeed > 160) {
            animationSettings.radius = 160;
          } else {
            animationSettings.radius = scope.values.windSpeed;
          }
          frame += animationSettings.frameSpeed;
          if (frame >= animationSettings.spawnDistance) {
            frame -= animationSettings.spawnDistance;
          }

          for (const line of scope.animationLines) {
            for (const dash of line) {
              dash.update();
            }
          }
        });
       
        scope.$on("RetrieveSettings", function (_, data) {
          scope.presets = JSON.parse(JSON.stringify(defaultPresets));
          scope.selectedPreset = scope.presets[data.id];
          scope.selectedPreset.minSpeed = data.minSpeed;
          scope.selectedPreset.maxSpeed = data.maxSpeed;
          scope.selectedPreset.minAngle = data.minAngle;
          scope.selectedPreset.maxAngle = data.maxAngle;
          scope.selectedPreset.speedChange = data.speedChange;
          scope.selectedPreset.angleChange = data.angleChange;
          scope.settingsOpen = data.settingsOpen;
          if (scope.settingsOpen) {
            settings.style.display = "flex";
          }
          windLoop = data.windLoop;
        });
      },
    };
  },
]);
