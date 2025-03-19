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

        // object that holds current animation setting values
        const animationSettings = {
          lineCount: 10, // must be even number
          radius: 110,
          spawnDistance: 40,
          frameSpeed: 1,
          moveDistance: 0,
          xSpacing: 40,
          frame: 0,
        };

        // array of lines for wind animation
        scope.animationLines = makeLines(-250, 140);
        // moves the lines one frame to make them visible
        for (const line of scope.animationLines) {
          for (const dash of line) {
            dash.update(
              animationSettings.frame,
              animationSettings.moveDistance,
              animationSettings.moveDistance / (animationSettings.radius * 2.5),
              animationSettings.radius ** 2,
              1 / animationSettings.radius ** 2
            );
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
          let carDirection = -streams.sensors.yaw / (Math.PI / 180);

          // keeps within degree angle range
          carDirection %= 360;

          // sets animation direction as difference between wind and car angle
          const direction = scope.values.windDirection - carDirection;

          // spins animation lines
          animationContainer.style.transform = "rotate(" + direction + "deg)";
        });

        // used any time settings need to be saved to Lua
        function storeSettings() {
          // cache for performance
          const preset = scope.selectedPreset;

          // extra clamps for settings on top of html range
          preset.minAngle = Math.max(Math.min(preset.minAngle, 360), 0);
          preset.maxAngle = Math.max(Math.min(preset.maxAngle, 360), 0);

          let storedValues = [
            preset.id,
            preset.minSpeed,
            preset.maxSpeed,
            preset.minAngle,
            preset.maxAngle,
            preset.speedChange,
            preset.angleChange,
          ];
          let invalid = false;
          storedValues.forEach((value) => {
            if (isNaN(value) || value === null) {
              invalid = true;
            }
          });
          if (invalid) {
            return;
          }
          storedValues.push(
            scope.settingsOpen,
            windLoop,
            scope.verticalEnabled,
            scope.groundCoverEnabled,
            scope.treesEnabled,
            scope.minimized
          );
          bngApi.engineLua(
            "extensions.windsOfChange.storeSettings(" +
              storedValues.join(",") +
              ")"
          );
        }

        // used when user clicks start button
        scope.startWind = function () {
          // gives the wind a random position
          const preset = scope.selectedPreset;
          const presetValues = [
            preset.minAngle,
            preset.maxAngle,
            preset.minSpeed,
            preset.maxSpeed,
          ].join(",");
          bngApi.engineLua(
            "extensions.windsOfChange.refreshWind(" + presetValues + ")"
          );

          // tells Lua to process and send wind data
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
          const preset = scope.presets[scope.selectedPreset.id];
          scope.selectedPreset = preset;

          storeSettings();

          // updates wind values as may now be out of range
          const presetValues = [
            preset.minAngle,
            preset.maxAngle,
            preset.minSpeed,
            preset.maxSpeed,
          ].join(",");
          bngApi.engineLua(
            "extensions.windsOfChange.refreshWind(" + presetValues + ")"
          );
        };

        // used when user clicks minimize/maximize button
        scope.toggleSize = function () {
          scope.minimized = !scope.minimized;
          toggleSize();
          storeSettings();
        };

        function toggleSize() {
          if (scope.minimized) {
            maximizedContainer.style.display = "none";
            minimizedContainer.style.display = "flex";
            windRoot.style.height = "auto";
          } else {
            minimizedContainer.style.display = "none";
            maximizedContainer.style.display = "flex";
            windRoot.style.height = "100%";
          }
        }

        // used when user clicks settings button
        scope.hideSettings = function () {
          // changes visibility state of settings modal
          if (!scope.settingsOpen) {
            settings.style.display = "flex";
            scope.settingsOpen = true;
          } else {
            settings.style.display = "none";
            scope.settingsOpen = false;
          }

          storeSettings();
        };

        // used when user clicks reset settings button
        scope.resetSettings = function () {
          // sets selectedPreset to default values of current preset
          scope.presets = cloneObject(defaultPresets);
          const preset = scope.presets[scope.selectedPreset.id];
          scope.selectedPreset = preset;

          storeSettings();

          // updates wind values if active
          if (windLoop) {
            const presetValues = [
              preset.minAngle,
              preset.maxAngle,
              preset.minSpeed,
              preset.maxSpeed,
            ].join(",");
            bngApi.engineLua(
              "extensions.windsOfChange.refreshWind(" + presetValues + ")"
            );
          }
        };

        // creates the lines for the wind animation
        function makeLines(min, max) {
          // cache for performance
          const { xSpacing, lineCount, spawnDistance } = animationSettings;
          const radiansToDegrees = 180 / Math.PI;

          let lineHolder = [];
          for (let i = min; i <= max; i += spawnDistance) {
            lineHolder.push(lineMaker(i));
          }
          function lineMaker(height) {
            const lineArray = [];

            // creates symmetrical line positions
            for (let i = lineCount / 2; i >= -lineCount / 2; i--) {
              lineArray.push(-(i - 0.9999)); // -0.9999 to offset from 0
            }
            for (let i = 1; i <= lineCount / 2; i++) {
              lineArray.push(i - 0.9999); // -0.9999 to offset from 0
            }
            class Dash {
              constructor(xPos) {
                this.X = xPos * xSpacing;
                this.Y = height;
                this.left = "left: " + (this.X + 147) + "px; ";
              }

              update(
                frame,
                moveDistance,
                moveDistanceDivided,
                radiusSquared,
                invRadiusSquared
              ) {
                const X = this.X;
                const Y = this.Y + frame;
                const distance = X ** 2 + Y ** 2;
                const styleArray = [this.left, "margin-top: ", Y + 50, "px;"];

                if (distance < radiusSquared) {
                  let xMargin =
                    (1 - distance * invRadiusSquared) * moveDistance;
                  if (X < 0) {
                    xMargin = -xMargin;
                  }
                  const rotation =
                    Math.atan2(Y * moveDistanceDivided, X + xMargin) *
                    radiansToDegrees;
                  styleArray.push(
                    "margin-left:",
                    xMargin,
                    "px; transform:rotate(",
                    rotation,
                    "deg);"
                  );
                }
                this.style = styleArray.join("");
              }
            }
            return lineArray.map((value) => new Dash(value));
          }
          return lineHolder;
        }

        // used when loop active and Lua returns wind data
        scope.$on("ReceiveData", function (_, data) {
          scope.$applyAsync(function () {
            // sets values to received data and fixes decimal for display
            scope.values.windSpeed = data[0].toFixed(1);
            scope.values.windDirection = data[1].toFixed(1);

            // changes animation speed based on wind speed and dash gap
            const newFrameSpeed = scope.values.windSpeed / 10;
            const maxFrameSpeed = animationSettings.spawnDistance / 2;
            if (newFrameSpeed < maxFrameSpeed) {
              animationSettings.frameSpeed = newFrameSpeed;
            } else {
              animationSettings.frameSpeed = maxFrameSpeed;
            }

            // changes how far dashes move away from cursor based on wind speed
            if (scope.values.windSpeed > 80) {
              animationSettings.moveDistance = 80;
            } else {
              animationSettings.moveDistance = scope.values.windSpeed;
            }

            // changes how big the animation radius is based on wind speed
            if (scope.values.windSpeed < 110) {
              animationSettings.radius = 110;
            } else if (scope.values.windSpeed > 160) {
              animationSettings.radius = 160;
            } else {
              animationSettings.radius = scope.values.windSpeed;
            }

            // increments frame number by frameSpeed
            animationSettings.frame += animationSettings.frameSpeed;

            // resets frame back to relative original position
            if (animationSettings.frame > animationSettings.spawnDistance) {
              animationSettings.frame -= animationSettings.spawnDistance;
            }

            // cache values for performance
            const currentFrame = animationSettings.frame;
            const currentDistance = animationSettings.moveDistance;
            const currentDistanceDivided =
              currentDistance / (animationSettings.radius * 2.5);
            const radiusSquared = animationSettings.radius ** 2;
            const invRadiusSquared = 1 / radiusSquared;

            // updates position of all animation dashes
            for (const line of scope.animationLines) {
              for (const dash of line) {
                dash.update(
                  currentFrame,
                  currentDistance,
                  currentDistanceDivided,
                  radiusSquared,
                  invRadiusSquared
                );
              }
            }
          });
        });

        // used when Lua returns settings data
        scope.$on("RetrieveSettings", function (_, data) {
          // sets all settings to receieved settings
          scope.presets = cloneObject(defaultPresets);
          scope.selectedPreset = scope.presets[data.id];
          scope.selectedPreset.minSpeed = data.minSpeed;
          scope.selectedPreset.maxSpeed = data.maxSpeed;
          scope.selectedPreset.minAngle = data.minAngle;
          scope.selectedPreset.maxAngle = data.maxAngle;
          scope.selectedPreset.speedChange = data.speedChange;
          scope.selectedPreset.angleChange = data.angleChange;
          scope.settingsOpen = data.settingsOpen;
          windLoop = data.windLoop;
          scope.verticalEnabled = data.verticalEnabled;
          scope.groundCoverEnabled = data.groundCoverEnabled;
          scope.treesEnabled = data.treesEnabled;
          scope.minimized = data.minimized;
          // keeps settings open if was open
          if (scope.settingsOpen) {
            settings.style.display = "flex";
          }
          // minimizes app if was minimized
          if (scope.minimized) {
            toggleSize();
          }
        });
      },
    };
  },
]);
