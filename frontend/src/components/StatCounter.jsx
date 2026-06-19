import useCountUp from "../hooks/useCountUp"

export default function StatCounter({ value, suffix = "", label }) {
  const numericPart = parseInt(value, 10)
  const isNumeric = !isNaN(numericPart)
  const remaining = isNumeric ? value.replace(String(numericPart), "") : ""

  const [count, ref] = useCountUp(isNumeric ? numericPart : 0, 2000)

  return (
    <div ref={ref} className="text-center">
      <p className="font-heading text-5xl lg:text-7xl font-bold text-white">
        {isNumeric ? count : value}
        {remaining}
        {suffix}
      </p>
      <div className="amethyst-divider mx-auto mt-4 mb-4" />
      <p className="text-sm text-white/60 max-w-xs mx-auto">{label}</p>
    </div>
  )
}
