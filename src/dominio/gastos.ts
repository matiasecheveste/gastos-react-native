/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 * Reglas de dominio puras (sin React): montos, validación y resúmenes mensuales.
 * Los montos se guardan en centésimos enteros para evitar errores de redondeo.
 */

export const CATEGORIAS = {
  comida: { etiqueta: 'Comida', color: '#ea580c' },
  transporte: { etiqueta: 'Transporte', color: '#2563eb' },
  hogar: { etiqueta: 'Hogar', color: '#16a34a' },
  salud: { etiqueta: 'Salud', color: '#dc2626' },
  ocio: { etiqueta: 'Ocio', color: '#9333ea' },
  otros: { etiqueta: 'Otros', color: '#64748b' },
} as const

export type Categoria = keyof typeof CATEGORIAS
export const LISTA_CATEGORIAS = Object.keys(CATEGORIAS) as Categoria[]

export interface Gasto {
  id: string
  centesimos: number
  categoria: Categoria
  /** Fecha local en formato AAAA-MM-DD. */
  fecha: string
  nota: string
}

const MAXIMO = 100_000_000 // $ 1.000.000,00

/**
 * Interpreta montos escritos como en Uruguay ("1.234,50") o con punto decimal ("1234.5").
 * Devuelve centésimos, o null si el texto no es un monto válido.
 */
export function parsearMonto(texto: string): number | null {
  let t = texto.trim().replace(/^\$\s*/, '').replace(/\s/g, '')
  if (!t) return null
  if (t.includes(',')) {
    // Coma decimal: los puntos son separadores de miles.
    if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(t)) return null
    t = t.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, '') // "1.500" son mil quinientos, no uno coma cinco
  } else if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    return null
  }
  const centesimos = Math.round(Number(t) * 100)
  return centesimos > 0 && centesimos <= MAXIMO ? centesimos : null
}

export function formatearPesos(centesimos: number): string {
  const signo = centesimos < 0 ? '-' : ''
  const abs = Math.abs(Math.round(centesimos))
  const enteros = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const decimales = (abs % 100).toString().padStart(2, '0')
  return `${signo}$ ${enteros},${decimales}`
}

export const fechaLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const mesDe = (fecha: string): string => fecha.slice(0, 7)

export function desplazarMes(mes: string, delta: number): string {
  const [a, m] = mes.split('-').map(Number)
  const total = a * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']

export function nombreMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number)
  return `${NOMBRES_MES[m - 1]} de ${a}`
}

export function diasDelMes(mes: string): number {
  const [a, m] = mes.split('-').map(Number)
  return new Date(a, m, 0).getDate()
}

export interface EntradaGasto {
  monto: string
  categoria: Categoria | null
  fecha: string
  nota: string
}

export type Errores = Partial<Record<keyof EntradaGasto, string>>

export function validarGasto(e: EntradaGasto, hoy: string): Errores {
  const errores: Errores = {}
  if (parsearMonto(e.monto) === null) errores.monto = 'Ingresá un monto mayor a cero (por ejemplo 1.250,50)'
  if (!e.categoria) errores.categoria = 'Elegí una categoría'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha) || Number.isNaN(Date.parse(e.fecha))) errores.fecha = 'Fecha no válida'
  else if (e.fecha > hoy) errores.fecha = 'No se pueden registrar gastos futuros'
  if (e.nota.length > 120) errores.nota = 'La nota admite hasta 120 caracteres'
  return errores
}

export interface ResumenCategoria {
  categoria: Categoria
  centesimos: number
  porcentaje: number
}

export interface Resumen {
  total: number
  cantidad: number
  promedioDiario: number
  porCategoria: ResumenCategoria[]
}

/**
 * Resumen de un mes. El promedio diario usa los días transcurridos si el mes es el actual,
 * y todos los días del mes si ya terminó.
 */
export function resumenDelMes(gastos: readonly Gasto[], mes: string, hoy: string): Resumen {
  const delMes = gastos.filter((g) => mesDe(g.fecha) === mes)
  const total = delMes.reduce((s, g) => s + g.centesimos, 0)
  const sumas = new Map<Categoria, number>()
  for (const g of delMes) sumas.set(g.categoria, (sumas.get(g.categoria) ?? 0) + g.centesimos)
  const porCategoria = [...sumas]
    .map(([categoria, centesimos]) => ({ categoria, centesimos, porcentaje: total ? Math.round((centesimos * 1000) / total) / 10 : 0 }))
    .sort((a, b) => b.centesimos - a.centesimos)
  const dias = mes === mesDe(hoy) ? Number(hoy.slice(8, 10)) : diasDelMes(mes)
  return { total, cantidad: delMes.length, promedioDiario: Math.round(total / dias), porCategoria }
}

export type NivelPresupuesto = 'sin-presupuesto' | 'bien' | 'atencion' | 'excedido'

export function estadoPresupuesto(total: number, presupuesto: number | null): { nivel: NivelPresupuesto; usado: number; restante: number } {
  if (!presupuesto) return { nivel: 'sin-presupuesto', usado: 0, restante: 0 }
  const usado = total / presupuesto
  const nivel: NivelPresupuesto = usado > 1 ? 'excedido' : usado >= 0.8 ? 'atencion' : 'bien'
  return { nivel, usado, restante: presupuesto - total }
}

/** Gastos de un mes, del más reciente al más antiguo. */
export const gastosDelMes = (gastos: readonly Gasto[], mes: string): Gasto[] =>
  gastos.filter((g) => mesDe(g.fecha) === mes).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id))
