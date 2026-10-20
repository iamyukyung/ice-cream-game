import Matter from 'matter-js'
import { GEO, type Geometry } from './geometry'
import { LEVELS, MAX_LEVEL, MAX_LEVEL_MERGES, levelHalfWidth, levelHeight, randomSpawnLevel, type ScoopLevel } from './levels'

const { Engine, Bodies, Body, Composite, Events, Vertices } = Matter

/** 물리 고정 스텝 (120Hz) — 프레임 드랍에도 일정한 시뮬레이션 */
const STEP_MS = 1000 / 120
const MAX_STEPS_PER_FRAME = 8
const MAX_SPEED = 22
const DROP_COOLDOWN_MS = 480
/** 드롭 직후에는 위험선 판정 제외 */
const DANGER_GRACE_MS = 1300
/** 위험선 위에 이 시간 이상 머물면 종료 */
export const GAME_OVER_MS = 2600
const GROW_FROM = 0.72
const GROW_STEPS = 9
const WALL = 400
const ELLIPSE_SEGMENTS = 18

export interface GameCallbacks {
  onScore?: (score: number, gained: number) => void
  onQueue?: (current: number, next: number) => void
  /** 0 = 안전, 0~1 = 위험선 누적 비율 */
  onDanger?: (ratio: number) => void
  onGameOver?: (score: number) => void
  onMerge?: (level: number) => void
}

interface ScoopPlugin {
  level: number
  bornAt: number
  merging: boolean
  /** 현재 크기 배율 (성장 애니메이션) */
  s: number
  /** 이미지 중심 - 질량중심 (각도 0, 배율 1 기준) */
  ox: number
  oy: number
}
type ScoopBody = Matter.Body & { plugin: ScoopPlugin }

interface Fx {
  kind: 'pop' | 'text'
  x: number
  y: number
  r: number
  t: number
  text?: string
}

/** 비율 좌표 파트 → 월드 좌표 볼록 꼭짓점 목록 (이미지 중심이 cx,cy) */
function partVertices(l: ScoopLevel, cx: number, cy: number, scale: number) {
  const w = l.width * scale
  const h = levelHeight(l) * scale
  const left = cx - w / 2
  const top = cy - h / 2
  return l.shape.map((p) => {
    if (p.kind === 'ellipse') {
      const pts: Matter.Vector[] = []
      for (let i = 0; i < ELLIPSE_SEGMENTS; i++) {
        const a = (i / ELLIPSE_SEGMENTS) * Math.PI * 2
        pts.push({ x: left + (p.cx + Math.cos(a) * p.rx) * w, y: top + (p.cy + Math.sin(a) * p.ry) * h })
      }
      return pts
    }
    return p.pts.map(([x, y]) => ({ x: left + x * w, y: top + y * h }))
  })
}

export class MergeGame {
  readonly geo: Geometry = GEO
  private engine: Matter.Engine
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private cb: GameCallbacks
  private images = new Map<string, HTMLImageElement>()
  private raf = 0
  private lastT = 0
  private acc = 0
  private simTime = 0
  private lastDropAt = -Infinity
  private dangerMs = 0
  private lastDangerReported = -1
  private mergeQueue: [ScoopBody, ScoopBody][] = []
  private fx: Fx[] = []
  private viewScale = 1
  private dpr = 1
  private ro?: ResizeObserver

  aimX: number
  current: number
  next: number
  score = 0
  state: 'playing' | 'over' = 'playing'
  paused = false
  /** E2E용: false면 병합하지 않음 */
  mergeEnabled = true
  rand: () => number

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks = {}, rand: () => number = Math.random) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d unavailable')
    this.ctx = ctx
    this.cb = cb
    this.rand = rand
    this.aimX = (this.geo.left + this.geo.right) / 2

    this.engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0011 },
      positionIterations: 10,
      velocityIterations: 8,
      enableSleeping: false,
    })
    this.buildWalls()
    Events.on(this.engine, 'collisionStart', this.onCollide)
    Events.on(this.engine, 'collisionActive', this.onCollide)

    for (const l of LEVELS) this.loadImage(l.src)

    this.current = randomSpawnLevel(this.rand)
    this.next = randomSpawnLevel(this.rand)

    this.resize()
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.cb.onQueue?.(this.current, this.next)
    this.cb.onScore?.(0, 0)
    this.raf = requestAnimationFrame(this.loop)
  }

  // ---------- setup ----------
  private buildWalls() {
    const { left, right, floor, height } = this.geo
    const opts = { isStatic: true, friction: 0.25, restitution: 0.2, label: 'wall' }
    const h = height + 2000
    const cy = floor - h / 2
    Composite.add(this.engine.world, [
      Bodies.rectangle(left - WALL / 2, cy, WALL, h, opts),
      Bodies.rectangle(right + WALL / 2, cy, WALL, h, opts),
      Bodies.rectangle((left + right) / 2, floor + WALL / 2, right - left + WALL * 2, WALL, opts),
    ])
  }

  private loadImage(src: string) {
    if (this.images.has(src)) return
    const img = new Image()
    img.decoding = 'async'
    img.src = src
    this.images.set(src, img)
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    if (!rect.width) return
    this.dpr = Math.min(window.devicePixelRatio || 1, 3)
    this.canvas.width = Math.round(rect.width * this.dpr)
    this.canvas.height = Math.round(rect.height * this.dpr)
    this.viewScale = rect.width / this.geo.width
  }

  // ---------- public API ----------
  setAim(x: number) {
    const hw = levelHalfWidth(LEVELS[this.current])
    this.aimX = Math.max(this.geo.left + hw + 1, Math.min(this.geo.right - hw - 1, x))
  }
  nudgeAim(dx: number) {
    this.setAim(this.aimX + dx)
  }

  canDrop() {
    return this.state === 'playing' && !this.paused && this.simTime - this.lastDropAt >= DROP_COOLDOWN_MS
  }

  drop(): boolean {
    if (!this.canDrop()) return false
    this.setAim(this.aimX)
    this.spawn(this.current, this.aimX, this.geo.spawnY, false)
    this.lastDropAt = this.simTime
    this.current = this.next
    this.next = randomSpawnLevel(this.rand)
    this.setAim(this.aimX)
    this.cb.onQueue?.(this.current, this.next)
    return true
  }

  /** 다음 체인지: 현재 스쿱을 NEXT로 교체하고 새 NEXT 뽑기 */
  changeCurrent() {
    if (this.state !== 'playing') return
    this.current = this.next
    this.next = randomSpawnLevel(this.rand)
    this.setAim(this.aimX)
    this.cb.onQueue?.(this.current, this.next)
  }

  /** 스페셜 아이템: 통 안의 가장 작은 두 단계를 모두 터뜨림 */
  bomb(): number {
    if (this.state !== 'playing') return 0
    const scoops = this.scoops()
    if (!scoops.length) return 0
    const levels = [...new Set(scoops.map((b) => b.plugin.level))].sort((a, b) => a - b).slice(0, 2)
    let n = 0
    for (const b of scoops) {
      if (levels.includes(b.plugin.level)) {
        this.fx.push({ kind: 'pop', x: b.position.x, y: b.position.y, r: LEVELS[b.plugin.level].width / 2, t: 0 })
        Composite.remove(this.engine.world, b)
        n++
      }
    }
    this.dangerMs = 0
    return n
  }

  setPaused(p: boolean) {
    this.paused = p
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.ro?.disconnect()
    Events.off(this.engine, 'collisionStart', this.onCollide)
    Events.off(this.engine, 'collisionActive', this.onCollide)
    Composite.clear(this.engine.world, false)
    Engine.clear(this.engine)
  }

  scoops(): ScoopBody[] {
    return Composite.allBodies(this.engine.world).filter((b) => b.label === 'scoop') as ScoopBody[]
  }

  /** E2E/디버그: 바디 요약 */
  snapshot() {
    return this.scoops().map((b) => ({
      level: b.plugin.level,
      x: b.position.x,
      y: b.position.y,
      minX: b.bounds.min.x,
      maxX: b.bounds.max.x,
      minY: b.bounds.min.y,
      maxY: b.bounds.max.y,
    }))
  }

  // ---------- debug hooks (E2E 전용) ----------
  debugSpawn(level: number, x: number, y = this.geo.spawnY) {
    this.spawn(Math.min(MAX_LEVEL, Math.max(0, level)), x, y, false)
  }
  debugAddScore(n: number) {
    this.addScore(n)
  }
  debugGameOver() {
    this.endGame()
  }

  // ---------- simulation ----------
  private spawn(level: number, x: number, y: number, grow: boolean): ScoopBody {
    const def = LEVELS[level]
    const s = grow ? GROW_FROM : 1
    const opts = {
      restitution: 0.12,
      friction: 0.12,
      frictionStatic: 0.5,
      frictionAir: 0.012,
      density: 0.0012,
      slop: 0.02,
    }
    const parts = partVertices(def, x, y, s).map((verts) => {
      const c = Vertices.centre(verts)
      return Bodies.fromVertices(c.x, c.y, [verts], opts)
    })
    const b = (parts.length === 1 ? parts[0] : Body.create({ ...opts, parts })) as ScoopBody
    b.label = 'scoop'
    b.plugin = {
      level,
      bornAt: this.simTime,
      merging: false,
      s,
      ox: (x - b.position.x) / s,
      oy: (y - b.position.y) / s,
    }
    if (def.family === 'scoop') Body.setAngle(b, (this.rand() - 0.5) * 0.6)
    Body.setVelocity(b, { x: 0, y: grow ? -1.2 : 1.5 })
    Composite.add(this.engine.world, b)
    return b
  }

  private onCollide = (e: Matter.IEventCollision<Matter.Engine>) => {
    if (!this.mergeEnabled) return
    for (const pair of e.pairs) {
      // 복합 바디(콘·컵)는 파트끼리 충돌하므로 부모로 올라감
      const a = pair.bodyA.parent as ScoopBody
      const b = pair.bodyB.parent as ScoopBody
      if (a === b || a.label !== 'scoop' || b.label !== 'scoop') continue
      // 더블 머지 보호: 이미 병합 예약된 바디는 다른 쌍에 참여하지 않음
      if (a.plugin.merging || b.plugin.merging) continue
      if (a.plugin.level !== b.plugin.level) continue
      if (a.plugin.level >= MAX_LEVEL && !MAX_LEVEL_MERGES) continue
      a.plugin.merging = true
      b.plugin.merging = true
      this.mergeQueue.push([a, b])
    }
  }

  private processMerges() {
    if (!this.mergeQueue.length) return
    const queue = this.mergeQueue
    this.mergeQueue = []
    for (const [a, b] of queue) {
      const level = a.plugin.level
      const x = (a.position.x + b.position.x) / 2
      const y = (a.position.y + b.position.y) / 2
      const va = Body.getVelocity(a)
      const vb = Body.getVelocity(b)
      Composite.remove(this.engine.world, a)
      Composite.remove(this.engine.world, b)
      this.fx.push({ kind: 'pop', x, y, r: LEVELS[level].width * 0.7, t: 0 })
      const nl = level + 1
      const nb = this.spawn(nl, x, y, true)
      Body.setVelocity(nb, { x: (va.x + vb.x) * 0.25, y: Math.min(0, (va.y + vb.y) * 0.25) - 0.8 })
      this.addScore(LEVELS[nl].mergeScore, x, y)
      this.cb.onMerge?.(nl)
    }
  }

  private addScore(n: number, x?: number, y?: number) {
    if (n <= 0 || this.state !== 'playing') return
    this.score += n
    if (x !== undefined && y !== undefined) this.fx.push({ kind: 'text', x, y, r: 0, t: 0, text: `+${n}` })
    this.cb.onScore?.(this.score, n)
  }

  /** 성장 애니메이션 + 속도 제한 + 벽 관통 방지(최후 안전장치) */
  private postStep() {
    const { left, right, floor } = this.geo
    for (const b of this.scoops()) {
      const p = b.plugin
      if (p.s < 1) {
        const ns = Math.min(1, p.s + (1 - GROW_FROM) / GROW_STEPS)
        Body.scale(b, ns / p.s, ns / p.s)
        p.s = ns
      }
      const v = Body.getVelocity(b)
      const sp = Math.hypot(v.x, v.y)
      if (sp > MAX_SPEED) Body.setVelocity(b, { x: (v.x / sp) * MAX_SPEED, y: (v.y / sp) * MAX_SPEED })
      let dx = 0
      let dy = 0
      if (b.bounds.min.x < left - 2) dx = left - b.bounds.min.x
      else if (b.bounds.max.x > right + 2) dx = right - b.bounds.max.x
      if (b.bounds.max.y > floor + 3) dy = floor - b.bounds.max.y
      if (dx || dy) {
        Body.translate(b, { x: dx, y: dy })
        Body.setVelocity(b, { x: dx ? v.x * -0.2 : v.x, y: dy ? Math.min(0, v.y) : v.y })
      }
    }
  }

  private checkDanger(ms: number) {
    const { dangerY } = this.geo
    let over = false
    for (const b of this.scoops()) {
      if (b.plugin.merging) continue
      if (this.simTime - b.plugin.bornAt < DANGER_GRACE_MS) continue
      if (b.bounds.min.y < dangerY) {
        over = true
        break
      }
    }
    this.dangerMs = over ? this.dangerMs + ms : Math.max(0, this.dangerMs - ms * 2)
    const ratio = Math.min(1, this.dangerMs / GAME_OVER_MS)
    const q = Math.round(ratio * 20) / 20
    if (q !== this.lastDangerReported) {
      this.lastDangerReported = q
      this.cb.onDanger?.(q)
    }
    if (this.dangerMs >= GAME_OVER_MS) this.endGame()
  }

  private endGame() {
    if (this.state === 'over') return
    this.state = 'over'
    this.cb.onDanger?.(1)
    this.cb.onGameOver?.(this.score)
  }

  private step() {
    Engine.update(this.engine, STEP_MS)
    this.simTime += STEP_MS
    this.processMerges()
    this.postStep()
    this.checkDanger(STEP_MS)
  }

  private loop = (t: number) => {
    const dt = this.lastT ? Math.min(100, t - this.lastT) : STEP_MS
    this.lastT = t
    if (this.state === 'playing' && !this.paused && !document.hidden) {
      this.acc += dt
      let n = 0
      while (this.acc >= STEP_MS && n < MAX_STEPS_PER_FRAME) {
        this.step()
        this.acc -= STEP_MS
        n++
      }
      if (n === MAX_STEPS_PER_FRAME) this.acc = 0
    }
    this.render(dt)
    this.raf = requestAnimationFrame(this.loop)
  }

  // ---------- rendering ----------
  /** (x,y) = 이미지 중심 기준으로 그리기 */
  private drawLevel(level: number, x: number, y: number, angle: number, scale: number, alpha = 1) {
    const def = LEVELS[level]
    const img = this.images.get(def.src)
    const ctx = this.ctx
    const w = def.width * scale
    const h = levelHeight(def) * scale
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)
    ctx.rotate(angle)
    if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -w / 2, -h / 2, w, h)
    else {
      ctx.fillStyle = '#ffc2dc'
      ctx.beginPath()
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private render(dt: number) {
    const ctx = this.ctx
    const s = this.viewScale * this.dpr
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(s, 0, 0, s, 0, 0)

    // 조준 가이드 + 현재 스쿱
    if (this.state === 'playing') {
      const ready = this.canDrop()
      const cur = LEVELS[this.current]
      const x = this.aimX
      const y = this.geo.spawnY
      const k = Math.min(1, (this.simTime - this.lastDropAt) / DROP_COOLDOWN_MS)
      ctx.fillStyle = 'rgba(247,36,134,0.85)'
      const start = y + Math.max(levelHeight(cur) / 2, 40) + 14
      const end = this.geo.dangerY - 46
      for (let yy = start; yy < end; yy += 17) {
        ctx.beginPath()
        ctx.arc(x, yy, 4.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.beginPath()
      ctx.moveTo(x - 20, end + 2)
      ctx.lineTo(x + 20, end + 2)
      ctx.lineTo(x, end + 24)
      ctx.closePath()
      ctx.fillStyle = 'rgba(247,36,134,0.9)'
      ctx.fill()
      ctx.lineCap = 'round'
      ctx.lineWidth = 9
      ctx.strokeStyle = 'rgba(247,36,134,0.9)'
      ctx.beginPath()
      ctx.moveTo(x, end - 14)
      ctx.lineTo(x, end + 6)
      ctx.stroke()
      const grow = ready ? 1 : 0.6 + 0.4 * k
      this.drawLevel(this.current, x, y, 0, grow, ready ? 1 : 0.4 + 0.6 * k)
    }

    for (const b of this.scoops()) {
      const p = b.plugin
      const c = Math.cos(b.angle)
      const sn = Math.sin(b.angle)
      const ox = p.ox * p.s
      const oy = p.oy * p.s
      this.drawLevel(p.level, b.position.x + ox * c - oy * sn, b.position.y + ox * sn + oy * c, b.angle, p.s)
    }

    // 이펙트
    const sec = dt / 1000
    this.fx = this.fx.filter((f) => (f.t += sec) < 0.6)
    for (const f of this.fx) {
      const q = f.t / 0.6
      if (f.kind === 'pop') {
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - q)})`
        ctx.lineWidth = 6 * (1 - q) + 1
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r * (0.6 + q * 0.6), 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(255,140,200,${0.6 * (1 - q)})`
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2
          const d = f.r * (0.7 + q * 0.8)
          ctx.beginPath()
          ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 5 * (1 - q) + 1, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (f.text) {
        ctx.font = `34px Jua, "Apple SD Gothic Neo", sans-serif`
        ctx.textAlign = 'center'
        ctx.lineWidth = 7
        ctx.strokeStyle = `rgba(255,255,255,${1 - q})`
        ctx.fillStyle = `rgba(247,36,134,${1 - q})`
        const ty = f.y - 20 - q * 50
        ctx.strokeText(f.text, f.x, ty)
        ctx.fillText(f.text, f.x, ty)
      }
    }
  }
}
