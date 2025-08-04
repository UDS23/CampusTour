import { avatarNarration } from "./main.js";
import { travelToNearbyStation } from "./main.js";
import { travelToSpecificStation } from "./main.js";
import { stopAvatarNarration } from "./main.js";

export function registerInputHandlers() {
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    console.log(avatarNarrationIsActive);
    // Allow stopping narration with 's' regardless of scene load
    if (key === "s" && avatarNarrationIsActive && sceneHasLoaded) {
      stopAvatarNarration(); // or your function to stop narration
      return;
    }

    // Ignore all other keypresses if the scene hasn't loaded or narration is not active
    if (!sceneHasLoaded || avatarNarrationIsActive) return;

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
