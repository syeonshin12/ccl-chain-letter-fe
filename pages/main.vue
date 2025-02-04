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

// ─────────────────────────────────────────────
// Skybox 초기화 함수 (제공해주신 코드)
// ─────────────────────────────────────────────
function initSkybox() {
  // public 폴더 내의 파일 경로에 맞게 수정 (예: /sky_pos_x.png 등)
  const urls = [
    "/sky_pos_x.png",
    "/sky_neg_x.png",
    "/sky_pos_y.png",
    "/sky_neg_y.png",
    "/sky_neg_z.png",
    "/sky_pos_z.png",
  ];
  const reflectionCube = new THREE.CubeTextureLoader().load(urls);
  // reflectionCube.encoding = THREE.sRGBEncoding; // sRGB 인코딩 설정
  reflectionCube.format = THREE.RGBAFormat; // RGBA 포맷 사용
  const shader = THREE.ShaderLib["cube"];
  shader.uniforms["tCube"].value = reflectionCube;
  const material = new THREE.ShaderMaterial({
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: shader.uniforms,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const skyBox = new THREE.Mesh(
    new THREE.BoxGeometry(6000, 6000, 6000),
    material
  );
  skyBox.position.set(0, 0, 0);

  scene.add(skyBox);
}

// ─────────────────────────────────────────────
// 기존 main 페이지 코드
// ─────────────────────────────────────────────
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

let islandMixer: THREE.AnimationMixer | null = null; // 전역 변수 선언
let islandMixer2: THREE.AnimationMixer | null = null;

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

function updateAvatarPosition() {
  if (!boat || !avatar) return;
  const box = new THREE.Box3().setFromObject(boat);
  const center = new THREE.Vector3();
  box.getCenter(center);
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
    // x, z 범위를 -3000 ~ 3000으로 변경하여 바다 안쪽에 배치
    position = {
      x: Math.random() * 6000 - 3000, // 6000 = 3000 - (-3000)
      y: Math.random() * 5 + 2, // y 좌표는 그대로 2~7 사이
      z: Math.random() * 6000 - 3000,
    };

    // 보트와의 최소 거리 체크
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
      console.warn("Max attempts exceeded, bottle creation failed.");
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

  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(20, 10, 40);

  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    "/standing_avatar.fbx",
    (fbx) => {
      avatar = fbx;
      avatar.scale.set(0.4, 0.4, 0.4);
      avatar.position.set(0, 10, 0);

      avatar.rotation.y = THREE.MathUtils.degToRad(50); // Y축을 10도 회전
      avatar.rotation.x = THREE.MathUtils.degToRad(-5); // X축을 -5도 기울임 (선택 사항)

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
    (error) => console.error("Avatar load failed:", error)
  );

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const pointLight = new THREE.PointLight(0xffffff, 1, 500);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  sun = new THREE.Vector3();

  // 바다 설정 (크기 8000x8000)
  const waterGeometry = new THREE.PlaneGeometry(6000, 6000);
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
      boat.rotation.y = -Math.PI / 2.5;
      boatGroup.add(boat);
      const box = new THREE.Box3().setFromObject(boat);
      const center = new THREE.Vector3();
      box.getCenter(center);
      if (avatar) {
        updateAvatarPosition();
      }
      createBottles();
    },
    undefined,
    (error) => console.error("Boat load failed:", error)
  );

  // Lighthouse 모델 로드 (여기에 추가)
  const lighthouseLoader = new GLTFLoader();
  lighthouseLoader.load(
    "/light_house.glb",
    (gltf) => {
      const lighthouse = gltf.scene;
      lighthouse.scale.set(15, 15, 15);
      lighthouse.position.set(-20, -10, 700); // 원하는 위치로 조정

      lighthouse.rotation.y = Math.PI;

      scene.add(lighthouse);
    },
    undefined,
    (error) => console.error("Lighthouse load failed:", error)
  );

  // 산호초
  // Lighthouse 모델 로드 (여기에 추가)
  const reef1Loader = new GLTFLoader();
  reef1Loader.load(
    "/reef_1.glb",
    (gltf) => {
      const reef1 = gltf.scene;
      reef1.scale.set(0.15, 0.15, 0.15);
      reef1.position.set(-700, -10, 400); // 원하는 위치로 조정

      reef1.rotation.y = Math.PI;

      scene.add(reef1);
    },
    undefined,
    (error) => console.error("Lighthouse load failed:", error)
  );

  const islandLoader = new GLTFLoader();
  islandLoader.load(
    "/island_coconut.glb",
    (gltf) => {
      const islandCoconut = gltf.scene;
      // 스케일과 위치는 필요에 따라 조절 (예: 바다 위에 떠 있는 듯한 위치)
      islandCoconut.scale.set(8, 8, 8); // 모델에 따라 조정
      islandCoconut.position.set(500, 17, 500); // 예시 위치: x=1000, y=0 (해수면 기준), z=500
      scene.add(islandCoconut);

      if (gltf.animations && gltf.animations.length > 0) {
        islandMixer = new THREE.AnimationMixer(islandCoconut);
        const action = islandMixer.clipAction(gltf.animations[0]);

        action.play();
      }
    },
    undefined,
    (error) => console.error("Island coconut model load failed:", error)
  );

  const islandLoader2 = new GLTFLoader();
  islandLoader2.load(
    "/island_coconut.glb",
    (gltf) => {
      const islandCoconut2 = gltf.scene;
      islandCoconut2.scale.set(8, 8, 8);
      // 예시 위치: x = -1200, y = 17, z = -800
      islandCoconut2.position.set(-1200, 17, -800);
      scene.add(islandCoconut2);

      if (gltf.animations && gltf.animations.length > 0) {
        // 별도의 애니메이션 믹서를 생성하거나, 여러 믹서를 배열에 담아 animate()에서 업데이트할 수 있음
        const mixer2 = new THREE.AnimationMixer(islandCoconut2);
        const action2 = mixer2.clipAction(gltf.animations[0]);
        action2.play();

        // 예시: animate() 함수에서 mixer2.update(delta)를 호출하는 코드를 추가해야 함.
        // 또는 전역 변수나 배열에 저장해서 매 프레임 업데이트하도록 처리합니다.
        // 여기서는 간단히 전역 변수 islandMixer2에 할당하는 예시:
        islandMixer2 = mixer2;
      }
    },
    undefined,
    (error) => console.error("Island coconut 2 model load failed:", error)
  );

  // 기존 Sky 관련 코드를 제거하고, initSkybox() 호출하여 하늘박스를 적용
  initSkybox();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = true;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 200.0;
  controls.maxDistance = 500.0;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.copy(boatGroup.position).add(new THREE.Vector3(0, 5, 0));
  controls.update();

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
let boatSpeed = 7; // 가속도
let boatRotationSpeed = Math.PI / 3; // 초당 회전 각도
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

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateBoatMovement(delta);

  // 사용자가 직접 조작 중이 아니라면 자동 follow 업데이트:
  if (!isUserInteracting) {
    // 보트 뒤쪽에 카메라가 위치하도록 오프셋 계산 (보트 회전에 맞춰 적용)
    const camOffset = new THREE.Vector3(0, 50, -250);
    camOffset.applyQuaternion(boatGroup.quaternion);
    const desiredCamPos = boatGroup.position.clone().add(camOffset);
    camera.position.lerp(desiredCamPos, 0.05);
    const targetOffset = new THREE.Vector3(0, 5, 0);
    targetOffset.applyQuaternion(boatGroup.quaternion);
    const desiredTarget = boatGroup.position.clone().add(targetOffset);
    controls.target.lerp(desiredTarget, 0.05);
  }

  controls.update();

  if (avatarMixer) {
    avatarMixer.update(delta);
  }

  if (islandMixer) {
    islandMixer.update(delta);
  }

  if (islandMixer2) {
    islandMixer2?.update(delta);
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
