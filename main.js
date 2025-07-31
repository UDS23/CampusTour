import * as BABYLON from "@babylonjs/core";
import * as GUI from "@babylonjs/gui";
import * as LOADERS from "@babylonjs/loaders";
import { Inspector } from "@babylonjs/inspector";
import { registerInputHandlers } from "./input.js";

// Declare Variables

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
window.addEventListener("resize", () => engine.resize());

let scene;
let animationSpeedWhileIdle = 2;
let animationSpeedWhileTraveling = 15;
let crossingPointsArray = [];
window.travelSpeedIncrease = 1;
window.currentStationIndex = 0;
window.travelForward = true; // for direction of travel
window.animationInProgress = false;
let t = 0;
let automatedTourActive = false;
let returnToPlattformNarration = false;

const animationGroups = [];
const activeAnimations = [];
const stationSounds = [];
const allCurveLines = [];
const centerPoint = new BABYLON.Vector3(0, 20, 0);
const campusTaxiStartingPoint = new BABYLON.Vector3(1, 4, 2);

///// INITIALZE ALL ARRAYS //////////////////

const stations = [
  campusTaxiStartingPoint.clone(), // Station 0 Start
  new BABYLON.Vector3(4, 1, 4), // Station 1
  new BABYLON.Vector3(8, 1, 0), // Station 2
  new BABYLON.Vector3(5, 1, -3), // Station 3
  centerPoint.clone().subtract(new BABYLON.Vector3(0, 10, 0)), // Station 4 and should be 9 in the future
];

const crossingPointsNS = {
  0: [new BABYLON.Vector3(1, 2, 0), new BABYLON.Vector3(3, 3, 2)], // From Station 0 to Station 1
  1: [
    new BABYLON.Vector3(8, 1, 5), // From Station 1 to Station 2
    new BABYLON.Vector3(5, 2, 3),
    new BABYLON.Vector3(6, 2, 4),
  ],
  2: [
    new BABYLON.Vector3(8, 1, 5),
    new BABYLON.Vector3(5, 7, 3),
    new BABYLON.Vector3(1, 2, 0),
  ],
};

const crossingPointsSTC = {
  0: [new BABYLON.Vector3(1, 2, 0), new BABYLON.Vector3(3, 3, 2)], // From Station 0 to Center
  1: [
    new BABYLON.Vector3(4, 1, 5), // From Station 1 to Center
    new BABYLON.Vector3(5, 5, 3),
    new BABYLON.Vector3(6, 2, 8),
  ],
  2: [
    new BABYLON.Vector3(3, 3, 5),
    new BABYLON.Vector3(5, 4, 3),
    new BABYLON.Vector3(1, 0, 0),
  ],
};

// DEBUG Color palette to cycle through for lines and crossing points
const lineColors = [
  new BABYLON.Color3(1, 0, 0), // Red
  new BABYLON.Color3(0, 1, 0), // Green
  new BABYLON.Color3(0, 0, 1), // Blue
  new BABYLON.Color3(1, 1, 0), // Yellow
  new BABYLON.Color3(1, 0, 1), // Magenta
  new BABYLON.Color3(0, 1, 1), // Cyan
];

const travelDurationsNS = [
  // Station To Station
  // Need to be adjusted
  2, // 0 - 1
  2, // 1 - 2
  5,
  5,
  3,
  4,
];

const travelDurationsSTC = [
  // Station to Center
  // Need to be adjusted
  10, // 0 - 1
  5, // 1 - 2
  10,
  10,
  4,
  4,
];

const travelSpeedArray = {
  0: [
    { t: 0.0, value: 0.0 }, // Start
    { t: 0.25, value: 0.25 }, // 25% time → 25% distance
    { t: 0.5, value: 0.5 }, // 50% time → 50% distance
    { t: 0.75, value: 0.75 }, // 75% time → 75% distance
    { t: 1.0, value: 1.0 }, // End
  ],
  1: [
    { t: 0.0, value: 0.0 }, // Start - slow
    { t: 0.05, value: 0.001 }, // Still slow
    { t: 0.1, value: 0.005 }, // Tiny movement
    { t: 0.15, value: 0.02 }, // Starting to pick up
    { t: 0.2, value: 0.1 }, // Rapid acceleration
    { t: 0.25, value: 0.3 }, // Speed burst
    { t: 0.3, value: 0.42 }, // Slowing down
    { t: 0.35, value: 0.48 }, // Middle slowdown
    { t: 0.4, value: 0.5 }, // Peak of slowdown
    { t: 0.45, value: 0.52 }, // Still slow
    { t: 0.5, value: 0.58 }, // Starting to speed up
    { t: 0.55, value: 0.7 }, // Acceleration
    { t: 0.6, value: 0.9 }, // Speed burst again
    { t: 0.9, value: 0.999 }, // Very slow
    { t: 1.0, value: 1.0 }, // End
  ],
  2: [
    { t: 0.0, value: 0.0 }, // Start - slow
    { t: 0.05, value: 0.001 }, // Still slow
    { t: 0.1, value: 0.005 }, // Tiny movement
    { t: 0.15, value: 0.02 }, // Starting to pick up
    { t: 0.2, value: 0.1 }, // Rapid acceleration
    { t: 0.25, value: 0.3 }, // Speed burst
    { t: 0.3, value: 0.42 }, // Slowing down
    { t: 0.35, value: 0.48 }, // Middle slowdown
    { t: 0.4, value: 0.5 }, // Peak of slowdown
    { t: 0.45, value: 0.52 }, // Still slow
    { t: 0.5, value: 0.58 }, // Starting to speed up
    { t: 0.55, value: 0.7 }, // Acceleration
    { t: 0.6, value: 0.9 }, // Speed burst again
    { t: 0.9, value: 0.999 }, // Very slow
    { t: 1.0, value: 1.0 }, // End
  ],
  3: [
    { t: 0.0, value: 0.0 }, // Start - slow
    { t: 0.05, value: 0.001 }, // Still slow
    { t: 0.1, value: 0.005 }, // Tiny movement
    { t: 0.15, value: 0.02 }, // Starting to pick up
    { t: 0.2, value: 0.1 }, // Rapid acceleration
    { t: 0.25, value: 0.3 }, // Speed burst
    { t: 0.3, value: 0.42 }, // Slowing down
    { t: 0.35, value: 0.48 }, // Middle slowdown
    { t: 0.4, value: 0.5 }, // Peak of slowdown
    { t: 0.45, value: 0.52 }, // Still slow
    { t: 0.5, value: 0.58 }, // Starting to speed up
    { t: 0.55, value: 0.7 }, // Acceleration
    { t: 0.6, value: 0.9 }, // Speed burst again
    { t: 0.9, value: 0.999 }, // Very slow
    { t: 1.0, value: 1.0 }, // End
  ],
  4: [
    { t: 0.0, value: 0.0 }, // Start - slow
    { t: 0.05, value: 0.001 }, // Still slow
    { t: 0.1, value: 0.005 }, // Tiny movement
    { t: 0.15, value: 0.02 }, // Starting to pick up
    { t: 0.2, value: 0.1 }, // Rapid acceleration
    { t: 0.25, value: 0.3 }, // Speed burst
    { t: 0.3, value: 0.42 }, // Slowing down
    { t: 0.35, value: 0.48 }, // Middle slowdown
    { t: 0.4, value: 0.5 }, // Peak of slowdown
    { t: 0.45, value: 0.52 }, // Still slow
    { t: 0.5, value: 0.58 }, // Starting to speed up
    { t: 0.55, value: 0.7 }, // Acceleration
    { t: 0.6, value: 0.9 }, // Speed burst again
    { t: 0.9, value: 0.999 }, // Very slow
    { t: 1.0, value: 1.0 }, // End
  ],
};

const stationSoundPaths = [
  "/assets/AvatarNarrations/00_Intro.mp3",
  "/assets/AvatarNarrations/01_One.mp3",
  "/assets/AvatarNarrations/02_Two.mp3",
  "/assets/AvatarNarrations/03_Three.mp3",
  "/assets/AvatarNarrations/00_Intro.mp3",
  "/assets/AvatarNarrations/09_Outro.mp3",
];

//////  Create Scene Function ///////////////
const createScene = async function () {
  scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI / 3,
    Math.PI / 3,
    25,
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  /////// Event Listener and Other Stuff ///////////////

  await Promise.all([
    loadAutamtedTourBox(),
    loadAutomatedToggleCylinder(),
    loadAvatarHologram(),
    loadCampusTaxi(),
    loadSounds(),
    loadGround(),
    loadAllDebugger(),
  ]);

  console.log("Scene has been loaded");

  return scene;
};

////////////////// CREATE OBJECTS & ASSETS /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function loadGround() {
  BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
}

async function loadAutomatedToggleCylinder() {
  const toggleCylinder = BABYLON.MeshBuilder.CreateCylinder(
    "toggleCylinder",
    { diameter: 0.5, height: 1 },
    scene
  );

  toggleCylinder.position = new BABYLON.Vector3(-4, 0.5, 4);

  const redMat = new BABYLON.StandardMaterial("redMat", scene);
  redMat.diffuseColor = new BABYLON.Color3(1, 0, 0);

  const greenMat = new BABYLON.StandardMaterial("greenMat", scene);
  greenMat.diffuseColor = new BABYLON.Color3(0, 1, 0);

  toggleCylinder.material = redMat;
  toggleCylinder.actionManager = new BABYLON.ActionManager(scene);

  toggleCylinder.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      automatedTourActive = !automatedTourActive;
      toggleCylinder.material = automatedTourActive ? greenMat : redMat;
      console.log("automatedTourActive is now:", automatedTourActive);
    })
  );
}

async function loadAutamtedTourBox() {
  const startAutomatedTourBox = BABYLON.MeshBuilder.CreateBox(
    "startAutomatedTourBox",
    { size: 0.6 },
    scene
  );
  startAutomatedTourBox.position = new BABYLON.Vector3(-2.5, 0.5, 4);
  startAutomatedTourBox.material = new BABYLON.StandardMaterial(
    "startAutomatedTourMat",
    scene
  );
  startAutomatedTourBox.material.diffuseColor = new BABYLON.Color3(5, 3, 0); // Green
  startAutomatedTourBox.actionManager = new BABYLON.ActionManager(scene);
  startAutomatedTourBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      if (automatedTourActive) {
        avatarNarration();
      }
    })
  );
}

async function loadCampusTaxi() {
  const campusTaxi = await BABYLON.SceneLoader.ImportMeshAsync(
    null,
    "/assets/meshes/UFO.glb",
    null,
    scene
  );

  window.campusTaxiMesh = campusTaxi.meshes[0];
  campusTaxiMesh.position = campusTaxiStartingPoint;
  campusTaxiMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
  campusTaxiMesh.rotation.z = Math.PI / 2;
  animationGroups.push(campusTaxi.animationGroups[0]);
  // Push all animation groups into your existing array
  //animationGroups.push(...campusTaxi.animationGroups);
}

async function loadAvatarHologram() {
  const avatarHologram = await BABYLON.SceneLoader.ImportMeshAsync(
    null,
    "/assets/meshes/avatarHologram.glb",
    null,
    scene
  );

  window.avatarMesh = avatarHologram.meshes[0];
  avatarMesh.parent = campusTaxiMesh;
  avatarMesh.position = new BABYLON.Vector3(0, 1, 0);
  avatarMesh.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
  avatarMesh.setEnabled(false);
  //avatarMesh.rotation.y = Math.PI / 2;
}

async function loadSounds() {
  stationSoundPaths.forEach((path, index) => {
    const sound = new BABYLON.Sound(
      `stationNarration_${index}`,
      path,
      scene,
      null,
      { autoplay: false, loop: false }
    );
    stationSounds.push(sound);
    console.log("loaded Sounds:", stationSounds);
  });
}

//// HELPER AND CALCUALTION FUNCTIONS //////////////////////////////////////////////////////////
function catmullRom(t, p0, p1, p2, p3) {
  const t2 = t * t;
  const t3 = t2 * t;

  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function interpolateTravelSpeedCurve(t, curve) {
  if (t <= curve[0].t) return curve[0].value;
  if (t >= curve[curve.length - 1].t) return curve[curve.length - 1].value;

  for (let i = 1; i < curve.length - 2; i++) {
    const p0 = curve[i - 1];
    const p1 = curve[i];
    const p2 = curve[i + 1];
    const p3 = curve[i + 2];

    if (t <= p2.t) {
      const localT = (t - p1.t) / (p2.t - p1.t);
      return catmullRom(localT, p0.value, p1.value, p2.value, p3.value);
    }
  }

  // Fallback to linear at the end because catmullRom needs at least 3 points to function
  const last = curve.length - 1;
  const a = curve[last - 1];
  const b = curve[last];
  const localT = (t - a.t) / (b.t - a.t);
  return a.value + localT * (b.value - a.value);
}
// Binomial coefficient for Bezier Curve
function binomialCoefficient(n, i) {
  if (i === 0 || i === n) return 1;
  let result = 1;
  for (let j = 1; j <= i; j++) {
    result *= n - i + j;
    result /= j;
  }
  return result;
}

// General Bezier point calculator
function getBezierPoint(duration, crossingPoints) {
  const n = crossingPoints.length - 1;
  let point = BABYLON.Vector3.Zero();
  for (let i = 0; i <= n; i++) {
    const coef =
      binomialCoefficient(n, i) *
      Math.pow(1 - duration, n - i) *
      Math.pow(duration, i);
    point = point.add(crossingPoints[i].scale(coef));
  }
  return point;
}

function delayMyFunctionByMilliSeconds(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Easing Function for Travel Coordinates
function easeCustom(t, travelSpeedArrayForCurrentStation) {
  const interpolatedSpeedValues = interpolateTravelSpeedCurve(
    t,
    travelSpeedArrayForCurrentStation
  );
  console.log("beziervectors for calculation = " + interpolatedSpeedValues);
  return interpolatedSpeedValues;
}

export async function avatarNarration() {
  let sound = stationSounds[currentStationIndex];
  if (returnToPlattformNarration) {
    sound = stationSounds[stationSounds.length - 1]; // to load the correct sound once we return to our station
    automatedTourActive = false;
    returnToPlattformNarration = false;
  }
  if (!sound) {
    console.warn("No sound for station", currentStationIndex);
    return;
  }

  avatarMesh.setEnabled(true);
  await delayMyFunctionByMilliSeconds(300);
  sound.play();
  await new Promise((resolve) => {
    sound.onEndedObservable.add(() => {
      resolve();
    });
  });
  avatarMesh.setEnabled(false);
  await deldelayMyFunctionByMilliSecondsay(300);
  // DO STH after Narration has ended
  if (automatedTourActive && currentStationIndex < stations.length - 1) {
    // when we are at the last station we go into else to change narration and end autoamted tour
    travelForward = true;
    travelToNearbyStation();
  } else if (automatedTourActive) {
    //automatedTourActive = false;
    returnToPlattformNarration = true;
    travelToNearbyStation();
  }
}

///////////// TRAVEL LOGIC //////////////////////////////////////////////////////////////////////////////////////////////

export function travelToNearbyStation() {
  if (!animationInProgress) {
    animationInProgress = true;
    t = 0;
    let destination = 0;
    let crossingPointsBetweenStations;

    if (travelForward) {
      if (currentStationIndex === stations.length - 1) {
        // Loop from last back to first
        destination = 0;
      } else {
        destination = currentStationIndex + 1;
      }

      crossingPointsBetweenStations =
        crossingPointsNS[currentStationIndex] || [];
    } else {
      if (currentStationIndex === 0) {
        // Loop from first back to last
        destination = stations.length - 1;
      } else {
        destination = currentStationIndex - 1;
      }

      crossingPointsBetweenStations = (crossingPointsNS[destination] || [])
        .slice()
        .reverse();
    }

    crossingPointsArray = [
      campusTaxiMesh.position.clone(), // you use this in animations because you dont want the actual vector to change during animation and if it changes from an outside function we are not phased by it
      ...crossingPointsBetweenStations,
      stations[destination].clone(),
    ];

    animateAlongBezier({
      mesh: campusTaxiMesh,
      crossingPoints: crossingPointsArray,
      duration: travelDurationsNS[currentStationIndex],
      destination: destination,
    });
  }
}

export function travelToSpecificStation(stationIndexToTravelTo) {
  //), travelCTSFunction) {
  if (!animationInProgress) {
    animationInProgress = true;
    t = 0;
    const currentCrossingPointsSTC =
      crossingPointsSTC[currentStationIndex] || [];
    const currentCrossingPointsCTS = (
      crossingPointsSTC[stationIndexToTravelTo] || []
    )
      .slice()
      .reverse();

    const crossingPointsArray = [
      campusTaxiMesh.position.clone(), // start
      ...currentCrossingPointsSTC,
      centerPoint,
      ...currentCrossingPointsCTS,
      stations[stationIndexToTravelTo].clone(), // end
    ];

    animateAlongBezier({
      mesh: campusTaxiMesh,
      crossingPoints: crossingPointsArray,
      duration: travelDurationsSTC[currentStationIndex],
      destination: stationIndexToTravelTo,
    });
  }
}

function animateAlongBezier({
  mesh,
  crossingPoints,
  duration,
  destination,
  thisFunctionisCalledAfterAnimationEnds = () => {}, // It means if the caller does NOT provide an onComplete function, then onComplete will default to an empty function () => {}
}) {
  let t = 0;
  animationGroups[0].speedRatio = animationSpeedWhileTraveling; // this if for the UFO and concerns the spinning animation. We dont necessarily need that later
  // The per-frame animation function
  const animationLoop = () => {
    t += (engine.getDeltaTime() / 1000 / duration) * travelSpeedIncrease;

    if (t >= 1) {
      // animation has finished if this is true and we make sure we are at the intended position. This is good practice in case the animation goes south
      t = 1;
      const easedT = easeCustom(t, travelSpeedArray[currentStationIndex]); // this is checked before we update the stationIndex
      const newPos = getBezierPoint(easedT, crossingPoints);
      //const newPos = stations[stationIndexToTravelTo];
      mesh.position.copyFrom(newPos);

      // Cleanup: remove this animation from the array
      const index = activeAnimations.indexOf(animationLoop);
      if (index !== -1) {
        activeAnimations.splice(index, 1);
      }

      animationGroups[0].speedRatio = animationSpeedWhileIdle; // change animation speed while taxi is idle
      animationInProgress = false;
      currentStationIndex = destination;
      console.log("station Index after Travel = " + currentStationIndex);
      console.log("Animation finished!");
      console.log("Taxi position = " + campusTaxiMesh.position);
      console.log(centerPoint);

      if (
        // We go in here when we reach the Center Point
        typeof thisFunctionisCalledAfterAnimationEnds === "function" &&
        campusTaxiMesh.position.equals(centerPoint)
      ) {
        console.log(`callback activated`);
        thisFunctionisCalledAfterAnimationEnds(); // trigger travelCTS when animation has finished (t = 0);
      }

      if (automatedTourActive) {
        avatarNarration();
      }
      //} // trigger the callback

      return;
    }

    // this is where we move the Taxi
    let interpolatedSpeedValues = easeCustom(
      t,
      travelSpeedArray[currentStationIndex]
    );
    if (interpolatedSpeedValues < 0.0001) interpolatedSpeedValues = 0.0001; // to avoid an inital jerk because of positional jumps for the speed array.??
    const newPos = getBezierPoint(interpolatedSpeedValues, crossingPoints);
    mesh.position.copyFrom(newPos);
  };

  // Register this animation to be called each frame
  activeAnimations.push(animationLoop);
}

///////////////////// DEBBUGGIN ///////////////////////////////////////////////////
async function loadAllDebugger() {
  drawAllCurves(); // DEBUG
  visualizeCrossingPoints(); // DEBUG
  visualizeStationPoints(); // DEBUG
  visualizeCenterPoint(); // DEBUG
}

// DEBUG Draw all curves at startup with different colors
async function drawAllCurves() {
  for (let i = 0; i < stations.length - 1; i++) {
    const crossingPoints = [
      stations[i].clone(),
      ...(crossingPointsNS[i] || []), // spreads my nested array of points into multiple arrays with end and start point
      stations[i + 1].clone(),
    ];

    const points = [];
    for (let step = 0; step <= 1; step += 0.02) {
      points.push(getBezierPoint(step, crossingPoints));
    }

    const line = BABYLON.MeshBuilder.CreateLines(
      `curve_${i}`,
      { points },
      scene
    );
    line.color = lineColors[i % lineColors.length];
    allCurveLines.push(line);
  }
}

// DEBUG Visualize crossing points with small spheres in corresponding colors
async function visualizeCrossingPoints() {
  for (let i = 0; i < stations.length - 1; i++) {
    const color = lineColors[i % lineColors.length];
    const points = crossingPointsNS[i] || [];

    points.forEach((point, idx) => {
      const sphere = BABYLON.MeshBuilder.CreateSphere(
        `crossingPoint_${i}_${idx}`,
        { diameter: 0.2 },
        scene
      );
      sphere.position.copyFrom(point);

      const mat = new BABYLON.StandardMaterial(`mat_${i}_${idx}`, scene);
      mat.diffuseColor = color;
      sphere.material = mat;
    });
  }
}

// DEBUG Visualize Stations Points
async function visualizeStationPoints() {
  for (let i = 0; i < stations.length; i++) {
    // Create the sphere
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      "sphere" + i,
      { diameter: 1 },
      scene
    );

    // Set the position from the array
    sphere.position = stations[i];

    // Create a new material with a random color
    const mat = new BABYLON.StandardMaterial("mat" + i, scene);
    mat.diffuseColor = new BABYLON.Color3(
      Math.random(),
      Math.random(),
      Math.random()
    );
    // Assign the material to the sphere
    sphere.material = mat;
  }
}
// DEBUG
async function visualizeCenterPoint() {
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    "centerPoint",
    { diameter: 1 },
    scene
  );
  sphere.position = centerPoint;
  const blackMat = new BABYLON.StandardMaterial("blackMat", scene);
  blackMat.diffuseColor = new BABYLON.Color3(0, 0, 0); // RGB = (0, 0, 0) is black
  sphere.material = blackMat;
}

(async () => {
  scene = await createScene();
  registerInputHandlers();

  engine.runRenderLoop(() => {
    // ONCE the renderloop is called it runs indefinately until is called to stop by engine.stopRenderLoop();
    for (const anim of activeAnimations) {
      anim();
    }
    scene.render();
  });
})();

//Inspector.Show(scene, {});
// // comment to stop all animations, not really
//animationGroups.forEach((animation) => animation.start());

// Expose Animation Number and Index
// console.log("Number of animations:", animationGroups.length);
// animationGroups.forEach((group, index) => {
//   console.log(`Animation ${index}: Name = ${group.name}`);
// });
