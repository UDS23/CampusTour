import * as BABYLON from "@babylonjs/core"; // this is wrong
import * as GUI from "@babylonjs/gui";
import * as LOADERS from "@babylonjs/loaders";

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
    Math.PI / 2,
    Math.PI / 3,
    12,
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
    "/assets/meshes/UFO.glb",
    null,
    scene
  );

  const campusTaxiMesh = campusTaxi.meshes[0];
  campusTaxiMesh.position = new BABYLON.Vector3(1, 4, 2);
  campusTaxiMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
  const animationGroups = campusTaxi.animationGroups;
  let animationSpeedWhileIdle = 2;
  let animationSpeedWhileTraveling = 15;

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
  //animationGroups.forEach(animation => animation.stop());

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

  const stations = [
    campusTaxiMesh.position.clone(), // Station 0 Start
    new BABYLON.Vector3(4, 1, 4), // Station 1
    new BABYLON.Vector3(8, 1, 0), // Station 2
    new BABYLON.Vector3(5, 1, -3), // Station 3
  ];

  const stationCrossingPoints = {
    0: [new BABYLON.Vector3(1, 2, 0), new BABYLON.Vector3(3, 3, 2)],
    1: [
      new BABYLON.Vector3(4, 1, 1),
      new BABYLON.Vector3(5, 2, 3),
      new BABYLON.Vector3(6, 2, 4),
    ],
    2: [
      new BABYLON.Vector3(8, 1, 1),
      new BABYLON.Vector3(5, 7, 3),
      new BABYLON.Vector3(1, 2, 0),
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

  const travelDurations = [
    // Need to be adjusted
    1, // 0 - 1
    2, // 1 - 2
    1,
    2,
    3,
    4,
  ];

  let currentStationIndex = 0;
  let currentControlPoints = [];

  let animationInProgress = false;
  let t = 0;

  //const duration = 2; // seconds

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
  function getBezierPoint(t, controlPoints) {
    const n = controlPoints.length - 1;
    let point = BABYLON.Vector3.Zero();
    for (let i = 0; i <= n; i++) {
      const coef =
        binomialCoefficient(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i);
      point = point.add(controlPoints[i].scale(coef));
    }
    return point;
  }

  // DEBUG Draw all curves at startup with different colors
  const allCurveLines = [];
  function drawAllCurves() {
    for (let i = 0; i < stations.length - 1; i++) {
      const controlPoints = [
        stations[i].clone(),
        ...(stationCrossingPoints[i] || []), // spreads my nested array of points into multiple arrays with end and start point
        stations[i + 1].clone(),
      ];

      const points = [];
      for (let step = 0; step <= 1; step += 0.02) {
        points.push(getBezierPoint(step, controlPoints));
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
      const points = stationCrossingPoints[i] || [];

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

  function travelToNextStation() {
    if (!animationInProgress && currentStationIndex < stations.length - 1) {
      animationInProgress = true;
      t = 0;

      // Forward travel: crossing points as is
      currentControlPoints = [
        stations[currentStationIndex].clone(),
        ...(stationCrossingPoints[currentStationIndex] || []),
        stations[currentStationIndex + 1].clone(),
      ];

      animateAlongBezier({
        mesh: campusTaxiMesh,
        controlPoints: currentControlPoints,
        duration: travelDurations[currentStationIndex],
        currentStationIndexModifier: 1,
        //onComplete: () => {
        // animationInProgress = false;
        // currentStationIndex++;
        // if (automatedTourActive){
        //   avatarNarration();
        // }
        // },
      });
    }
  }

  function travelToPriorStation() {
    if (!animationInProgress && currentStationIndex > 0) {
      animationInProgress = true;
      t = 0;

      // Backward travel: reverse crossing points
      const reversedCrossingPoints = (
        stationCrossingPoints[currentStationIndex - 1] || []
      )
        .slice()
        .reverse();

      currentControlPoints = [
        stations[currentStationIndex].clone(),
        ...reversedCrossingPoints,
        stations[currentStationIndex - 1].clone(),
      ];

      animateAlongBezier({
        mesh: campusTaxiMesh,
        controlPoints: currentControlPoints,
        duration: travelDurations[currentStationIndex - 1],
        currentStationIndexModifier: -1,
        //onComplete: () => {
        //console.log("Animation finished!");
        //},
      });
    }
  }

  function animateAlongBezier({
    mesh,
    controlPoints,
    duration,
    currentStationIndexModifier,
    //onComplete = () => {},
  }) {
    let t = 0;
    animationGroups[0].speedRatio = animationSpeedWhileTraveling;
    // The per-frame animation function
    const animationLoop = () => {
      t += engine.getDeltaTime() / 1000 / duration;

      if (t >= 1) {
        t = 1;
        const newPos = getBezierPoint(t, controlPoints);
        mesh.position.copyFrom(newPos);

        // Cleanup: remove this animation from the array
        const index = activeAnimations.indexOf(animationLoop);
        if (index !== -1) {
          activeAnimations.splice(index, 1);
        }

        // onComplete: () => {
        // This happens after the animation
        console.log("Animation finished!");
        animationGroups[0].speedRatio = animationSpeedWhileIdle;
        animationInProgress = false;
        currentStationIndex += currentStationIndexModifier;
        if (automatedTourActive) {
          avatarNarration();
        }
        //} // trigger the callback

        return;
      }

      const newPos = getBezierPoint(t, controlPoints);
      mesh.position.copyFrom(newPos);
    };

    // Register this animation to be called each frame
    activeAnimations.push(animationLoop);
  }

  drawAllCurves(); // DEBUG
  visualizeCrossingPoints(); // DEBUG

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
    // this is inside the create function so it has access to the travel Functions
    const key = event.key.toLowerCase();

    if (key === "q") {
      travelToNextStation();
    } else if (key === "e") {
      travelToPriorStation();
    } else if (key === "s" && !animationInProgress) {
      avatarNarration();
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
