<template>
  <div class="main-wrapper">
    <div ref="container"></div>

    <div class="tool-wrapper">
      <button class="tutorial" @click="startTutorial">튜토리얼</button>
      <button class="write" @click="openWriteLetterModal">글쓰기</button>
    </div>

    <write-letter-modal
      v-if="showWriteLetterModal"
      @close-write-modal="showWriteLetterModal = false"
      @send-letter="handleAddNewLetter"
    />

    <letter-modal
      v-if="showLetterModal"
      :selectedMessageId="selectedMessageId"
      @close-letter-modal="showLetterModal = false"
    />

    <div class="success-message" v-if="showSuccessMessage">
      <div class="overlay"></div>
      <DotLottieVue
        class="success-img"
        renderer="canvas"
        autoplay
        loop
        src="/success.lottie"
      />
      <div class="message-banner">편지가 성공적으로 전송되었습니다!</div>
    </div>

    <!-- 병(bottle) 컴포넌트: 각 병 클릭 시, 해당 병의 messageId를 openLetterModal로 전달 -->
    <bottle
      :onClick="() => openLetterModal(bottle.messageId)"
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
import { Water } from "three/examples/jsm/objects/Water";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

import introJs from "intro.js";

const showSuccessMessage = ref(false);

const steps = [
  {
    intro: "안녕하세요~!<br/>행운의 편지에 오신 것을 진심으로 환영합니다!",
  },
  {
    element: ".write",
    intro:
      "글쓰기 버튼을 눌러,<br/> 마음을 담은 편지를 해류병에 담아 띄워보세요.",
  },

  {
    intro:
      "방향키를 사용해 바다를 누비며 <br/> 해류병에 담긴 메시지를 찾아보세요!",
  },
  {
    intro: "즐거운 시간 보내세요~🍀",
  },
];

const startTutorial = () => {
  // 페이지가 마운트되면 튜토리얼 실행
  introJs()
    .setOptions({
      steps,
      showStepNumbers: true, // 단계 번호 표시 여부
      exitOnOverlayClick: false, // 오버레이 클릭 시 튜토리얼 종료 안함
      exitOnEsc: true, // ESC키로 튜토리얼 종료
      nextLabel: "다음",
      prevLabel: "이전",
      doneLabel: "완료",
    })
    .start();
};

// 쪽지 데이터 타입 (composables/useFetchMessageList.ts 에서 정의한 Message 타입과 동일)
interface Message {
  id: number;
  content: string;
  imageUrl: string | null;
}

// 병(bottle) 객체 타입: 각 병은 position과 선택적으로 messageId를 가짐
const bottles = ref<
  { position: { x: number; y: number; z: number }; messageId?: number }[]
>([]);

// 전체 쪽지 데이터를 저장할 배열
const messages = ref<Message[]>([]);

const container = ref<HTMLElement | null>(null);
let sun: THREE.Vector3;
let water: Water;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let boat: THREE.Group | null = null;
let clock: THREE.Clock;
let avatar: THREE.Group | null = null;
let avatarMixer: THREE.AnimationMixer | null = null;
let islandMixer: THREE.AnimationMixer | null = null;
let islandMixer2: THREE.AnimationMixer | null = null;
let islandMixer3: THREE.AnimationMixer | null = null;
let islandMixer4: THREE.AnimationMixer | null = null;

let boatGroup = new THREE.Group();

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
const keys: Record<ArrowKey, boolean> = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

let isUserInteracting = false;

const showLetterModal = ref(false);
const showWriteLetterModal = ref(false);
const selectedMessageId = ref<number | null>(null);

const openWriteLetterModal = () => {
  showWriteLetterModal.value = true;
};

// 수정된 openLetterModal: messageId를 인자로 받아 selectedMessageId에 저장한 후 모달 오픈
const openLetterModal = (messageId: number | undefined) => {
  if (messageId === undefined) return;
  selectedMessageId.value = messageId;
  showLetterModal.value = true;
};

// ─────────────────────────────────────────────
// Skybox 초기화 함수
// ─────────────────────────────────────────────
function initSkybox() {
  const urls = [
    "/sky_pos_x.png",
    "/sky_neg_x.png",
    "/sky_pos_y.png",
    "/sky_neg_y.png",
    "/sky_neg_z.png",
    "/sky_pos_z.png",
  ];
  const reflectionCube = new THREE.CubeTextureLoader().load(urls);
  reflectionCube.format = THREE.RGBAFormat;
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
// 병 생성 함수: 메시지 데이터가 있으면 각 메시지의 id를 병 객체에 저장
// ─────────────────────────────────────────────
function createBottles() {
  if (!boat) return;
  const minDistanceFromBoat = 80;
  const minDistanceBetweenBottles = 25;
  bottles.value = [];
  if (messages.value.length > 0) {
    messages.value.forEach((msg) => {
      const pos = getRandomPosition(
        minDistanceFromBoat,
        minDistanceBetweenBottles
      );
      bottles.value.push({ position: pos, messageId: msg.id });
    });
  }
}

// 새 편지 id를 받아 해당 병 하나만 추가하는 핸들러
const handleAddNewLetter = (newLetterId: number) => {
  const minDistanceFromBoat = 80;
  const minDistanceBetweenBottles = 25;
  const pos = getRandomPosition(minDistanceFromBoat, minDistanceBetweenBottles);
  bottles.value.push({ position: pos, messageId: newLetterId });

  // 성공 메시지 등을 보여주기 위한 UI 업데이트
  showSuccessMessage.value = true;
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 2000);
};

function getRandomPosition(
  minDistanceFromBoat: number,
  minDistanceBetweenBottles: number
) {
  let position = { x: 0, y: 0, z: 0 };
  let distanceFromBoat = 0;
  let distanceBetweenBottles = Infinity;
  let attempts = 0;
  const maxAttempts = 100;
  do {
    if (!boat) return position;
    position = {
      x: Math.random() * 6000 - 3000,
      y: Math.random() * 5 + 2,
      z: Math.random() * 6000 - 3000,
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
      console.warn("Max attempts exceeded, bottle creation failed.");
      return position;
    }
  } while (
    distanceFromBoat < minDistanceFromBoat ||
    distanceBetweenBottles < minDistanceBetweenBottles
  );
  return position;
}

// ─────────────────────────────────────────────
// onMounted: 초기화 및 쪽지 조회 후 병 생성
// ─────────────────────────────────────────────
onMounted(async () => {
  init();
  animate();
  setupKeyControls();
  if (localStorage.getItem("firstVisit") === "true") {
    nextTick(() => {
      startTutorial();
      localStorage.setItem("firstVisit", "false");
    });
  }
  // 쪽지 조회 API 호출 (useFetchMessageList는 Nuxt3 자동 임포트)
  try {
    const res = await useFetchMessageList();
    if (res && res.code === 0) {
      messages.value = res.data;
    }
  } catch (error) {
    console.error("쪽지 조회 API 호출 중 오류 발생:", error);
  }

  createBottles();
});

onBeforeUnmount(() => {
  if (renderer) {
    renderer.dispose();
  }
});

// ─────────────────────────────────────────────
// 기존 main 페이지 초기화 및 애니메이션 함수
// ─────────────────────────────────────────────
function updateAvatarPosition() {
  if (!boat || !avatar) return;
  const box = new THREE.Box3().setFromObject(boat);
  const center = new THREE.Vector3();
  box.getCenter(center);
  avatar.position.copy(center).add(new THREE.Vector3(0, -5, 0));
}

function init() {
  if (!container.value) return;
  clock = new THREE.Clock();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.value.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.add(boatGroup);

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
      avatar.rotation.y = THREE.MathUtils.degToRad(50);
      avatar.rotation.x = THREE.MathUtils.degToRad(-5);
      boatGroup.add(avatar);
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

  const lighthouseLoader = new GLTFLoader();
  lighthouseLoader.load(
    "/light_house.glb",
    (gltf) => {
      const lighthouse = gltf.scene;
      lighthouse.scale.set(15, 15, 15);
      lighthouse.position.set(-20, -10, 700);
      lighthouse.rotation.y = Math.PI;
      scene.add(lighthouse);
    },
    undefined,
    (error) => console.error("Lighthouse load failed:", error)
  );

  const reef1Loader = new GLTFLoader();
  reef1Loader.load(
    "/reef_1.glb",
    (gltf) => {
      const reef1 = gltf.scene;
      reef1.scale.set(0.15, 0.15, 0.15);
      reef1.position.set(-700, -10, 400);
      reef1.rotation.y = Math.PI;
      scene.add(reef1);
    },
    undefined,
    (error) => console.error("Reef load failed:", error)
  );

  const islandLoader = new GLTFLoader();
  islandLoader.load(
    "/island_coconut.glb",
    (gltf) => {
      const islandCoconut = gltf.scene;
      islandCoconut.scale.set(8, 8, 8);
      islandCoconut.position.set(500, 17, 500);
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
      islandCoconut2.position.set(-1600, 17, 0);
      islandCoconut2.rotation.y = THREE.MathUtils.degToRad(-90);
      scene.add(islandCoconut2);
      if (gltf.animations && gltf.animations.length > 0) {
        islandMixer2 = new THREE.AnimationMixer(islandCoconut2);
        const action2 = islandMixer2.clipAction(gltf.animations[0]);
        action2.play();
      }
    },
    undefined,
    (error) => console.error("Island coconut 2 model load failed:", error)
  );

  const islandLoader3 = new GLTFLoader();
  islandLoader3.load(
    "/beach_island.glb",
    (gltf) => {
      const islandModel = gltf.scene;
      // 원하는 크기로 스케일 및 위치 조정 (예: 다른 객체와 겹치지 않도록)
      islandModel.scale.set(25, 25, 25);
      // 허전한 바다에 배치 (예: x: 2000, y: -10, z: -2000 등 원하는 위치)

      islandModel.position.set(2000, 20, -1000);
      islandModel.rotation.y = THREE.MathUtils.degToRad(240);
      scene.add(islandModel);
    },
    undefined,
    (error) => console.error("Island model load failed:", error)
  );

  const parkIslandLoader = new GLTFLoader();
  parkIslandLoader.load(
    "/park_island.glb",
    (gltf) => {
      const parkIsland = gltf.scene;
      // 원하는 크기와 위치로 조정 (예시)
      parkIsland.scale.set(25, 25, 25);
      parkIsland.position.set(-600, 17, -2000);
      // 정면 방향 회전 (예: 180도 회전)
      // parkIsland.rotation.y = THREE.MathUtils.degToRad(180);
      scene.add(parkIsland);
      if (gltf.animations && gltf.animations.length > 0) {
        // 애니메이션이 포함된 경우, AnimationMixer를 생성해서 재생

        islandMixer3 = new THREE.AnimationMixer(parkIsland);
        const action = islandMixer3.clipAction(gltf.animations[0]);
        action.play();
      }
    },
    undefined,
    (error) => console.error("Park Island model load failed:", error)
  );

  const parkIslandLoader2 = new GLTFLoader();
  parkIslandLoader2.load(
    "/park_island.glb",
    (gltf) => {
      const parkIsland2 = gltf.scene;
      // 크기와 위치를 적절하게 지정 (반대편)
      parkIsland2.scale.set(25, 25, 25);
      parkIsland2.position.set(2300, 17, 1800);
      // 필요시 회전도 적용 (예: 정면을 맞추기 위해 180도 회전)
      parkIsland2.rotation.y = THREE.MathUtils.degToRad(200);
      scene.add(parkIsland2);
      // 애니메이션이 포함되어 있다면 AnimationMixer를 통해 재생
      if (gltf.animations && gltf.animations.length > 0) {
        islandMixer4 = new THREE.AnimationMixer(parkIsland2);
        const action2 = islandMixer4.clipAction(gltf.animations[0]);
        action2.play();
      }
    },
    undefined,
    (error) => console.error("Second Park Island model load failed:", error)
  );

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

let boatSpeed = 10;
let boatRotationSpeed = Math.PI / 3;
let boatVelocity = new THREE.Vector3();
let dampingFactor = 0.05;

function updateBoatMovement(delta: number) {
  // write letter modal이 열려있으면 배 이동을 멈춥니다.
  if (showWriteLetterModal.value || showLetterModal.value) return;
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

  if (!isUserInteracting) {
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

  if (islandMixer3) {
    islandMixer3?.update(delta);
  }

  if (islandMixer4) {
    islandMixer4?.update(delta);
  }

  water.material.uniforms["time"].value += delta;
  renderer.render(scene, camera);
}
</script>

<style scoped>
.main-wrapper {
  min-height: 100vh; /* 높이를 화면 전체로 확장 */
  width: 100vw; /* 너비를 화면 전체로 확장 */
}

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
  background: linear-gradient(45deg, #00d2ff, #3a7bd5);
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 23px;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.write:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.write:active {
  transform: scale(0.98);
}

.tutorial {
  background: #d3d3d3 !important;
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 23px;
  font-weight: bold;
  color: #fff !important;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  margin-right: 11px; /* 글쓰기 버튼과 간격 추가 */
}

.tutorial:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.tutorial:active {
  transform: scale(0.98);
}

/* 전체 화면을 덮는 success-message 컨테이너 */
.success-message {
  position: fixed;
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999; /* 다른 요소 위에 표시 */
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 화면 전체를 덮는 어둡게 처리된 오버레이 */
.success-message .overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1; /* 메시지 배너보다 아래에 위치 */
}

.success-message .success-img {
  z-index: 2;
  width: 200px;
  height: 200px;
}

/* 중앙에 표시되는 메시지 배너 */
.success-message .message-banner {
  position: relative;
  z-index: 2; /* 오버레이보다 위에 표시 */
  color: white;
  padding: 20px;
  font-size: 1.8rem;
  width: 600px;
  text-align: center;
}
</style>
