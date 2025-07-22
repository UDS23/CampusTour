import * as BABYLON from "@babylonjs/core"; // this is wrong
import * as GUI from "@babylonjs/gui";
import * as LOADERS from "@babylonjs/loaders";
import { Inspector } from "@babylonjs/inspector";

//import oneTrack from 'public/assets/AvatarNarrations/Two.mp3';

import oneTrack from "/One.mp3";
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Create an audio engine

let scene;

//let campusTaxi = null;

const activeAnimations = [];
//const animationGroups = [];

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

  BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);

  const campusTaxi = await BABYLON.SceneLoader.ImportMeshAsync(
    null,
    "/assets/meshes/TAXI.glb",
    null,
    scene
  );

  const campusTaxiMesh = campusTaxi.meshes[0];
  campusTaxiMesh.position = new BABYLON.Vector3(1, 4, 2);
  campusTaxiMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
  campusTaxiMesh.rotation.z = Math.PI / 2;
  const animationGroups = campusTaxi.animationGroups;
  let animationSpeedWhileIdle = 2;
  let animationSpeedWhileTraveling = 15;

  // const coveIsland = await BABYLON.SceneLoader.ImportMeshAsync(
  //   null,
  //   "/assets/meshes/coveIsland.glb",
  //   null,
  //   scene
  // );

  const avatarHologram = await BABYLON.SceneLoader.ImportMeshAsync(
    null,
    "/assets/meshes/avatarHologram.glb",
    null,
    scene
  );

  const avatarMesh = avatarHologram.meshes[0];
  avatarMesh.parent = campusTaxiMesh;
  avatarMesh.position = new BABYLON.Vector3(0, 1, 0);
  avatarMesh.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
  avatarMesh.setEnabled(false);
  //avatarMesh.rotation.y = Math.PI / 2;

  // // stop all animations
  animationGroups.forEach((animation) => animation.start());

  // // Expose Animation Number and Index
  // console.log("Number of animations:", animationGroups.length);
  // animationGroups.forEach((group, index) => {
  // console.log(`Animation ${index}: Name = ${group.name}`);
  // });

  const stationSoundPaths = [
    "/assets/AvatarNarrations/Intro.mp3",
    "/assets/AvatarNarrations/One.mp3",
    "/assets/AvatarNarrations/Two.mp3",
    "/assets/AvatarNarrations/Three.mp3",
  ];

  const stationSounds = [];

  stationSoundPaths.forEach((path, index) => {
    const sound = new BABYLON.Sound(
      `stationNarration_${index}`,
      path,
      scene,
      null,
      { autoplay: false, loop: false }
    );
    stationSounds.push(sound);
  });
  console.log("loaded Sounds:", stationSounds);

  const centerPoint = new BABYLON.Vector3(0, 20, 0);

  const stations = [
    campusTaxiMesh.position.clone(), // Station 0 Start
    new BABYLON.Vector3(4, 1, 4), // Station 1
    new BABYLON.Vector3(8, 1, 0), // Station 2
    new BABYLON.Vector3(5, 1, -3), // Station 3
    centerPoint.clone().subtract(new BABYLON.Vector3(0, 10, 0)), // Station 4 and should be 9 in the future
  ];

  const crossingPointsNS = {
    0: [new BABYLON.Vector3(1, 2, 0), new BABYLON.Vector3(3, 3, 2)], // From Station 0 to Station 1
    1: [
      new BABYLON.Vector3(4, 1, 1), // From Station 1 to Station 2
      new BABYLON.Vector3(5, 2, 3),
      new BABYLON.Vector3(6, 2, 4),
    ],
    2: [
      new BABYLON.Vector3(8, 1, 1),
      new BABYLON.Vector3(5, 7, 3),
      new BABYLON.Vector3(1, 2, 0),
    ],
  };

  const crossingPointsSTC = {
    0: [new BABYLON.Vector3(1, 2, 0), new BABYLON.Vector3(3, 3, 2)], // From Station 0 to Center
    1: [
      new BABYLON.Vector3(4, 1, 1), // From Station 1 to Center
      new BABYLON.Vector3(5, 5, 3),
      new BABYLON.Vector3(6, 2, 8),
    ],
    2: [
      new BABYLON.Vector3(8, 3, 1),
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

  //console.log("travelSpeedVector =" + travelSpeedArrayToBezierVectors);
  console.log("travelSpeedVector =" + binomialCoefficient());

  let currentStationIndex = 0;
  let crossingPointsArray = [];
  let travelForward = true; // for direction of travel
  let animationInProgress = false;
  let t = 0;

  //const duration = 2; // seconds

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // DEBUG Draw all curves at startup with different colors
  const allCurveLines = [];
  function drawAllCurves() {
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
  function visualizeCrossingPoints() {
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
  function visualizeStationPoints() {
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
  function visualizeCenterPoint() {
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

  drawAllCurves(); // DEBUG
  visualizeCrossingPoints(); // DEBUG
  visualizeStationPoints(); // DEBUG
  visualizeCenterPoint(); // DEBUG

  async function avatarNarration() {
    const sound = stationSounds[currentStationIndex];
    if (!sound) {
      console.warn("No sound for station", currentStationIndex);
      return;
    }

    avatarMesh.setEnabled(true);
    await delay(300);
    sound.play();
    await new Promise((resolve) => {
      sound.onEndedObservable.add(() => {
        resolve();
      });
    });
    avatarMesh.setEnabled(false);
    await delay(300);
    // DO STH after Narration has ended
    if (automatedTourActive) {
      travelToNextStation();
    }
  }

  async function startAutomatedTour() {
    //animationInProgress = false;
    // Intro Narration here
    avatarNarration();

    // REST OF AUTOMATED TOUR SETUP LOGIC

    //travelToNextStation();
  }

  function travelToNearbyStation() {
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
        stations[currentStationIndex].clone(), // you use this in animations because you dont want the actual vector to change during animation and if it changes from an outside function we are not phased by it
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

  // function travelToPriorStation() {
  //   if (!animationInProgress && currentStationIndex > 0) {
  //     animationInProgress = true;
  //     t = 0;

  //     // Backward travel: reverse crossing points
  //     const reversedCrossingPoints = (
  //       crossingPointsNS[currentStationIndex - 1] || []
  //     )
  //       .slice()
  //       .reverse();

  //     crossingPointsArray = [
  //       stations[currentStationIndex].clone(),
  //       ...reversedCrossingPoints,
  //       stations[currentStationIndex - 1].clone(),
  //     ];

  //     animateAlongBezier({
  //       mesh: campusTaxiMesh,
  //       crossingPoints: crossingPointsArray,
  //       //duration: travelDurationsNS[currentStationIndex - 1],
  //       duration: travelDurationsNS[currentStationIndex - 1],
  //       destination: currentStationIndex - 1,
  //       //onComplete: () => {
  //       //console.log("Animation finished!");
  //       //},
  //     });
  //   }
  // }

  // function travelToSpecificStation(stationIndexToTravelTo) {
  //   if (!campusTaxiMesh.position.equals(centerPoint)) {
  //     console.log("station Index before travel = " + currentStationIndex);
  //     travelSTC(stationIndexToTravelTo, () => {
  //       travelCTS(stationIndexToTravelTo); // This is my callback that gets called OnComplete in the code
  //     });
  //   }
  // }

  function travelToSpecificStation(stationIndexToTravelTo) {
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
        stations[currentStationIndex].clone(), // start
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

  // function travelCTS(stationIndexToTravelTo) {
  //   console.log("station Index at Center = " + currentStationIndex);
  //   if (!animationInProgress) {
  //     animationInProgress = true;
  //     t = 0;

  //     const reversedCrossingPointsSTC = (
  //       crossingPointsSTC[stationIndexToTravelTo] || []
  //     )
  //       .slice()
  //       .reverse();

  //     crossingPointsArray = [
  //       centerPoint,
  //       ...reversedCrossingPointsSTC,
  //       stations[stationIndexToTravelTo].clone(),
  //     ];

  //     animateAlongBezier({
  //       mesh: campusTaxiMesh,
  //       crossingPoints: crossingPointsArray,
  //       duration: travelDurationsSTC[stationIndexToTravelTo],
  //       destination: stationIndexToTravelTo,
  //     });
  //   }
  // }

  function animateAlongBezier({
    mesh,
    crossingPoints,
    duration,
    destination,
    thisFunctionisCalledAfterAnimationEnds = () => {}, // It means if the caller does NOT provide an onComplete function, then onComplete will default to an empty function () => {}
  }) {
    let t = 0;
    animationGroups[0].speedRatio = animationSpeedWhileTraveling;
    // The per-frame animation function
    const animationLoop = () => {
      t += engine.getDeltaTime() / 1000 / duration;

      if (t >= 1) {
        // animation has finished if this is true and we make sure we are at the intended position. This is good practice in case the animation goes south
        t = 1;
        const easedT = easeCustom(t, travelSpeedArray[currentStationIndex]); // this is checked before we update the stationIndex
        const newPos = getBezierPoint(easedT, crossingPoints);
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

      //const newPos = getBezierPoint(t, crossingPoints); // this is where we move the Taxi
      const interpolatedSpeedValues = easeCustom(
        t,
        travelSpeedArray[currentStationIndex]
      );
      const newPos = getBezierPoint(interpolatedSpeedValues, crossingPoints);
      mesh.position.copyFrom(newPos);
    };

    // Register this animation to be called each frame
    activeAnimations.push(animationLoop);
  }

  function easeCustom(t, travelSpeedArrayForCurrentStation) {
    const interpolatedSpeedValues = interpolateTravelSpeedCurve(
      t,
      travelSpeedArrayForCurrentStation
    );
    console.log("beziervectors for calculation = " + interpolatedSpeedValues);
    return interpolatedSpeedValues;
  }

  let automatedTourActive = false;

  // Create Toggle cylinder for Automated Tour
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

  // Create the "Next Station" box
  const nextBox = BABYLON.MeshBuilder.CreateBox("nextBox", { size: 1 }, scene);
  nextBox.position = new BABYLON.Vector3(1, 0.5, 4);
  nextBox.material = new BABYLON.StandardMaterial("nextMat", scene);
  nextBox.material.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green

  nextBox.actionManager = new BABYLON.ActionManager(scene);
  nextBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      if (!automatedTourActive) {
        travelToNextStation();
      }
    })
  );

  // Create the "Previous Station" box
  const prevBox = BABYLON.MeshBuilder.CreateBox("prevBox", { size: 1 }, scene);
  prevBox.position = new BABYLON.Vector3(-1, 0.5, 4);
  prevBox.material = new BABYLON.StandardMaterial("prevMat", scene);
  prevBox.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red

  prevBox.actionManager = new BABYLON.ActionManager(scene);
  prevBox.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
      if (!automatedTourActive) {
        travelToPriorStation();
      }
    })
  );

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
        startAutomatedTour();
      }
    })
  );

  window.addEventListener("keydown", (event) => {
    // maybe make a switch statment here?
    // this is inside the create function so it has access to the travel Functions
    const key = event.key.toLowerCase();

    if (key === "q") {
      travelForward = true;
      travelToNearbyStation();
    } else if (key === "e") {
      travelForward = false;
      travelToNearbyStation();
    } else if (key === "s" && !animationInProgress) {
      avatarNarration();
    } else if (/^[0-9]$/.test(key) && parseInt(key) !== currentStationIndex) {
      travelToSpecificStation(parseInt(key)); // Optional: call your function with the key
    }
  });
  return scene;
}; // this is the end of createScene() Function

window.addEventListener("resize", () => engine.resize());

(async () => {
  scene = await createScene();
})();

engine.runRenderLoop(() => {
  if (scene) {
    for (const anim of activeAnimations) {
      anim();
    }

    scene.render();
  }
});

Inspector.Show(scene, {});
