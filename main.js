import * as BABYLON from '@babylonjs/core'; // this is wrong
import * as GUI from "@babylonjs/gui";
import * as LOADERS from "@babylonjs/loaders";

//import oneTrack from 'public/assets/AvatarNarrations/Two.mp3';

import oneTrack from '/One.mp3';
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

// Create an audio engine

const createScene = async function() {
  const scene = new BABYLON.Scene(engine);

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

  const sphere = BABYLON.MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 1 },
    scene
  );
  sphere.position = new BABYLON.Vector3(1, 4, 2); // Starting Position of Shuttle


  const stationSoundPaths = [
    "/assets/AvatarNarrations/One.mp3",
    "/assets/AvatarNarrations/Two.mp3",
    "/assets/AvatarNarrations/Three.mp3",
  ];

  // const oneTrackFile = new BABYLON.Sound(
  //   "Narration",
  //   oneTrack,
  //   scene,
  //   null,
  //   {autoplay: false,
  //   loop: false}
  // );


  // Wait until audio engine is ready to play sounds.

  const stationSounds = [];

  stationSoundPaths.forEach((path, index) => {
    const sound = new BABYLON.Sound(
      `stationNarration_${index}`,
      path,
      scene,
      null,
      { autoplay: false,
        loop: false,
       }
    );
    stationSounds.push(sound);
  });
  console.log("loaded Sounds:", stationSounds);

  const stations = [
    sphere.position.clone(), // Station 0 Start
    new BABYLON.Vector3(4, 1, 4), // Station 1
    new BABYLON.Vector3(8, 1, 0),
    new BABYLON.Vector3(5, 1, -3), // Station 2
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

  let currentStationIndex = 0;
  let currentControlPoints = [];

  let animationInProgress = false;
  let t = 0;
  const duration = 2; // seconds

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

  async function startAutomatedTour() {
    
  const sound = stationSounds[currentStationIndex];


  if (!sound) {
    console.warn("No sound for station", currentStationIndex);
    return;
  }

    // if (currentStationIndex < 1) { // we are at the beginning
    // sound.play();
    // }
    sound.play();
    await new Promise((resolve) => {
    sound.onEndedObservable.add(() => {
      resolve();
      });
    });
    // const remainingTime = (1 - t) * duration * 1000;
    // await delay(remainingTime);
    // }


    //stationSounds[currentStationIndex].play();
    //const narrationDuration = stationSounds[currentStationIndex].duration;
    //console.log("narration Duration = " + narrationDuration);
    //await delay(200);
    animationInProgress = false;
    travelToNextStation();
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
      currentStationIndex++;
      // if (automatedTourActive) {
      //   startAutomatedTour(); // This can only start after the next point is reached 
      // }
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
      currentStationIndex--;
    }
  }



  drawAllCurves(); // DEBUG
  visualizeCrossingPoints(); // DEBUG

  let automatedTourActive = false;

  // Create cylinder
  const toggleCylinder = BABYLON.MeshBuilder.CreateCylinder(
    "toggleCylinder",
    { diameter: 0.5, height: 1 },
    scene
  );
  toggleCylinder.position = new BABYLON.Vector3(-4, 0.5, 4);

  // Materials
  const redMat = new BABYLON.StandardMaterial("redMat", scene);
  redMat.diffuseColor = new BABYLON.Color3(1, 0, 0);

  const greenMat = new BABYLON.StandardMaterial("greenMat", scene);
  greenMat.diffuseColor = new BABYLON.Color3(0, 1, 0);

  // Set initial material
  toggleCylinder.material = redMat;

  // Enable pointer interactions
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


    
    // const bgMusic = new BABYLON.Sound('mySong', '/DivKid.mp3', scene, null, {
    // loop: true,
    // autoplay: true
    // });



  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "q") {
      travelToNextStation();
      //stationSounds[currentStationIndex].play();
      //bgMusic.play();
     // oneTrackFile.play();
    } else if (key === "e") {
      travelToPriorStation();
    }
  });

  engine.runRenderLoop(function() {
    if (animationInProgress) {
      t += engine.getDeltaTime() / 1000 / duration;
      if (t > 1) {
        t = 1;
        animationInProgress = false;

        if (automatedTourActive) {
        startAutomatedTour(); // This can only start after the next point is reached 
      }
      }

      const newPos = getBezierPoint(t, currentControlPoints);
      sphere.position.copyFrom(newPos);
    }
    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());

  return scene;
};

const scene = await createScene();