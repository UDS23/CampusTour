import { avatarNarration } from "./main.js";
import { travelToNearbyStation } from "./main.js";
import { travelToSpecificStation } from "./main.js";

export function registerInputHandlers() {
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    switch (key) {
      case "q":
        travelForward = true;
        travelToNearbyStation();
        break;
      case "e":
        travelForward = false;
        travelToNearbyStation();
        break;
      case "s":
        if (!animationInProgress) avatarNarration();
        break;
      case "w":
        travelSpeedIncrease *= 2;
        break;
      default:
        if (/^[0-9]$/.test(key) && parseInt(key) !== currentStationIndex) {
          travelToSpecificStation(parseInt(key));
        }
    }
  });
}
