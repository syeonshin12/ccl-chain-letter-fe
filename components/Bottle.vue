// Bottle.vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// 부모로부터 전달된 props
const props = defineProps<{
  scene: THREE.Scene; // 부모로부터 전달된 Scene
  position: { x: number; y: number; z: number }; // 병의 위치
  onClick: () => void; // 클릭 시 부모에서 정의한 이벤트 핸들러
  camera: THREE.PerspectiveCamera; // 부모로부터 전달된 카메라
}>();

let bottleModel: THREE.Object3D | null = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// 모델 로드 후 병 추가
onMounted(() => {
  const loader = new GLTFLoader();
  loader.load(
    "/message_bottle.glb",
    (gltf) => {
      bottleModel = gltf.scene;

      // 병의 위치와 크기 설정
      bottleModel.position.set(
        props.position.x,
        props.position.y,
        props.position.z
      );
      bottleModel.scale.set(0.04, 0.04, 0.04);

      // 부모 Scene에 병 추가
      props.scene.add(bottleModel);

      // 클릭 이벤트를 처리할 수 있도록 raycaster 설정
      window.addEventListener("click", onClick);
    },
    undefined,
    (error) => {
      console.error("Bottle model load failed:", error);
    }
  );
});

// 클릭 이벤트 핸들러
function onClick(event: MouseEvent) {
  // 마우스 좌표를 -1 ~ 1 사이로 정규화
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // raycaster로 3D 객체를 클릭했는지 확인
  if (!bottleModel) return;

  // Raycaster로 화면에서 클릭한 지점의 3D 객체를 찾기
  raycaster.setFromCamera(mouse, props.camera); // 카메라 전달

  // 교차 검사
  const intersects = raycaster.intersectObject(bottleModel);

  if (intersects.length > 0) {
    // 병을 클릭한 경우
    props.onClick(); // 부모에서 전달된 클릭 핸들러 실행
  }
}

// 컴포넌트가 언마운트될 때 이벤트 리스너 제거
onBeforeUnmount(() => {
  window.removeEventListener("click", onClick);
});
</script>
