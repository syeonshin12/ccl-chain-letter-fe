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
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // 경로 수정
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; // GLTFLoader 임포트
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader"; // FBXLoader 추가

let avatar: THREE.Group | null = null;
let avatarMixer: THREE.AnimationMixer | null = null;

const bottles = ref<{ position: { x: number; y: number; z: number } }[]>([]); // 병 배열

const container = ref<HTMLElement | null>(null);
let sun: THREE.Vector3;
let water: Water;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let boat: THREE.Group | null = null;
let clock: THREE.Clock;

onMounted(() => {
  init();
  animate();
  setupKeyControls(); // 키 이벤트 설정
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
  let distanceBetweenBottles = Infinity; // 시작할 때는 무한대로 설정

  let attempts = 0; // 최대 시도 횟수 (무한 루프 방지)
  const maxAttempts = 100; // 시도 횟수 제한

  do {
    if (!boat) return position;

    // 랜덤 위치 생성 (보트의 위치를 중심으로 생성되도록 범위 조정)
    position = {
      x: boat.position.x + Math.random() * 200 - 100, // 보트 주변 -100 ~ 100 범위
      y: Math.random() * 5 + 2, // 약간 떠 있는 효과
      z: boat.position.z + Math.random() * 200 - 100, // 보트 주변 -100 ~ 100 범위
    };

    // 보트와의 거리 계산
    distanceFromBoat = Math.sqrt(
      (position.x - boat.position.x) ** 2 +
        (position.y - boat.position.y) ** 2 +
        (position.z - boat.position.z) ** 2
    );

    // 병들 간의 최소 거리 체크
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

    attempts++; // 시도 횟수 증가
    if (attempts > maxAttempts) {
      console.warn("최대 시도 횟수를 초과했습니다. 병 생성 실패.");
      return position; // 최대 시도 횟수 초과시 그냥 반환
    }
  } while (
    distanceFromBoat < minDistanceFromBoat ||
    distanceBetweenBottles < minDistanceBetweenBottles
  ); // 두 조건 모두 만족할 때까지 반복

  return position;
}

function createBottles() {
  if (!boat) return;

  const minDistanceFromBoat = 80; // 보트와 최소  거리 이상
  const minDistanceBetweenBottles = 25; // 병들 간 최소 거리 설정

  for (let i = 0; i < 15; i++) {
    // 병의 위치가 보트와 겹치지 않으면서, 병들 간에도 겹치지 않도록 위치 생성
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

  // WebGLRenderer 설정
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.value.appendChild(renderer.domElement);

  // Scene 설정
  scene = new THREE.Scene();

  // FBXLoader를 사용하여 아바타 로드
  const fbxLoader = new FBXLoader();
  fbxLoader.load(
    "/standing_avatar.fbx",
    (fbx) => {
      avatar = fbx;
      avatar.scale.set(0.4, 0.4, 0.4);
      scene.add(avatar);

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

  // Camera 설정
  camera = new THREE.PerspectiveCamera(
    // fov - 숫자가 낮으면 물체가 더 멀리 보임.
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(20, 70, 170);

  // DirectionalLight (메인 조명)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // 밝기 증가
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // AmbientLight (부드러운 환경광)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 밝기 증가
  scene.add(ambientLight);

  // PointLight (보조 조명)
  const pointLight = new THREE.PointLight(0xffffff, 1, 500); // 추가적인 빛
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  // Sun Vector 설정 - vector3는 3D 좌표 표현하는 클래스. 물체의 위치나 방향 나타냄
  // 태양의 방향 필요할때 사용. 물의 표면이나 하늘에서 태양의 위치가 영향을 미치게 되면 이 벡터 사용
  sun = new THREE.Vector3();

  // Water (바다) 설정
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
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

  // 보트 모델 로드
  loader.load(
    "/boat.glb",
    (gltf) => {
      boat = gltf.scene;
      boat.scale.set(30, 30, 30); // 보트 크기 조정 (필요 시 크기 변경)
      boat.position.set(0, 0, -40); // 보트의 초기 위치 설정

      boat.rotation.y = (Math.PI * 240) / 180;
      scene.add(boat);

      const box = new THREE.Box3().setFromObject(boat);
      const center = new THREE.Vector3();
      box.getCenter(center);

      if (avatar) {
        avatar.position.copy(center);
        // avatar.position.y -= 1;
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
  // 공기 속 먼지의 양 - 클수록 하늘이 흐리고 탁하다
  skyUniforms["turbidity"].value = 0.2;
  // 하늘의 파란색 정도 - 클수록 하늘이 파랗고 선명
  skyUniforms["rayleigh"].value = 0.1;
  // 먼지에 의한 빛의 산란 정도 - 하늘의 색상이나 강도에 영향을 미친다
  skyUniforms["mieCoefficient"].value = 0.003;
  // 햇빛의 산란정도 - 하늘의 색상이나 햇빛이 어떻게 퍼지는지
  skyUniforms["mieDirectionalG"].value = 0.7;

  // elevation은 태양이 하늘에서 얼마나 높은지, azimuth는 태양이 얼마나 동쪽 또는 서쪽에 위치하는지
  // elevation은 0은 수평선, 90도는 정수리 위쪽
  // azimut는 -180도에서 180도까지의 범위를 가지며, -180은 서쪽, 0도는 남쪽, 180도는 동쪽
  const parameters = {
    elevation: 5,
    azimuth: 180,
  };

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

  // OrbitControls 설정 - 카메라를 마우스로 조작할 수 있게 해주는 컨트롤러

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  // 윈도우 리사이즈 이벤트
  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let boatSpeed = 2; // 보트 이동 속도 설정
let cameraOffset = new THREE.Vector3(0, 10, -30); // 카메라가 보트 뒤쪽에 위치하도록 설정
let boatTargetPosition = new THREE.Vector3(); // 보트의 타겟 위치 설정

function setupKeyControls() {
  window.addEventListener("keydown", onKeyDown); // 키보드 이벤트 리스너 설정
}

function onKeyDown(event: KeyboardEvent) {
  if (!boat) return;

  // 화살표 키에 따라 보트의 위치를 조정
  switch (event.key) {
    case "ArrowUp": // 위 화살표 (보트 앞쪽으로 이동)
      boat.position.z -= boatSpeed;
      break;
    case "ArrowDown": // 아래 화살표 (보트 뒤쪽으로 이동)
      boat.position.z += boatSpeed;
      break;
    case "ArrowLeft": // 왼쪽 화살표 (보트 왼쪽으로 이동)
      boat.position.x -= boatSpeed;
      break;
    case "ArrowRight": // 오른쪽 화살표 (보트 오른쪽으로 이동)
      boat.position.x += boatSpeed;
      break;
  }

  // 보트가 이동할 때마다 카메라 위치를 갱신
  // updateCameraPosition();
}

function updateCameraPosition() {
  if (!boat) return;

  // 카메라는 항상 보트의 뒤쪽에 위치하도록 설정
  boatTargetPosition.copy(boat.position).add(cameraOffset); // 카메라가 따라갈 목표 위치 계산
  camera.position.lerp(boatTargetPosition, 0.1); // 카메라를 부드럽게 이동시킴

  // 카메라는 항상 보트를 바라보도록 설정
  controls.target.copy(boat.position); // 카메라가 보트를 바라보게 설정
  controls.update(); // OrbitControls 업데이트
}

function animate() {
  render();
  requestAnimationFrame(animate);

  if (boat && avatar) {
    const boatPosition = boat.position;
    // const boatHeight = boat.scale.y / 2;

    avatar.position.x = boatPosition.x;
    avatar.position.z = boatPosition.z;
    avatar.position.y = boatPosition.y;
  }
}

function render() {
  const delta = clock.getDelta();
  const time = performance.now() * 0.001;

  if (boat) {
    boat.position.y = Math.sin(time) * 0.7 + 4;
  }

  if (avatarMixer) {
    avatarMixer.update(delta);
  }

  water.material.uniforms["time"].value += 1.0 / 90.0;

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
