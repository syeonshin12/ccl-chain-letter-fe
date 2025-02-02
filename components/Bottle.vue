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
let clock: THREE.Clock; // 애니메이션 타이머

// 모델 로드 후 병 추가
onMounted(() => {
  const loader = new GLTFLoader();
  clock = new THREE.Clock(); // Clock 생성

  loader.load(
    "/message_bottle.glb",
    (gltf) => {
      bottleModel = gltf.scene;

      // 병의 위치와 크기 설정
      bottleModel.position.set(
        props.position.x,
        props.position.y - 1, // y 값을 더 낮춰서 병을 더 잠기게
        props.position.z
      );
      bottleModel.scale.set(0.07, 0.07, 0.07);

      // 초기 기울기 설정
      bottleModel.rotation.set(
        THREE.MathUtils.degToRad(35), // X축 기울기 (35도)
        THREE.MathUtils.degToRad(0), // Y축 회전 없음
        THREE.MathUtils.degToRad(20) // Z축 기울기 (20도)
      );

      // 부모 Scene에 병 추가
      props.scene.add(bottleModel);

      // 클릭 이벤트를 처리할 수 있도록 raycaster 설정
      window.addEventListener("click", onClick);

      // 애니메이션 루프 시작
      animate();
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

// 애니메이션 함수
function animate() {
  if (!bottleModel) return;

  const elapsedTime = clock.getElapsedTime(); // 경과 시간

  // 병의 출렁이는 효과
  bottleModel.rotation.x =
    THREE.MathUtils.degToRad(35) + Math.sin(elapsedTime * 2) * 0.1; // X축 출렁임
  bottleModel.rotation.z =
    THREE.MathUtils.degToRad(20) + Math.cos(elapsedTime * 2) * 0.1; // Z축 출렁임

  requestAnimationFrame(animate); // 애니메이션 루프
}

// 컴포넌트가 언마운트될 때 이벤트 리스너 제거
onBeforeUnmount(() => {
  window.removeEventListener("click", onClick);
});
</script>
