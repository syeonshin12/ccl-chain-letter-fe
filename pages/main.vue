<template>
  <div class="main-wrapper">
    <div ref="container"></div>

    <div class="tool-wrapper">
      <button class="write" @click="openWriteLetterModal">글쓰기</button>
    </div>

    <write-letter-modal
      v-if="showWriteLetterModal"
      @close-write-modal="showWriteLetterModal = false"
    />
    <letter-modal
      v-if="showLetterModal"
      @close-letter-modal="showLetterModal = false"
    />

    <bottle
      :onClick="openLetterModal"
      v-for="(bottle, index) in bottles"
      :key="index"
      :position="bottle.position"
      :scene="scene"
      :camera="camera"
    />
  </div>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

let avatar: THREE.Group | null = null;
let avatarMixer: THREE.AnimationMixer | null = null;

const bottles = ref<{ position: { x: number; y: number; z: number } }[]>([]);

const container = ref<HTMLElement | null>(null);
let sun: THREE.Vector3;
let water: Water;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let boat: THREE.Group | null = null;
let clock: THREE.Clock;

// 보트와 아바타를 함께 담는 그룹
let boatGroup = new THREE.Group();

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
const keys: Record<ArrowKey, boolean> = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

let isUserInteracting = false; // 사용자가 OrbitControls로 카메라를 조작 중인지 여부

onMounted(() => {
  init();
  animate();
  setupKeyControls();
});

onBeforeUnmount(() => {
  if (renderer) {
    renderer.dispose();
  }
});

// 보트의 중심을 구해서 아바타의 위치를 업데이트하는 함수
function updateAvatarPosition() {
  if (!boat || !avatar) return;
  // 보트의 경계 상자(Box3)에서 중심 계산
  const box = new THREE.Box3().setFromObject(boat);
  const center = new THREE.Vector3();
  box.getCenter(center);
  // 여기서 (0, -5, 0) 오프셋은 보정용 값. 상황에 맞게 조정하세요.
  avatar.position.copy(center).add(new THREE.Vector3(0, -5, 0));
}

function getRandomPosition(
  minDistanceFromBoat: number,
  minDistanceBetweenBottles: number
) {
  let position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  let distanceFromBoat = 0;
  let distanceBetweenBottles = Infinity;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    if (!boat) return position;
    position = {
      x: boat.position.x + Math.random() * 200 - 100,
      y: Math.random() * 5 + 2,
      z: boat.position.z + Math.random() * 200 - 100,
    };
    distanceFromBoat = Math.sqrt(
      (position.x - boat.position.x) ** 2 +
        (position.y - boat.position.y) ** 2 +
        (position.z - boat.position.z) ** 2
    );
    if (bottles.value.length > 0) {
      distanceBetweenBottles = Math.min(
        ...bottles.value.map((bottle) => {
          const dx = position.x - bottle.position.x;
          const dy = position.y - bottle.position.y;
          const dz = position.z - bottle.position.z;
          return Math.sqrt(dx * dx + dy * dy + dz * dz);
        })
      );
    }
    attempts++;
    if (attempts > maxAttempts) {
      console.warn("최대 시도 횟수를 초과했습니다. 병 생성 실패.");
      return position;
    }
  } while (
    distanceFromBoat < minDistanceFromBoat ||
    distanceBetweenBottles < minDistanceBetweenBottles
  );
  return position;
}

function createBottles() {
  if (!boat) return;
  const minDistanceFromBoat = 80;
  const minDistanceBetweenBottles = 25;
  for (let i = 0; i < 15; i++) {
    const position = getRandomPosition(
      minDistanceFromBoat,
      minDistanceBetweenBottles
    );
    bottles.value.push({ position });
  }
}

function init() {
  if (!container.value) return;

  clock = new THREE.Clock();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.value.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.add(boatGroup); // 보트 그룹을 씬에 추가

  // 카메라 설정 (OrbitControls가 카메라 제어)
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(20, 70, 170);

  // 아바타 로드 (FBXLoader)
  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    "/standing_avatar.fbx",
    (fbx) => {
      avatar = fbx;
      avatar.scale.set(0.4, 0.4, 0.4);
      avatar.position.set(0, 10, 0);
      boatGroup.add(avatar);
      // 아바타 로드 완료 후 보트 중심 기반 위치 업데이트
      updateAvatarPosition();
      if (fbx.animations.length > 0) {
        avatarMixer = new THREE.AnimationMixer(avatar);
        const action = avatarMixer.clipAction(fbx.animations[0]);
        action.play();
      }
    },
    undefined,
    (error) => {
      console.error("아바타 로드 실패:", error);
    }
  );

  // 조명 설정
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pointLight = new THREE.PointLight(0xffffff, 1, 500);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  sun = new THREE.Vector3();

  // 바다 설정 (크기 8000x8000)
  const waterGeometry = new THREE.PlaneGeometry(8000, 8000);
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "/waternormals.jpg",
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xcccccc,
    waterColor: 0x003366,
    distortionScale: 2.0,
    fog: scene.fog !== undefined,
  });
  water.rotation.x = -Math.PI / 2;
  water.material.uniforms["alpha"].value = 1;
  scene.add(water);

  // 보트 로드 (GLTFLoader)
  const loader = new GLTFLoader();
  loader.load(
    "/boat.glb",
    (gltf) => {
      boat = gltf.scene;
      boat.scale.set(30, 30, 30);
      boat.position.set(0, 0, -40);
      // 뱃머리가 전면(-Z 방향)을 향하도록 설정
      boat.rotation.y = -Math.PI / 2;
      boatGroup.add(boat);

      // 보트의 중심 계산 및 아바타 위치 업데이트
      const box = new THREE.Box3().setFromObject(boat);
      const center = new THREE.Vector3();
      box.getCenter(center);
      if (avatar) {
        // updateAvatarPosition() 재호출하여 보트 중심 기준으로 아바타 위치 재설정
        updateAvatarPosition();
      }
      createBottles();
    },
    undefined,
    (error) => {
      console.error("보트 모델 로드 실패:", error);
    }
  );

  // Skybox 설정
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 0.2;
  skyUniforms["rayleigh"].value = 0.1;
  skyUniforms["mieCoefficient"].value = 0.003;
  skyUniforms["mieDirectionalG"].value = 0.7;
  // 해 파라미터: elevation, azimuth (필요에 따라 조정)
  const parameters = { elevation: 5, azimuth: 360 };
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  let renderTarget: THREE.WebGLRenderTarget | undefined;
  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();
    if (renderTarget !== undefined) renderTarget.dispose();
    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);
    scene.environment = renderTarget.texture;
  }
  updateSun();

  // OrbitControls 설정 (사용자 입력을 허용)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 200.0;
  controls.maxDistance = 500.0;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  // 초기 target은 보트 그룹 위치 기준 (보트 중앙에서 약간 위쪽)
  controls.target.copy(boatGroup.position).add(new THREE.Vector3(0, 10, 0));
  controls.update();

  // 사용자 인터랙션 감지: pointerdown / pointerup 이벤트
  renderer.domElement.addEventListener("pointerdown", () => {
    isUserInteracting = true;
  });
  renderer.domElement.addEventListener("pointerup", () => {
    isUserInteracting = false;
  });

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 키보드 상태 업데이트
function setupKeyControls() {
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key in keys) {
      keys[event.key as ArrowKey] = true;
    }
  });
  window.addEventListener("keyup", (event: KeyboardEvent) => {
    if (event.key in keys) {
      keys[event.key as ArrowKey] = false;
    }
  });
}

// 보트 이동 관련 변수
let boatSpeed = 20; // 가속도
let boatRotationSpeed = Math.PI / 2; // 초당 회전 각도
let boatVelocity = new THREE.Vector3();
let dampingFactor = 0.05; // 감쇠 계수

// 보트 이동 업데이트
function updateBoatMovement(delta: number) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
    boatGroup.quaternion
  );
  if (keys["ArrowUp"]) {
    boatVelocity.add(forward.clone().multiplyScalar(-boatSpeed * delta));
  }
  if (keys["ArrowDown"]) {
    boatVelocity.add(forward.clone().multiplyScalar(boatSpeed * delta));
  }
  if (keys["ArrowLeft"]) {
    boatGroup.rotateOnAxis(
      new THREE.Vector3(0, 1, 0),
      boatRotationSpeed * delta
    );
  }
  if (keys["ArrowRight"]) {
    boatGroup.rotateOnAxis(
      new THREE.Vector3(0, 1, 0),
      -boatRotationSpeed * delta
    );
  }
  boatGroup.position.add(boatVelocity);
  boatVelocity.multiplyScalar(1 - dampingFactor);
}

// animate 함수: 보트 이동 및 카메라 follow 업데이트
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateBoatMovement(delta);

  // 사용자가 직접 조작 중이 아니라면 자동 follow 업데이트:
  if (!isUserInteracting) {
    // 보트 뒤쪽에 카메라가 위치하도록 오프셋 계산 (보트 회전에 맞춰 적용)
    const camOffset = new THREE.Vector3(0, 100, -250);
    camOffset.applyQuaternion(boatGroup.quaternion);
    const desiredCamPos = boatGroup.position.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, 0.05);

    // 타깃은 보트 중심에서 약간 위쪽 (예: (0,20,0))으로 설정
    const targetOffset = new THREE.Vector3(0, 20, 0);
    targetOffset.applyQuaternion(boatGroup.quaternion);
    const desiredTarget = boatGroup.position.clone().add(targetOffset);
    controls.target.lerp(desiredTarget, 0.05);
  }

  controls.update();
  if (avatarMixer) {
    avatarMixer.update(delta);
  }
  water.material.uniforms["time"].value += delta;
  renderer.render(scene, camera);
}

const showLetterModal = ref(false);
const showWriteLetterModal = ref(false);

const openWriteLetterModal = () => {
  showWriteLetterModal.value = true;
};

const openLetterModal = () => {
  console.error("클릭");
  showLetterModal.value = true;
};
</script>

<style scoped>
.canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.tool-wrapper {
  position: absolute;
  top: 30px;
  right: 40px;
  display: flex;
  font-size: 20px;
}

.write {
  margin-right: 10px;
}
</style>
