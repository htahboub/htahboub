(function () {
  "use strict";

  function toggleEggs(showMap) {
    var howard = document.getElementById("howard");
    var gaster = document.getElementById("gaster");
    if (howard) howard.classList.toggle("hidden");
    if (gaster) gaster.classList.toggle("hidden");
    if (showMap) {
      var map = document.getElementById("mapmyvisitors-widget");
      if (map) map.classList.add("map-visible");
    }
  }

  function revealEggs() {
    var gaster = document.getElementById("gaster");
    if (!gaster || gaster.classList.contains("hidden")) {
      toggleEggs(false);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // var eggDelayMs = 24 * 60 * 60 * 1000;
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

    }

    // window.setTimeout(revealEggs, eggDelayMs);

    if (["#dance", "#party", "#secret", "#s"].indexOf(window.location.hash) !== -1) {
      revealEggs();
    }
  });
})();
