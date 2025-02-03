angular.module("beamng.apps").directive("windsofchange", [
  function () {
    class Wind {
      constructor() {
        this.direction = {
          angle: randomValue(360),
          change: 0,
          gap: 0,
        };
        this.speed = {
          speed: randomValue(40),
          change: 0,
          gap: 0,
        };
        function randomValue(max) {
          return max * Math.random();
        }
      }

      changeDirection() {
        let gapDiff = (Math.random() - 0.5) / 100;
        let newGap = gapDiff + this.direction.gap;
        let newChange = this.direction.change + newGap;
        if (newChange > 0.1) {
          newChange = 0.1;
          newGap *= 0.9;
        }
        if (newChange < -0.1) {
          newChange = -0.1;
          newGap *= 0.9;
        }
        let newAngle = this.direction.angle + newChange;
        if (newAngle > 360) {
          newAngle = newAngle - 360;
        }
        if (newAngle < 0) {
          newAngle = 360 - newAngle;
        }
        let radians = Math.PI / 180;
        this.xCoeff = Math.sin(newAngle * radians);
        this.yCoeff = Math.cos(newAngle * radians);
        this.direction.gap = newGap;
        this.direction.change = newChange;
        this.direction.angle = newAngle;
        setWindAngle(newAngle);
      }

      changeSpeed() {
        let gapDiff = (Math.random() - 0.5) / 1000;
        let newGap = gapDiff + this.speed.gap;
        let newChange = this.speed.change + newGap;
        if (newChange > 0.05) {
          newChange = 0.05;
          newGap *= 0.9;
        }
        if (newChange < -0.05) {
          newChange = -0.05;
          newGap *= 0.9;
        }
        let newSpeed = this.speed.speed + newChange;
        if (newSpeed > 40) {
          newSpeed = 40;
        }
        if (newSpeed < 0) {
          newSpeed = 0;
        }
        this.speed.gap = newGap;
        this.speed.change = newChange;
        this.speed.speed = newSpeed;
        setWindSpeed(newSpeed);
      }

      intervals() {
        setInterval(() => {
          this.changeDirection();
          this.changeSpeed();
        }, 10);
      }
    }
    const wind = new Wind();
    return {
      template:
        '<div class="bngApp">' +
        '<object style="width:100%;" type="image/svg+xml" data="/ui/modules/apps/Winds/winds.svg"></object>' +
        '<md-slider flex min=0 max=210 ng-model="wind.mag" aria-label="_" style="padding: 0 10px"></md-slider>' +
        "</div>",

      replace: true,

      controller: [
        "$scope",
        function ($scope) {
          $scope.wind = {
            xCoeff: 0,
            yCoeff: 1,
            mag: 0,
          };

          // fix this:
          // bngApi.systemLua('objectBroadcast"obj:getWindSpeed()"', function (val) {
          //   $scope.$evalAsync(function () {
          //     $scope.wind.mag = val
          //   })
          // })

          $scope.$watch(
            "wind",
            function (newVal, oldVal) {
              bngApi.queueAllObjectLua(
                "obj:setWind(" +
                  wind.xCoeff * wind.speed.speed +
                  "," +
                  wind.yCoeff * wind.speed.speed +
                  ",0)"
              );
            },
            true
          );
        },
      ],

      link: function (scope, element, attrs) {
        var streamsList = ["sensors"];
        StreamsManager.add(streamsList);
        scope.$on("$destroy", function () {
          StreamsManager.remove(streamsList);
        });

        var obj = angular.element(element[0].children[0]);

        obj.on("load", function () {
          var svg = angular.element(obj[0].contentDocument),
            arrow = svg[0].getElementById("yaw-arrow"),
            handle = angular.element(svg[0].getElementById("drag-handle")),
            txt = svg[0].getElementById("handle-text"),
            windVal = svg[0].getElementById("wind-speed"),
            txtElem = angular.element(txt),
            bbox = svg[0].getElementById("circle-slider").getBBox(),
            rotateOrigin = {
              x: bbox.x + bbox.width / 2,
              y: bbox.y + bbox.height / 2,
              str:
                " " +
                (bbox.x + bbox.width / 2) +
                " " +
                (bbox.y + bbox.height / 2),
            },
            yawDegrees = 0,
            dragging = false,
            auxPt = svg[0].rootElement.createSVGPoint(), // auxiliary svg point to get transform matrix between window and SVG element
            groupTransform = svg[0]
              .getElementById("layer1")
              .getScreenCTM()
              .inverse()
              .multiply(
                svg[0].rootElement.getScreenCTM()
              ) /*svg[0].rootElement.getTransformToElement(svg[0].getElementById('layer1'))*/, //removed in chrome 48
            posInGroup = function (event) {
              // First convert window coordinates to SVG coordinates by taking the root element's transform matrix
              // This should not be cached because it will change when the app is moved and/or resized.
              svgTransform = svg[0].rootElement.getScreenCTM().inverse();
              auxPt.x = event.x;
              auxPt.y = event.y;

              // Secondly, apply the transformation for the group's local coordinates.
              return auxPt
                .matrixTransform(svgTransform)
                .matrixTransform(groupTransform);
            };

          scope.$watch("wind.mag", function (newVal, oldVal) {
            windVal.innerHTML = UiUnits.buildString("speed", newVal, 0);
          });

          scope.$on("SettingsChanged", function (event, data) {
            windVal.innerHTML = UiUnits.buildString("speed", scope.wind.mag, 0);
          });

          // The arrow points to the vehicle's direction. That's a read-only property taken directly
          // from the sensors stream.
          scope.$on("streamsUpdate", function (event, streams) {
            if (!streams.sensors) {
              return;
            }

            yawDegrees = (-streams.sensors.yaw * 180) / Math.PI;
            arrow.setAttribute(
              "transform",
              "rotate(" + yawDegrees + rotateOrigin.str + ")"
            );
          });

          scope.$on("VehicleReset", function (event, data) {
            //Manually triggering $watch, so wind gets restored on VehicleReset.
            var m = scope.wind.mag;
            scope.wind.mag = 0;
            scope.$digest();
            scope.wind.mag = m;
            scope.$digest();
          });

          // SVG elements don't support drag events - fake it!
          // just remember to clean up listeners afterwards. - angular should take care of this..
          handle.on("mousedown", function (event) {
            dragging = true;
          });

          svg.on("mousemove", function (event) {
            if (dragging) {
              var p = posInGroup(event),
                windDirection =
                  Math.atan2(p.y - rotateOrigin.y, p.x - rotateOrigin.x) +
                  Math.PI / 2,
                theta = (windDirection * 180) / Math.PI;

              // phase difference! 0 degrees = north winds
              scope.wind.yCoeff = Math.cos(windDirection);
              scope.wind.xCoeff = Math.sin(windDirection);

              handle.attr(
                "transform",
                "rotate(" + theta + rotateOrigin.str + ")"
              );
              if (theta < 0) theta += 360;

              txtElem.attr(
                "transform",
                "rotate(" +
                  theta * -1 +
                  " " +
                  txtElem[0].getAttribute("x") +
                  "," +
                  txtElem[0].getAttribute("y") +
                  ")"
              );
              txt.innerHTML = theta.toFixed(0);
              scope.$digest();
            }
          });

          svg.on("mouseup", function () {
            dragging = false;
          });
        });
      },
    };
  },
]);
