// components/SeaAnimation.vue
<template>
  <div ref="sceneContainer" style="width: 100%; height: 100%"></div>
</template>

<script>
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";

export default {
  mounted() {
    const container = this.$refs.sceneContainer;

    // Scene, Camera, Renderer 세팅
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.offsetWidth / container.offsetHeight,
      1,
      20000
    );
    camera.position.set(30, 30, 100);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    // 바다 추가
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "https://threejs.org/examples/textures/waternormals.jpg",
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

    // 하늘 추가
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    // 애니메이션 루프
    function animate() {
      requestAnimationFrame(animate);
      water.material.uniforms["time"].value += 1.0 / 60.0; // 물결 애니메이션
      renderer.render(scene, camera);
    }
    animate();
  },
};
</script>

<style scoped>
/* 필요하면 스타일 조정 */
</style>
