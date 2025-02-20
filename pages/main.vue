<template>
  <div class="main-wrapper">
    <!-- Three.js 렌더링 영역 -->
    <div ref="container"></div>


    <div class="tool-wrapper">
      <button class="write" @click="openWriteLetterModal">글쓰기</button>
    </div>
    <!-- 모달 컴포넌트들 -->
    <write-letter-modal
      v-if="showWriteLetterModal"
      @close-write-modal="showWriteLetterModal = false"
    />
    <letter-modal
      v-if="showLetterModal"
      @close-letter-modal="showLetterModal = false"
    />

    <!-- Bottle 컴포넌트들 -->
    <bottle
      :onClick="openLetterModal"
      v-for="(bottle, index) in bottles"
      :key="index"
      :position="bottle.position"
      :scene="scene"
      :camera="camera"
    />

    <!-- (필요에 따라 다른 컴포넌트 추가) -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

// ArrowKey 타입 선언
type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

// ─────────────────────────────────────────────
// 셰이더 코드 (예시)
// ─────────────────────────────────────────────
const verShader = `
#define SCALE 50.0
varying vec2 vUv;
uniform float uTime;
float calculateSurface(float x, float z) {
    float y = 0.0;
    y += sin(x * 2.8 / SCALE + uTime * 1.5);
    y += sin(z * 2.45 / SCALE + uTime * 1.7);
    return y;
}
void main() {
    vUv = uv;
    vec3 pos = position;
    float strength = 1.0;
    pos.y += strength * calculateSurface(pos.x, pos.z);
    pos.y -= strength * calculateSurface(0.0, 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.1);
}
`;

const fragShader = `
varying vec2 vUv;
uniform sampler2D uMap;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
void main() {
    vec2 uv = vUv * 50.0 + vec2(uTime * -0.05);
    uv.y += 0.01 * (sin(uv.x * 3.5 + uTime * 0.35) + sin(uv.x * 4.8 + uTime * 1.05) + sin(uv.x * 7.3 + uTime * 0.45)) / 3.0;
    uv.x += 0.12 * (sin(uv.y * 4.0 + uTime * 0.5) + sin(uv.y * 6.8 + uTime * 0.75) + sin(uv.y * 11.3 + uTime * 0.2)) / 3.0;
    uv.y += 0.12 * (sin(uv.x * 4.2 + uTime * 0.64) + sin(uv.x * 6.3 + uTime * 1.65) + sin(uv.x * 8.2 + uTime * 0.45)) / 3.0;
    vec4 tex1 = texture2D(uMap, uv * 1.0);
    vec4 tex2 = texture2D(uMap, uv * 1.5 + vec2(0.2));
    vec3 blue = uColor;
    gl_FragColor = vec4(blue + vec3(tex1.a * 0.4 - tex2.a * 0.02), 1.0);
    gl_FragColor.a = 0.8;
    #ifdef USE_FOG
        #ifdef USE_LOGDEPTHBUF_EXT
            float depth = gl_FragDepthEXT / gl_FragCoord.w;
        #else
            float depth = gl_FragCoord.z / gl_FragCoord.w;
        #endif
        float fogFactor = smoothstep(fogNear, fogFar, depth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
    #endif
}
`;

// ─────────────────────────────────────────────
// 커스텀 Sea 클래스 (바다 객체)
// ─────────────────────────────────────────────
class Sea {
  mesh: THREE.Mesh;
  uniforms: any;
  constructor() {
    const geomWaves = new THREE.PlaneGeometry(2000, 2000, 500, 500);
    geomWaves.rotateX(-Math.PI / 2);
    this.uniforms = {
      uMap: { type: "t", value: null },
      uTime: { type: "f", value: 0 },
      uColor: { type: "f", value: new THREE.Color("#52a4fe") },
      fogColor: { type: "c", value: new THREE.Color(0x4ca7e6) },
      fogNear: { type: "f", value: 400 },
      fogFar: { type: "f", value: 800 },
    };
    const shader = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: verShader,
      fragmentShader: fragShader,
      side: THREE.DoubleSide,
      fog: true,
      transparent: true,
    });
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("/water-shader.png", (texture) => {
      shader.uniforms.uMap.value = texture;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    });
    this.mesh = new THREE.Mesh(geomWaves, shader);
    // 해저 생성
    const geomSeaBed = new THREE.PlaneGeometry(2000, 2000, 5, 5);
    geomSeaBed.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    const matWaves = new THREE.MeshPhongMaterial({
      color: 0x52a4fe,
      flatShading: false,
    });
    const seaBed = new THREE.Mesh(geomSeaBed, matWaves);
    seaBed.position.set(0, -10, 0);
    seaBed.castShadow = false;
    seaBed.receiveShadow = true;
    this.mesh.add(seaBed);
  }
}

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
  const reflectionCube = new THREE.CubeTextureLoader().load(urls, () => {
    console.error("로드 모두 완");
  });
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
    new THREE.BoxGeometry(4000, 2000, 4000),
    material
  );
  skyBox.position.set(0, 0, 0);
  console.error(skyBox, "sdfsfsf");
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
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let boat: THREE.Group | null = null;
let clock: THREE.Clock;
let boatGroup = new THREE.Group();

const keys: Record<ArrowKey, boolean> = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

let isUserInteracting = false;

const bgAudio = ref<HTMLAudioElement | null>(null);
function playMusic() {
  if (bgAudio.value) {
    bgAudio.value
      .play()
      .then(() => console.log("배경음악 재생 시작"))
      .catch((error) => console.error("배경음악 재생 실패:", error));
  }
}

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
  let position = { x: 0, y: 0, z: 0 };
  let distanceFromBoat = 0;
  let distanceBetweenBottles = Infinity;
  let attempts = 0;
  const maxAttempts = 100;
  do {
    if (!boat) return position;
    position = {
      x: Math.random() * 2000 - 1000,
      y: 0,
      z: Math.random() * 2000 - 1000,
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

// 물결 높이 계산 함수 (진폭 5배 적용)
function getWaveHeight(x: number, z: number, time: number): number {
  const SCALE = 50.0;
  let y = 0;
  y += Math.sin((x * 2.8) / SCALE + time * 1.0);
  y += Math.sin((z * 2.45) / SCALE + time * 1.2);
  y -=
    Math.sin((0 * 2.8) / SCALE + time * 1.0) +
    Math.sin((0.5 * 2.45) / SCALE + time * 1.2);
  return y * 1.5;
}

// 이동 관련 변수: 보트의 이동 속도 및 감쇠 관련 변수
let boatVelocity = new THREE.Vector3();
const boatDampingFactor = 0.05;

// 보트의 기본 y 좌표 (물결 효과 적용 시 기준)
let baselineY = 0;

let seaObj: Sea;

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
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(20, 20, 70);

  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    "/standing_avatar.fbx",
    (fbx) => {
      avatar = fbx;
      avatar.scale.set(0.4, 0.4, 0.4);
      avatar.position.set(0, 10, 0);
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

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pointLight = new THREE.PointLight(0xffffff, 1, 500);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  sun = new THREE.Vector3();

  // 바다 생성
  seaObj = new Sea();
  scene.add(seaObj.mesh);

  const loader = new GLTFLoader();
  loader.load(
    "/boat.glb",
    (gltf) => {
      boat = gltf.scene;
      boat.scale.set(30, 30, 30);
      boat.position.set(0, 0, -40);
      boat.rotation.y = -Math.PI / 2;
      boatGroup.add(boat);
      const box = new THREE.Box3().setFromObject(boat);
      const center = new THREE.Vector3();
      box.getCenter(center);
      if (avatar) {
        updateAvatarPosition();
      }
      // 보트 로드 시 현재 y좌표를 baselineY에 저장
      baselineY = boatGroup.position.y;
      createBottles();
    },
    undefined,
    (error) => console.error("Boat load failed:", error)
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

let boatSpeed = 10;
let boatRotationSpeed = Math.PI / 2;
boatVelocity = new THREE.Vector3();

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
  boatVelocity.multiplyScalar(1 - boatDampingFactor);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateBoatMovement(delta);

  // 항상 보트에 물결 효과를 적용: 기본 y좌표(baselineY)에 getWaveHeight() 값을 더함.
  const waveY = getWaveHeight(
    boatGroup.position.x,
    boatGroup.position.z,
    seaObj.uniforms.uTime.value
  );
  boatGroup.position.y = baselineY + waveY;

  if (!isUserInteracting) {
    const camOffset = new THREE.Vector3(0, 20, -80);
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
  seaObj.uniforms.uTime.value += delta;
  renderer.render(scene, camera);
}

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
.write,
.play-music {
  margin-right: 10px;
}
</style>
