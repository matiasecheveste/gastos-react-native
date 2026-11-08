/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 */
import {
  desplazarMes,
  estadoPresupuesto,
  formatearPesos,
  gastosDelMes,
  nombreMes,
  parsearMonto,
  resumenDelMes,
  validarGasto,
  type Gasto,
} from '../src/dominio/gastos'

describe('montos', () => {
  test.each([
    ['1.250,50', 125050],
    ['1250,5', 125050],
    ['1250.50', 125050],
    ['$ 980', 98000],
    ['1.500', 150000],
    ['0,99', 99],
  ])('parsea %p como %p centésimos', (texto, esperado) => {
    expect(parsearMonto(texto)).toBe(esperado)
  })

  test.each(['', 'abc', '0', '-50', '12,345', '1,2,3', '10000000,01'])('rechaza %p', (texto) => {
    expect(parsearMonto(texto)).toBeNull()
  })

  test('formatea en pesos uruguayos', () => {
    expect(formatearPesos(125050)).toBe('$ 1.250,50')
    expect(formatearPesos(5)).toBe('$ 0,05')
    expect(formatearPesos(123456789)).toBe('$ 1.234.567,89')
    expect(formatearPesos(-2000)).toBe('-$ 20,00')
  })
})

describe('meses', () => {
  test('desplaza entre años', () => {
    expect(desplazarMes('2026-01', -1)).toBe('2025-12')
    expect(desplazarMes('2026-12', 1)).toBe('2027-01')
    expect(desplazarMes('2026-11', -13)).toBe('2025-10')
  })

  test('nombra los meses en español del Uruguay', () => {
    expect(nombreMes('2026-09')).toBe('setiembre de 2026')
  })
})

describe('validarGasto', () => {
  const base = { monto: '100', categoria: 'comida' as const, fecha: '2026-11-07', nota: '' }

  test('acepta un gasto correcto', () => {
    expect(validarGasto(base, '2026-11-07')).toEqual({})
  })

  test('informa cada campo inválido', () => {
    const errores = validarGasto({ monto: '0', categoria: null, fecha: '2026-11-08', nota: 'x'.repeat(121) }, '2026-11-07')
    expect(Object.keys(errores).sort()).toEqual(['categoria', 'fecha', 'monto', 'nota'])
    expect(errores.fecha).toMatch(/futuros/)
  })
})

const gastos: Gasto[] = [
  { id: '1', centesimos: 60000, categoria: 'comida', fecha: '2026-11-02', nota: 'Feria' },
  { id: '2', centesimos: 15000, categoria: 'transporte', fecha: '2026-11-03', nota: 'STM' },
  { id: '3', centesimos: 25000, categoria: 'comida', fecha: '2026-11-05', nota: '' },
  { id: '4', centesimos: 90000, categoria: 'hogar', fecha: '2026-10-30', nota: 'UTE' },
]

describe('resumenDelMes', () => {
  test('suma, agrupa y ordena por categoría', () => {
    const r = resumenDelMes(gastos, '2026-11', '2026-11-05')
    expect(r.total).toBe(100000)
    expect(r.cantidad).toBe(3)
    expect(r.porCategoria).toEqual([
      { categoria: 'comida', centesimos: 85000, porcentaje: 85 },
      { categoria: 'transporte', centesimos: 15000, porcentaje: 15 },
    ])
  })

  test('el promedio diario usa los días transcurridos en el mes actual y todos en los anteriores', () => {
    expect(resumenDelMes(gastos, '2026-11', '2026-11-05').promedioDiario).toBe(20000)
    expect(resumenDelMes(gastos, '2026-10', '2026-11-05').promedioDiario).toBe(Math.round(90000 / 31))
  })

  test('un mes sin gastos da cero', () => {
    expect(resumenDelMes(gastos, '2026-09', '2026-11-05')).toEqual({ total: 0, cantidad: 0, promedioDiario: 0, porCategoria: [] })
  })

  test('lista los gastos del mes del más reciente al más antiguo', () => {
    expect(gastosDelMes(gastos, '2026-11').map((g) => g.id)).toEqual(['3', '2', '1'])
  })
})

test('estadoPresupuesto clasifica el avance', () => {
  expect(estadoPresupuesto(5000, null).nivel).toBe('sin-presupuesto')
  expect(estadoPresupuesto(5000, 10000)).toEqual({ nivel: 'bien', usado: 0.5, restante: 5000 })
  expect(estadoPresupuesto(8000, 10000).nivel).toBe('atencion')
  expect(estadoPresupuesto(12000, 10000)).toEqual({ nivel: 'excedido', usado: 1.2, restante: -2000 })
})
