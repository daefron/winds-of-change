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

        // object of current wind values
        scope.values = {
          carDirection: 0,
          windDirection: 0,
          windSpeed: 0,
          direction: 0,
        };

        const windLines = document.getElementById("windLineHolder");

        // object that holds current animation setting values
        const animationSettings = {
          lineCount: 16,
          radius: 110,
          spawnDistance: 40,
          frameSpeed: 1,
          moveDistance: 0,
          xSpacing: 30,
          frame: 0
        };

        // array of lines for wind animation
        scope.animationLines = makeLines(-250, 140);

        // moves the lines one frame to make them visible
        for (const line of scope.animationLines) {
          for (const dash of line) {
            dash.update();
          }
        }

        // default values for presets
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

        // object that holds all preset values
        scope.presets = cloneObject(defaultPresets);

        // helper function that changes to and from JSON to not affect original object
        function cloneObject(object) {
          return JSON.parse(JSON.stringify(object));
        }

        // initial check to see if any stored settings
        bngApi.engineLua("extensions.windsOfChange.retrieveStoredSettings()");

        // updates angle of animation based on player vehicle positioning
        scope.$on("streamsUpdate", function (event, streams) {
          // converts radians into degrees
          let carDirection = streams.sensors.yaw / (Math.PI / 180);

          // keeps within degree angle range
          carDirection %= 360;

          // sets animation direction as difference between wind and car angle
          const direction = scope.values.windDirection - carDirection;

          // spins animation lines
          windLines.style.transform = "rotate(" + direction + "deg)";
        });

        // used any time settings need to be saved to Lua
        function storeSettings() {
          // extra clamps for settings on top of html range
          scope.selectedPreset.minAngle = Math.max(
            Math.min(scope.selectedPreset.minAngle, 360),
            0
          );
          scope.selectedPreset.maxAngle = Math.max(
            Math.min(scope.selectedPreset.maxAngle, 360),
            0
          );

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
            windLoop +
            "," +
            scope.verticalEnabled;
          bngApi.engineLua(
            "extensions.windsOfChange.storeSettings(" + storedValues + ")"
          );
        }

        // used when user clicks start button
        scope.startWind = function () {
          // gives the wind a random position
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

          // tells the Lua to process and send wind data
          windLoop = true;
          storeSettings();
        };

        // used when user clicks stop button
        scope.endWind = function () {
          windLoop = false;
          storeSettings();
          bngApi.engineLua("extensions.windsOfChange.stopWind()");
        };

        // used when user changes any setting
        scope.changeSetting = function () {
          storeSettings();
        };

        // used when user changes the selected preset
        scope.changePreset = function () {
          // sets selectedPreset to default values of new preset
          scope.presets = cloneObject(defaultPresets);
          scope.selectedPreset = scope.presets[scope.selectedPreset.id];

          storeSettings();

          // updates wind values as may now be out of range
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

        // used when user clicks settings cog button
        scope.hideSettings = function () {
          // changes visibility state of settings modal
          if (!scope.settingsOpen) {
            document.getElementById("settings").style.display = "flex";
            scope.settingsOpen = true;
          } else {
            document.getElementById("settings").style.display = "none";
            scope.settingsOpen = false;
          }

          storeSettings();
        };

        // used when user clicks reset settings button
        scope.resetSettings = function () {
          // sets selectedPreset to default values of current preset
          scope.presets = cloneObject(defaultPresets);
          scope.selectedPreset = scope.presets[scope.selectedPreset.id];

          storeSettings();

          // updates wind values if active
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
          }
        };

        // creates the lines for the wind animation
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
                  const Y = this.Y + animationSettings.frame;
                  this.yMarginRender = "margin-top: " + (Y + 50) + "px ; ";

                  this.distance = Math.sqrt(this.X ** 2 + Y ** 2);

                  if (this.distance < animationSettings.radius) {
                    this.xMargin =
                      (1 - this.distance ** 2 / animationSettings.radius ** 2) *
                      animationSettings.moveDistance;
                    if (this.X < 0) {
                      this.xMargin *= -1;
                    }
                    this.xMarginRender = "margin-left: " + this.xMargin + "px;";
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

        // used when loop active and Lua returns wind data
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
          animationSettings.frame += animationSettings.frameSpeed;
          if (animationSettings.frame >= animationSettings.spawnDistance) {
            animationSettings.frame -= animationSettings.spawnDistance;
          }

          for (const line of scope.animationLines) {
            for (const dash of line) {
              dash.update();
            }
          }
        });

        // used when Lua returns settings data
        scope.$on("RetrieveSettings", function (_, data) {
          scope.presets = cloneObject(defaultPresets);
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
          scope.verticalEnabled = data.verticalEnabled;
        });
      },
    };
  },
]);
