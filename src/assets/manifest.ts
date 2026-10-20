/**
 * 모든 이미지 경로를 한 곳에서 관리합니다.
 * 원본 PNG를 교체하거나 상위 단계 스쿱 스킨을 추가할 때는 public/assets/ 에 파일을 넣고
 * 이 파일의 경로만 바꾸면 됩니다. (빌드 시 public/ 은 그대로 복사되어 오프라인에서도 동작)
 */
const base = `${import.meta.env.BASE_URL}assets/`
const a = (p: string) => base + p

export const ASSETS = {
  bg: {
    start: a('bg/start_fantasy.webp'),
    gameplay: a('bg/gameplay.webp'),
    result: a('bg/result.webp'),
    checkout: a('bg/checkout.webp'),
  },
  brand: {
    cloudLogo: a('brand/br_cloud_logo.webp'),
    /** 구름 하단 'baskin robbins' 글자를 지운 버전 (시작 화면, Figma 반영) */
    cloudLogoClean: a('brand/br_cloud_logo_clean.webp'),
    gameTitle: a('brand/game_title.webp'),
    resultTitle: a('brand/result_title.webp'),
  },
  panels: {
    ribbon: a('panels/banner_ribbon_blank.webp'),
    card: a('panels/card_white_pink_blank.webp'),
    ticket: a('panels/coupon_ticket_blank.webp'),
    /** 쿠폰 적용 화면 말풍선 (사용자 제작 이미지, Figma 반영) */
    checkoutBubble: a('panels/checkout_bubble.webp'),
  },
  buttons: {
    circleWhite: a('buttons/btn_circle_white.webp'),
    primary: a('buttons/btn_primary_hot_pink.webp'),
    secondary: a('buttons/btn_secondary_pale_pink.webp'),
    share: a('buttons/btn_share_yellow.webp'),
    textStart: a('buttons/text_start_game.webp'),
    textDrop: a('buttons/text_drop_icecream.webp'),
    textUseCoupon: a('buttons/text_use_coupon.webp'),
    textCheckout: a('buttons/text_checkout.webp'),
    textPlayAgain: a('buttons/text_play_again.webp'),
    textHome: a('buttons/text_home.webp'),
  },
  gameplay: {
    container: a('gameplay/container.webp'),
  },
  scoops: {
    strawberry: a('scoops/stage_01_strawberry_scoop.webp'),
    mint: a('scoops/stage_02_mint_scoop.webp'),
    chocolate: a('scoops/stage_03_chocolate_scoop.webp'),
    cookiesCream: a('scoops/stage_04_cookies_cream_scoop.webp'),
    blue: a('scoops/stage_05_blue_scoop.webp'),
    pistachio: a('scoops/stage_06_pistachio_scoop.webp'),
  },
  illustrations: {
    coneMint: a('illustrations/icecream_cone_mint.webp'),
    coneStrawberry: a('illustrations/icecream_cone_strawberry.webp'),
    coneMango: a('illustrations/icecream_cone_mango.webp'),
    cupRainbow: a('illustrations/icecream_cup_rainbow.webp'),
    cupSundae: a('illustrations/icecream_cup_sundae.webp'),
  },
  icons: {
    back: a('icons/top_back.webp'),
    gift: a('icons/top_gift.webp'),
    settings: a('icons/top_settings.webp'),
    nextChange: a('icons/next_change_glyph.webp'),
    special: a('icons/special_glyph.webp'),
  },
} as const

/** 화면 진입 전에 미리 디코딩해 둘 이미지 */
export const PRELOAD: string[] = [
  ...Object.values(ASSETS.bg),
  ...Object.values(ASSETS.brand),
  ...Object.values(ASSETS.scoops),
  ASSETS.gameplay.container,
  ASSETS.buttons.primary,
  ASSETS.buttons.textDrop,
]
