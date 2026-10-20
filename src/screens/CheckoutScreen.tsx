import { useState } from 'react'
import { ASSETS } from '../assets/manifest'
import { Dialog, FooterNote, IconButton, ImgButton } from '../components/ui'
import { box, fmt, won } from '../lib/format'
import { couponDiscount, type Reward } from '../lib/rewards'
import { PRODUCT } from '../lib/product'
import './checkout.css'

const MAX_QTY = 9

interface Props {
  coupon: Reward | null
  onBack: () => void
  onHome: () => void
}

export function CheckoutScreen({ coupon, onBack, onHome }: Props) {
  const [optionId, setOptionId] = useState(PRODUCT.options[0].id)
  const [qty, setQty] = useState(1)
  const [modal, setModal] = useState<null | 'confirm' | 'done'>(null)
  const option = PRODUCT.options.find((o) => o.id === optionId) ?? PRODUCT.options[0]
  const subtotal = option.price * qty
  const discount = couponDiscount(subtotal, coupon)
  const total = subtotal - discount

  return (
    <section className="screen checkout" aria-label="쿠폰 적용 및 상품 선택">
      <IconButton kind="back" label="결과 화면으로" x={30} y={18} size={64} onClick={onBack} />
      <IconButton kind="home" label="홈으로" x={616} y={18} size={64} onClick={onHome} />
      {/* Figma: 로고·타이틀 제거, 큰 구름 말풍선 (24,112,653x261 영역) */}
      <h1 className="co-bubble display" style={box(122, 148, 466, 184)}>
        <span className="co-bubble__l1">획득한 쿠폰으로</span>
        <span className="co-bubble__l2">더 달콤하게 즐겨보세요!</span>
      </h1>
      <div className="co-bubble__deco" aria-hidden="true">
        <Heart x={66} y={140} s={72} rotate={-14} />
        <Sprinkle x={48} y={228} w={56} color="#3f86f2" rotate={32} />
        <Sprinkle x={598} y={168} w={52} color="#3f86f2" rotate={-38} />
        <Sprinkle x={604} y={226} w={54} color="#ff4fa3" rotate={-22} />
      </div>

      {/* 상품 카드 (선택됨) */}
      <div className="co-card glass-card co-product" style={box(24, 380, 663, 404)} role="group" aria-labelledby="product-name" data-selected="true">
        <img className="co-product__img" src={ASSETS.illustrations.cupSundae} alt="사랑에 빠진 딸기 아이스크림 컵" style={box(22, -50, 322)} />
        <h2 id="product-name" className="co-product__name display" style={box(372, 40, 280)}>
          {PRODUCT.name}
        </h2>
        <p className="co-product__desc" style={box(372, 96, 280)}>
          {PRODUCT.desc[0]}
          <br />
          {PRODUCT.desc[1]}
        </p>
        <label className="co-select" style={box(368, 174, 276, 58)}>
          <span className="sr-only">옵션 선택</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14l-2 13H7Z" fill="#ff7cba" />
            <path d="M4 7h16" stroke="#f72486" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span className="co-select__text">
            {option.label} <small>({option.weight})</small>
          </span>
          <svg className="co-select__chev" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" fill="none" stroke="#f72486" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <select value={optionId} onChange={(e) => setOptionId(e.target.value)} data-testid="option">
            {PRODUCT.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} ({o.weight}) · {won(o.price)}
              </option>
            ))}
          </select>
        </label>
        <div className="co-qty" style={box(368, 242, 276, 64)} role="group" aria-label="수량">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="수량 줄이기">
            −
          </button>
          <output aria-live="polite" data-testid="qty">
            {qty}
          </output>
          <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="수량 늘리기">
            +
          </button>
        </div>
        <p className="co-product__price display" style={box(368, 316, 276)} data-testid="line-price">
          {won(subtotal)}
        </p>
      </div>

      {/* 쿠폰 적용 상태 */}
      <div className="co-card glass-card co-coupon" style={box(24, 805, 663, 168)}>
        <div className="co-ticket" style={box(18, 22, 318, 122)} data-empty={!coupon}>
          <img src={ASSETS.panels.ticket} alt="" className="co-ticket__bg" />
          <span className="co-ticket__text display">
            {coupon ? (
              <>
                <b>{fmt(coupon.discount)}원</b>
                할인쿠폰
              </>
            ) : (
              <>
                <b>쿠폰 없음</b>
                미획득
              </>
            )}
          </span>
        </div>
        <div className="co-coupon__status" style={box(354, 26, 296)}>
          <p className="co-coupon__title display">
            <span className="co-coupon__check" data-on={!!coupon} aria-hidden="true">
              {coupon ? '✓' : '!'}
            </span>
            {coupon ? '쿠폰 적용 완료!' : '적용할 쿠폰이 없어요'}
          </p>
          <p className="co-coupon__desc">
            {coupon ? (
              <>
                아이스크림 게임에서 획득한
                <br />
                쿠폰이 적용되었습니다.
              </>
            ) : (
              <>
                게임에서 500점 이상 달성하면
                <br />
                할인 쿠폰이 자동 발급돼요.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 금액 */}
      <div className="co-card glass-card co-sum" style={box(24, 994, 663, 212)}>
        <dl>
          <div className="co-sum__row" style={box(46, 18, 572)}>
            <dt>상품가</dt>
            <dd className="display" data-testid="subtotal">
              {won(subtotal)}
            </dd>
          </div>
          <div className="co-sum__row co-sum__row--pink" style={box(46, 78, 572)}>
            <dt>
              쿠폰 할인 <small>(아이스크림 게임)</small>
            </dt>
            <dd className="display" data-testid="discount">
              - {won(discount)}
            </dd>
          </div>
          <div className="co-sum__total" style={box(20, 128, 623, 70)}>
            <dt className="display">최종 결제 금액</dt>
            <dd className="display" data-testid="total">
              {won(total)}
            </dd>
          </div>
        </dl>
      </div>

      <ImgButton
        label={`${won(total)} 결제하기 (데모)`}
        bg={ASSETS.buttons.primary}
        textSrc={ASSETS.buttons.textCheckout}
        textWidth={40}
        x={58}
        y={1257}
        w={596}
        h={120}
        onClick={() => setModal('confirm')}
        testId="pay-btn"
      />
      <FooterNote />

      <Dialog open={modal === 'confirm'} onClose={() => setModal(null)} labelledBy="dlg-pay">
        <span className="dialog__badge">DEMO</span>
        <h2 className="dialog__title" id="dlg-pay">
          모의 결제 확인
        </h2>
        <p className="dialog__desc">실제 결제는 진행되지 않습니다. 포트폴리오 시연용 화면이에요.</p>
        <div className="dialog__rows">
          <div>
            <span>
              {PRODUCT.name} · {option.label} × {qty}
            </span>
            <span>{won(subtotal)}</span>
          </div>
          <div style={{ color: 'var(--pink)' }}>
            <span>쿠폰 할인</span>
            <span>- {won(discount)}</span>
          </div>
          <div>
            <span>최종 결제 금액</span>
            <span data-testid="modal-total">{won(total)}</span>
          </div>
        </div>
        <div className="dialog__actions">
          <button type="button" className="dialog__btn dialog__btn--ghost" onClick={() => setModal(null)}>
            취소
          </button>
          <button type="button" className="dialog__btn dialog__btn--primary" onClick={() => setModal('done')} data-testid="confirm-pay">
            모의 결제하기
          </button>
        </div>
      </Dialog>
      <Dialog open={modal === 'done'} onClose={() => setModal(null)} labelledBy="dlg-done">
        <span className="dialog__badge">DEMO</span>
        <h2 className="dialog__title" id="dlg-done">
          주문이 완료됐어요 (데모)
        </h2>
        <p className="dialog__desc">모의 결제 {won(total)}가 처리된 것으로 표시만 됩니다. 실제 주문·결제·쿠폰 사용은 일어나지 않아요.</p>
        <div className="dialog__actions">
          <button type="button" className="dialog__btn dialog__btn--ghost" onClick={() => setModal(null)}>
            닫기
          </button>
          <button type="button" className="dialog__btn dialog__btn--primary" onClick={onHome} data-testid="done-home">
            홈으로
          </button>
        </div>
      </Dialog>
    </section>
  )
}

function Heart({ x, y, s, rotate = 0 }: { x: number; y: number; s: number; rotate?: number }) {
  return (
    <svg style={{ ...box(x, y, s, s), rotate: `${rotate}deg` }} viewBox="0 0 24 24" aria-hidden="true" className="co-heart">
      <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11Z" fill="#ff5aa9" stroke="#fff" strokeWidth="1.6" />
    </svg>
  )
}

function Sprinkle({ x, y, w, color, rotate }: { x: number; y: number; w: number; color: string; rotate: number }) {
  return (
    <span
      className="co-sprinkle"
      style={{ ...box(x, y, w, w * 0.4), background: `linear-gradient(180deg, color-mix(in srgb, ${color} 60%, #fff), ${color})`, rotate: `${rotate}deg` }}
    />
  )
}
