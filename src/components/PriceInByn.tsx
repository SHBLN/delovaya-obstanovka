import { BynSymbol } from './BynSymbol'

type PriceInBynProps = {
  price: number
  className?: string
  symbolClassName?: string
}

function formatPriceAmount(price: number) {
  return new Intl.NumberFormat('ru-BY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function PriceInByn({ price, className = '', symbolClassName }: PriceInBynProps) {
  return (
    <span className={`inline-block whitespace-nowrap tabular-nums leading-none ${className}`}>
      <span className="align-middle leading-none">{formatPriceAmount(price)}</span>
      <BynSymbol
        className={
          symbolClassName ??
          'ml-1 inline-block h-[0.62em] w-[0.62em] align-middle sm:h-[0.64em] sm:w-[0.64em]'
        }
      />
      <span className="sr-only"> белорусских рублей</span>
    </span>
  )
}
