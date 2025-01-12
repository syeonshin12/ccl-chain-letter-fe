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
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Water } from "three/examples/jsm/objects/Water";

const container = ref<HTMLElement | null>(null);
let renderer, camera, scene, controls, water, sun, mesh;

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
      "textures/waternormals.jpg",
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

  // Skybox 설정
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  let renderTarget;

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
  const geometry = new THREE.BoxGeometry(30, 30, 30);
  const material = new THREE.MeshStandardMaterial({ roughness: 0 });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // OrbitControls 설정
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

function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  const time = performance.now() * 0.001;

  // 메쉬 애니메이션
  mesh.position.y = Math.sin(time) * 20 + 5;
  mesh.rotation.x = time * 0.5;
  mesh.rotation.z = time * 0.51;

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
