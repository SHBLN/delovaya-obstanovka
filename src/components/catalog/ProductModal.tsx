import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { PriceInByn } from '../PriceInByn'
import { type Product, WARRANTY } from '../../data/products'
import { PHONE_LINK } from '../../data/contacts'
import { MessengerLinks } from '../contacts/MessengerLinks'

const FOCUSABLE = 'a[href], button:not([disabled]):not([tabindex="-1"])'

export function ProductModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const [activeImage, setActiveImage] = useState(product.images[0])
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Esc закрывает окно, страница под ним не прокручивается, фокус возвращается на кнопку «Подробнее».
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', closeOnEscape)

    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
    }
  }, [])

  // Tab/Shift+Tab не выводят фокус за пределы окна.
  const keepFocusInside = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !overlayRef.current) return
    const items = Array.from(overlayRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || !overlayRef.current.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !overlayRef.current.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  // Второй клик двойного клика по «Подробнее» попадает на затемнение — он не должен закрывать окно.
  const closeOnBackdrop = (event: ReactMouseEvent) => {
    if (event.detail > 1) return
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onKeyDown={keepFocusInside}
      data-testid="product-modal"
      className="fixed inset-0 z-[120] modal-overlay bg-[#1f1c19]/60 px-4 py-6 sm:px-6 md:py-10"
    >
      <div className="mx-auto flex h-full max-w-6xl items-end justify-center md:items-center">
        <div className="modal-panel max-h-[92vh] w-full overflow-hidden rounded-3xl bg-[#fffdf9] shadow-hero">
          <div className="flex items-start justify-between gap-4 border-b border-navy/10 px-4 py-4 sm:px-6 sm:py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy/55 sm:text-sm">{product.sku}</p>
              <h3 id="product-modal-title" className="mt-1 text-2xl font-semibold text-navy sm:text-3xl">{product.name}</h3>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy/70 transition-soft hover:border-navy/40 hover:text-navy"
            >
              Закрыть
            </button>
          </div>

          <div className="max-h-[calc(92vh-5.5rem)] overflow-y-auto lg:max-h-[calc(92vh-6rem)]">
            <div className="grid lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
              <div className="border-b border-navy/10 bg-gradient-to-br from-[#f7f2ea] via-[#fffdf9] to-[#efe5d6] px-3 py-4 sm:px-5 sm:py-6 lg:border-b-0 lg:border-r">
                <div className="flex min-h-[min(52vh,440px)] items-center justify-center sm:min-h-[480px] lg:min-h-[520px]">
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="max-h-[min(480px,58vh)] w-full object-contain sm:max-h-[min(520px,62vh)] lg:max-h-[540px]"
                    loading="lazy"
                  />
                </div>
                {product.images.length > 1 ? (
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {product.images.map((image) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(image)}
                        className={`overflow-hidden rounded-xl border transition-soft ${
                          activeImage === image ? 'border-accent shadow-button/30' : 'border-navy/15 hover:border-navy/35'
                        }`}
                      >
                        <div className="flex aspect-square items-center justify-center bg-white/70 p-1">
                          <img
                            src={image}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col p-4 sm:p-6 lg:p-7">
                <PriceInByn price={product.price} className="text-3xl font-bold text-navy sm:text-4xl" />
                <p className="mt-4 text-sm leading-relaxed text-navy/75 sm:text-base">{product.description}</p>

              <dl className="mt-5 space-y-2 rounded-2xl border border-navy/10 bg-white p-4 text-sm text-navy/80">
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-semibold text-navy/65">Каркас</dt>
                  <dd>{product.frame}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-semibold text-navy/65">Обивка</dt>
                  <dd>{product.upholstery}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-semibold text-navy/65">Цвета</dt>
                  <dd>{product.colors.join(', ')}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-semibold text-navy/65">Нагрузка</dt>
                  <dd>{product.load}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-semibold text-navy/65">Гарантия</dt>
                  <dd>{WARRANTY}</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/10 p-4">
                <p className="text-sm font-semibold text-navy">{product.stock}</p>
                <p className="mt-2 text-sm leading-relaxed text-navy/75">
                  Заинтересовала эта модель? Позвоните менеджеру — он уточнит наличие и поможет оформить заказ.
                </p>
                <p className="mt-2 text-xs text-navy/60">
                  При звонке назовите модель или артикул: {product.sku}
                </p>
                <a
                  href={PHONE_LINK}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-button transition-soft hover:bg-accent-dark"
                >
                  Позвонить менеджеру
                </a>
                <p className="mt-4 text-xs font-semibold text-navy/60">Или напишите нам в мессенджер:</p>
                <MessengerLinks className="mt-2 flex-wrap gap-2" iconClassName="h-7 w-7 rounded-lg" withLabels />
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Закрыть карточку товара"
        className="absolute inset-0 -z-10"
        onClick={closeOnBackdrop}
      />
    </div>
  )
}
