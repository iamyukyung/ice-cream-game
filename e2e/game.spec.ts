import { expect, test, type Page } from '@playwright/test'

const SAFE = { 'iphone-15': { top: 59, bottom: 34 }, 'iphone-se': { top: 20, bottom: 0 } } as const

async function open(page: Page, project: string) {
  const s = SAFE[project as keyof typeof SAFE] ?? { top: 0, bottom: 0 }
  await page.addInitScript((s) => {
    localStorage.clear()
    const st = document.createElement('style')
    st.textContent = `:root{--sat:${s.top}px!important;--sab:${s.bottom}px!important}`
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(st))
  }, s)
  await page.goto('/?debug=1')
  return s
}

async function startGame(page: Page) {
  await page.getByRole('button', { name: '게임 시작하기' }).click()
  await page.waitForFunction(() => !!window.__ICG__?.game)
}

const scoops = (page: Page) => page.evaluate(() => window.__ICG__!.game!.snapshot())

/** 화면의 모든 버튼이 safe area 안에 있는지 */
async function expectButtonsInsideSafeArea(page: Page, safe: { top: number; bottom: number }) {
  const vp = page.viewportSize()!
  const rects = await page.$$eval('.artboard button', (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect()
      return { name: e.getAttribute('aria-label') || e.textContent?.trim(), top: r.top, bottom: r.bottom, left: r.left, right: r.right }
    }),
  )
  expect(rects.length).toBeGreaterThan(0)
  for (const r of rects) {
    expect(r.top, `${r.name} top`).toBeGreaterThanOrEqual(safe.top - 0.5)
    expect(r.bottom, `${r.name} bottom`).toBeLessThanOrEqual(vp.height - safe.bottom + 0.5)
    expect(r.left, `${r.name} left`).toBeGreaterThanOrEqual(-0.5)
    expect(r.right, `${r.name} right`).toBeLessThanOrEqual(vp.width + 0.5)
  }
}

test('4화면 완주: 홈 → 플레이 → 결과(1,280점=3,000원) → 쿠폰 적용 → 모의 결제', async ({ page }, info) => {
  const safe = await open(page, info.project.name)
  await expect(page.getByRole('img', { name: 'Ice Cream Game' })).toBeVisible()
  await expectButtonsInsideSafeArea(page, safe)

  await startGame(page)
  await expectButtonsInsideSafeArea(page, safe)
  // 실제 드롭 몇 번
  for (let i = 0; i < 4; i++) {
    await page.getByTestId('drop-btn').click()
    await page.waitForTimeout(550)
  }
  expect((await scoops(page)).length).toBeGreaterThan(0)

  await page.evaluate(() => {
    const g = window.__ICG__!.game!
    g.debugAddScore(1280 - g.score)
    g.debugGameOver()
  })
  await expect(page.getByTestId('final-score')).toContainText('1,280', { timeout: 5000 })
  await expect(page.getByTestId('coupon-amount')).toHaveText('3,000원')
  await expectButtonsInsideSafeArea(page, safe)

  await page.getByRole('button', { name: '쿠폰 사용하기' }).click()
  await expect(page.getByTestId('subtotal')).toHaveText('₩ 3,700')
  await expect(page.getByTestId('discount')).toHaveText('- ₩ 3,000')
  await expect(page.getByTestId('total')).toHaveText('₩ 700')
  await expectButtonsInsideSafeArea(page, safe)

  await page.getByRole('button', { name: '수량 늘리기' }).click()
  await expect(page.getByTestId('total')).toHaveText('₩ 4,400')
  await page.getByTestId('option').selectOption('single-king')
  await expect(page.getByTestId('subtotal')).toHaveText('₩ 9,400')
  await expect(page.getByTestId('total')).toHaveText('₩ 6,400')
  await page.getByRole('button', { name: '수량 줄이기' }).click()
  await page.getByTestId('option').selectOption('single-regular')

  await page.getByTestId('pay-btn').click()
  const dlg = page.getByRole('dialog', { name: '모의 결제 확인' })
  await expect(dlg).toBeVisible()
  await expect(dlg.getByText('실제 결제는 진행되지 않습니다', { exact: false })).toBeVisible()
  await expect(page.getByTestId('modal-total')).toHaveText('₩ 700')
  await page.getByTestId('confirm-pay').click()
  await expect(page.getByRole('dialog', { name: /주문이 완료/ })).toBeVisible()
  await page.getByTestId('done-home').click()
  await expect(page.getByRole('button', { name: '게임 시작하기' })).toBeVisible()
})

test('같은 단계 2개 → 상위 1개로 병합 + 점수', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page)
  await page.evaluate(() => {
    const g = window.__ICG__!.game!
    g.debugSpawn(0, 300, 600)
    g.debugSpawn(0, 302, 470)
  })
  await page.waitForTimeout(2000)
  const s = await scoops(page)
  expect(s).toHaveLength(1)
  expect(s[0].level).toBe(1)
  await expect(page.getByTestId('score')).toContainText('8')
})

test('더블 머지 보호: 같은 단계 3개 동시 접촉 → 상위 1개 + 남은 1개', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page)
  await page.evaluate(() => {
    const g = window.__ICG__!.game!
    // 세 개가 거의 동시에 서로 닿도록 배치
    g.debugSpawn(1, 300, 640)
    g.debugSpawn(1, 410, 640)
    g.debugSpawn(1, 355, 545)
  })
  await page.waitForTimeout(2500)
  const s = (await scoops(page)).map((b) => b.level).sort()
  expect(s).toEqual([1, 2])
  await expect(page.getByTestId('score')).toContainText('15')
})

test('벽/바닥 관통 없음: 빠르게 많이 떨어뜨려도 통 안에 머묾', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page)
  const geo = await page.evaluate(() => window.__ICG__!.game!.geo)
  await page.evaluate(() => {
    const g = window.__ICG__!.game!
    const xs = [60, 650, 80, 630, 355, 70, 640]
    for (let i = 0; i < 18; i++) g.debugSpawn(i % 4, xs[i % xs.length], -200 - i * 30)
  })
  for (let t = 0; t < 6; t++) {
    await page.waitForTimeout(500)
    for (const b of await scoops(page)) {
      expect(b.minX).toBeGreaterThanOrEqual(geo.left - 3)
      expect(b.maxX).toBeLessThanOrEqual(geo.right + 3)
      expect(b.maxY).toBeLessThanOrEqual(geo.floor + 4)
    }
  }
})

test('터치 탭/드래그로 조준 후 손을 떼면 드롭', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page)
  const field = page.getByTestId('field')
  const box = (await field.boundingBox())!
  // 마우스 드래그: 왼쪽에서 눌러 오른쪽으로 끌고 놓기
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5, { steps: 6 })
  const aim = await page.evaluate(() => window.__ICG__!.game!.aimX)
  expect(aim).toBeGreaterThan(711 * 0.6)
  await page.mouse.up()
  await page.waitForTimeout(150)
  let s = await scoops(page)
  expect(s).toHaveLength(1)
  expect(s[0].x).toBeGreaterThan(711 * 0.6)
  // 터치 탭
  await page.waitForTimeout(600)
  await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height * 0.5)
  await page.waitForTimeout(150)
  s = await scoops(page)
  expect(s).toHaveLength(2)
  // 키보드
  await field.focus()
  await page.waitForTimeout(600)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Space')
  await page.waitForTimeout(150)
  expect(await scoops(page)).toHaveLength(3)
})

test('리워드 임계치 직전/직후 HUD 승급', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page)
  const setScore = (n: number) =>
    page.evaluate((n) => {
      const g = window.__ICG__!.game!
      g.debugAddScore(n - g.score)
    }, n)
  const cases: [number, string, string][] = [
    [499, '아직 없어요', '1점'],
    [500, '2,000원', '500점'],
    [999, '2,000원', '1점'],
    [1000, '3,000원', '500점'],
    [1499, '3,000원', '1점'],
    [1500, '5,000원', '달성 완료!'],
  ]
  for (const [score, reward, remaining] of cases) {
    await setScore(score)
    await expect(page.getByTestId('current-reward')).toContainText(reward)
    await expect(page.getByTestId('remaining')).toHaveText(remaining)
  }
})

test('위험선 위에 쌓이면 자동 종료 → 500점 미달 쿠폰 미획득', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page)
  await page.evaluate(() => {
    const g = window.__ICG__!.game!
    // 병합을 끄고 큰 단계를 쌓아 반드시 위험선을 넘김
    g.mergeEnabled = false
    const lv = [9, 9, 8, 8, 7, 7, 6, 6]
    lv.forEach((l, i) => g.debugSpawn(l, 200 + (i % 3) * 150, -300 - i * 280))
  })
  await expect(page.getByText('게임 종료!')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('coupon-empty')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('쿠폰 미획득')).toBeVisible()
  await expect(page.getByRole('button', { name: '쿠폰 사용하기' })).toHaveCount(0)
})

test('공유 보상은 최대 1회 (연타해도 +1)', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page) // 3 → 2
  await page.evaluate(() => window.__ICG__!.game!.debugGameOver())
  await expect(page.getByTestId('plays-left')).toHaveText('(2/3)', { timeout: 5000 })
  const share = page.getByTestId('share-btn')
  // 같은 프레임 안에서 3연타 (비활성화 렌더 전에 들어오는 중복 클릭)
  await share.evaluate((el: HTMLButtonElement) => {
    el.click()
    el.click()
    el.click()
  })
  await expect(page.getByTestId('plays-left')).toHaveText('(3/4)')
  await expect(share).toBeDisabled()
  await share.dispatchEvent('click')
  await share.evaluate((el: HTMLButtonElement) => el.click())
  await page.waitForTimeout(300)
  await expect(page.getByTestId('plays-left')).toHaveText('(3/4)')

  // 다시 플레이 → 결과 → 여전히 공유 불가, 기회 감소만
  await page.getByTestId('replay-btn').click()
  await page.waitForFunction(() => !!window.__ICG__?.game)
  await page.evaluate(() => window.__ICG__!.game!.debugGameOver())
  await expect(page.getByTestId('plays-left')).toHaveText('(2/4)', { timeout: 5000 })
  await expect(page.getByTestId('share-btn')).toBeDisabled()
})

test('최고 단계(선데 컵)끼리는 합쳐지지 않고 남음', async ({ page }, info) => {
  await open(page, info.project.name)
  await startGame(page)
  await page.evaluate(() => {
    const g = window.__ICG__!.game!
    g.debugSpawn(9, 200, 560)
    g.debugSpawn(9, 470, 560)
  })
  await page.waitForTimeout(2500)
  expect((await scoops(page)).map((b) => b.level)).toEqual([9, 9])
  await expect(page.getByTestId('score')).toContainText('0')
})
