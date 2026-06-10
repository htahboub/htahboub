(function () {
  "use strict";

  function toggleEggs(showMap) {
    var howard = document.getElementById("howard");
    var gaster = document.getElementById("gaster");
    if (howard) howard.classList.toggle("hidden");
    if (gaster) gaster.classList.toggle("hidden");
    if (showMap) {
      var map = document.getElementById("mapmyvisitors-widget");
      if (map) map.style.display = "block";
    }
  }

  function revealEggs() {
    var gaster = document.getElementById("gaster");
    if (!gaster || gaster.classList.contains("hidden")) {
      toggleEggs(false);
    }
  }

  function hideMapSoon() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      var map = document.getElementById("mapmyvisitors-widget");
      attempts += 1;
      if (map) {
        map.style.display = "none";
        window.clearInterval(timer);
      } else if (attempts > 20) {
        window.clearInterval(timer);
      }
    }, 250);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pattern = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    var current = 0;
    var me = document.getElementById("me");

    document.addEventListener("keydown", function (event) {
      if (pattern.indexOf(event.key) >= 0 && event.key === pattern[current]) {
        current += 1;
        if (pattern.length === current) {
          current = 0;
          toggleEggs(true);
        }
      } else {
        current = 0;
      }
    }, false);

    if (me) {
      me.addEventListener("click", function (event) {
        event.preventDefault();
        toggleEggs(false);
      });

      if (Math.floor(Math.random() * 1000) < 2) {
        me.src = "assets/img/little.jpeg";
      } else if (Math.floor(Math.random() * 100) < 5) {
        me.src = "assets/img/bike.jpg";
      } else if (Math.floor(Math.random() * 200) < 1) {
        me.src = "assets/img/camcorder.jpeg";
      }
    }

    window.setTimeout(revealEggs, 36e5);

    if (["#dance", "#party", "#secret", "#s"].indexOf(window.location.hash) !== -1) {
      revealEggs();
    }

    hideMapSoon();
  });
})();
