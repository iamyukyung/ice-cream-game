/**
 * 게임 필드 기하 (모두 711 아트보드 단위).
 * 필드 = 드롭 영역 + 게임통. 아트보드 y=FIELD_TOP 부터 시작.
 * 게임통 이미지(container.webp, 1051x1042)의 투명 내부를 실측한 비율로 벽/바닥을 계산합니다.
 */
export const FIELD = {
  top: 330,
  width: 711,
  height: 845,
}

export const JAR = {
  x: 15,
  y: 165,
  w: 680,
  h: 674,
  // 이미지 기준 내부 비율
  innerLeftRatio: 0.057,
  innerRightRatio: 0.943,
  floorRatio: 0.8,
  dangerRatio: 0.155,
  /** 앞쪽 핑크 받침대가 스쿱 위로 겹쳐 보이도록 오버레이 시작 비율 */
  frontBandRatio: 0.815,
}

export const GEO = {
  width: FIELD.width,
  height: FIELD.height,
  left: JAR.x + JAR.w * JAR.innerLeftRatio,
  right: JAR.x + JAR.w * JAR.innerRightRatio,
  floor: JAR.y + JAR.h * JAR.floorRatio,
  dangerY: JAR.y + JAR.h * JAR.dangerRatio,
  spawnY: 70,
}
export type Geometry = typeof GEO
