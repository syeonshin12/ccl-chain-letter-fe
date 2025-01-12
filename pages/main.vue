<template>
  <div class="main-wrapper">
    <div ref="container"></div>

    <div class="tool-wrapper">
      <button class="write" @click="openWriteLetterModal">글쓰기</button>
      <button class="dm">DM</button>
    </div>

    <write-letter-modal
      v-if="showWriteLetterModal"
      @close-write-modal="showWriteLetterModal = false"
    />
    <letter-modal
      v-if="showLetterModal"
      @close-letter-modal="showLetterModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // 경로 수정
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; // GLTFLoader 임포트

const container = ref<HTMLElement | null>(null);
let sun: THREE.Vector3;
let water: Water;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let mesh: THREE.Mesh;
let boat: THREE.Group;

onMounted(() => {
  init();
  animate();
});

onBeforeUnmount(() => {
  if (renderer) {
    renderer.dispose();
  }
});

function init() {
  if (!container.value) return;

  // WebGLRenderer 설정
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.value.appendChild(renderer.domElement); // ref로 참조한 container에 렌더러 추가

  // Scene 설정
  scene = new THREE.Scene();

  // Camera 설정
  camera = new THREE.PerspectiveCamera(
    // fov - 숫자가 낮으면 물체가 더 멀리 보임.
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(30, 30, 100);

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
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const loader = new GLTFLoader();

  // 보트 모델 로드
  loader.load(
    "/boat_two.glb",
    (gltf) => {
      boat = gltf.scene;
      boat.scale.set(8, 8, 8); // 보트 크기 조정 (필요 시 크기 변경)
      boat.position.set(0, 0, 0); // 보트의 초기 위치 설정

      boat.rotation.y = (Math.PI * 210) / 180;
      scene.add(boat); // 보트 씬에 추가
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
  skyUniforms["turbidity"].value = 2;
  // 하늘의 파란색 정도 - 클수록 하늘이 파랗고 선명
  skyUniforms["rayleigh"].value = 2;
  // 먼지에 의한 빛의 산란 정도 - 하늘의 색상이나 강도에 영향을 미친다
  skyUniforms["mieCoefficient"].value = 0.005;
  // 햇빛의 산란정도 - 하늘의 색상이나 햇빛이 어떻게 퍼지는지
  skyUniforms["mieDirectionalG"].value = 0.8;

  // elevation은 태양이 하늘에서 얼마나 높은지, azimuth는 태양이 얼마나 동쪽 또는 서쪽에 위치하는지
  // elevation은 0은 수평선, 90도는 정수리 위쪽
  // azimut는 -180도에서 180도까지의 범위를 가지며, -180은 서쪽, 0도는 남쪽, 180도는 동쪽
  const parameters = {
    elevation: 2,
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

  // 물리적 메쉬 추가 (예시로 박스)
  // const geometry = new THREE.BoxGeometry(30, 30, 30);
  // const material = new THREE.MeshStandardMaterial({ roughness: 0 });
  // mesh = new THREE.Mesh(geometry, material);
  // scene.add(mesh);

  // OrbitControls 설정 - 카메라를 마우스로 조작할 수 있게 해주는 컨트롤러
  //
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

// 여기부터 다시 이해------월요일

function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  const time = performance.now() * 0.001;

  // 메쉬 애니메이션
  // mesh.position.y = Math.sin(time) * 20 + 5;
  // mesh.rotation.x = time * 0.5;
  // mesh.rotation.z = time * 0.51;

  if (boat) {
    // boat.rotation.y = time * 0.5; // 보트가 회전하도록 애니메이션
    boat.position.y = Math.sin(time) * 2 - 2; // 보트가 물 위에서 물결처럼 움직이도록 설정
  }

  // 물 애니메이션
  water.material.uniforms["time"].value += 1.0 / 60.0;

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
