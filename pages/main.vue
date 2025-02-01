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

// 키 상태를 저장할 객체 (키가 눌려있는지 여부)
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

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

  // 카메라 설정 (초기값은 이후 updateCameraPosition에서 업데이트 됨)
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
      // 보트 그룹에 추가하여 보트와 함께 움직이도록 함
      avatar.position.set(0, 10, 0);
      boatGroup.add(avatar);
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

  // 바다 설정
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

      // 보트의 중심 계산
      const box = new THREE.Box3().setFromObject(boat);
      const center = new THREE.Vector3();
      box.getCenter(center);
      // 아바타가 이미 로드되어 있다면 보트의 중심으로 위치 조정 (y축 오프셋 추가 가능)
      if (avatar) {
        avatar.position.copy(center).add(new THREE.Vector3(0, -5, 0));
      } else {
        console.warn(
          "아바타가 아직 로드되지 않았습니다. 아바타 로드 후 위치를 업데이트 해주세요."
        );
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
  const parameters = { elevation: 5, azimuth: 180 };
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

  // OrbitControls 설정
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 기존 keydown 이벤트를 대체하여, 키 상태를 추적하는 방식으로 변경
function setupKeyControls() {
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key in keys) {
      keys[event.key] = true;
    }
  });
  window.addEventListener("keyup", (event: KeyboardEvent) => {
    if (event.key in keys) {
      keys[event.key] = false;
    }
  });
}

// 속도 및 회전 관련 변수
let boatSpeed = 30; // 단위: 속도 (크게 하면 더 빠르게 가속)
let boatRotationSpeed = Math.PI / 2; // 초당 회전 각도
let boatVelocity = new THREE.Vector3();
let dampingFactor = 0.05; // 감쇠 계수

// 매 프레임마다 키 상태에 따라 속도와 회전을 업데이트
function updateBoatMovement(delta: number) {
  // 보트의 전방 벡터 (-Z가 기본 전방)
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
    boatGroup.quaternion
  );

  // 키 입력에 따라 속도를 누적 (delta를 곱해 프레임 독립적으로 조정)
  if (keys["ArrowUp"]) {
    boatVelocity.add(forward.clone().multiplyScalar(-boatSpeed * delta));
  }
  if (keys["ArrowDown"]) {
    boatVelocity.add(forward.clone().multiplyScalar(boatSpeed * delta));
  }

  // 좌우 회전은 속도 업데이트와 별개로 바로 적용
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

  // 보트 위치 업데이트
  boatGroup.position.add(boatVelocity);

  // 감쇠 적용 (마찰 효과)
  boatVelocity.multiplyScalar(1 - dampingFactor);
}

function updateCameraPosition() {
  if (!boatGroup) return;
  let desiredCameraPosition = new THREE.Vector3();
  desiredCameraPosition
    .copy(boatGroup.position)
    .add(new THREE.Vector3(0, 100, -250).applyQuaternion(boatGroup.quaternion));
  camera.position.lerp(desiredCameraPosition, 0.05);
  camera.lookAt(boatGroup.position.clone().add(new THREE.Vector3(0, 10, 0)));
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateBoatMovement(delta);
  updateCameraPosition();

  if (avatarMixer) {
    avatarMixer.update(delta);
  }
  // 바다의 애니메이션 업데이트
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
