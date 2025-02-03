angular.module("beamng.apps").directive("windsofchange", [
  function () {
    return {
      template: '<div class="bngApp">' + "<p>hi</p>" + "</div>",
      replace: true,

      link: function () {
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
        }
        const wind = new Wind();
        scope.$on("streamsUpdate", function (event, streams) {
          console.log("TEST");
          wind.changeDirection();
          wind.changeSpeed();
          let radians = Math.PI / 180;
          let xcoeff = Math.sin(wind.direction.value * radians);
          let ycoeff = Math.cos(wind.direction.value * radians);
          bngApi.queueAllObjectLua(
            "obj:setWind(" +
              xcoeff * wind.speed.value +
              "," +
              ycoeff * wind.speed.value +
              ",0)"
          );
        });
      },
    };
  },
]);
