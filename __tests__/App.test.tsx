/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import App from '../App'
import { CLAVE, estadoInicial, reductor } from '../src/estado/GastosContexto'

const HOY = new Date(2026, 10, 7) // 7 de noviembre de 2026

beforeEach(async () => {
  await AsyncStorage.clear()
})

async function montar() {
  const vista = await render(<App hoy={HOY} />)
  await screen.findByText('Noviembre de 2026')
  return vista
}

async function agregar(monto: string, categoria: string, nota = '') {
  await fireEvent.changeText(screen.getByLabelText('Monto'), monto)
  await fireEvent.press(screen.getByRole('radio', { name: categoria }))
  if (nota) await fireEvent.changeText(screen.getByLabelText('Nota'), nota)
  await fireEvent.press(screen.getByRole('button', { name: 'Agregar gasto' }))
}

test('registra gastos, actualiza el total y el resumen por categoría', async () => {
  await montar()
  expect(screen.getByText('No hay gastos registrados en este mes.')).toBeOnTheScreen()

  await agregar('1.250,50', 'Comida', 'Feria del barrio')
  await agregar('750', 'Transporte')

  expect(screen.getByLabelText('Total del mes')).toHaveTextContent('$ 2.000,50')
  expect(screen.getByText('Feria del barrio')).toBeOnTheScreen()
  expect(screen.getByLabelText('Comida 62.5 %')).toBeOnTheScreen()
  expect(screen.getByText(/2 gastos · promedio diario \$ 285,79/)).toBeOnTheScreen()
})

test('usa el singular cuando hay un solo gasto', async () => {
  await montar()
  await agregar('100', 'Ocio')
  expect(screen.getByText(/^1 gasto · promedio diario/)).toBeOnTheScreen()
})

test('muestra los errores de validación', async () => {
  await montar()
  await fireEvent.changeText(screen.getByLabelText('Fecha'), '2026-12-01')
  await fireEvent.press(screen.getByRole('button', { name: 'Agregar gasto' }))
  expect(screen.getByText(/Ingresá un monto mayor a cero/)).toBeOnTheScreen()
  expect(screen.getByText('Elegí una categoría')).toBeOnTheScreen()
  expect(screen.getByText('No se pueden registrar gastos futuros')).toBeOnTheScreen()
})

test('avisa al acercarse y al superar el presupuesto', async () => {
  await montar()
  await fireEvent.press(screen.getByRole('button', { name: 'Definir presupuesto mensual' }))
  await fireEvent.changeText(screen.getByLabelText('Presupuesto mensual'), '10.000')
  await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }))

  await agregar('8.500', 'Hogar')
  expect(screen.getByText('85 % de $ 10.000,00 · quedan $ 1.500,00')).toBeOnTheScreen()

  await agregar('2.000', 'Ocio')
  expect(screen.getByText('Te pasaste del presupuesto por $ 500,00')).toBeOnTheScreen()
})

test('quitar un gasto se puede deshacer', async () => {
  await montar()
  await agregar('300', 'Salud', 'Farmacia')
  await fireEvent.press(screen.getByRole('button', { name: 'Quitar Farmacia' }))
  expect(screen.queryByText('Farmacia')).not.toBeOnTheScreen()
  await fireEvent.press(screen.getByRole('button', { name: 'Deshacer' }))
  expect(screen.getByText('Farmacia')).toBeOnTheScreen()
})

test('persiste los datos y los recupera al volver a abrir', async () => {
  const vista = await montar()
  await agregar('420', 'Comida', 'Panadería')
  await waitFor(async () => expect(await AsyncStorage.getItem(CLAVE)).toContain('Panadería'))

  await vista.unmount()
  await montar()
  expect(screen.getByText('Panadería')).toBeOnTheScreen()
})

test('navega a meses anteriores pero no a futuros', async () => {
  await AsyncStorage.setItem(
    CLAVE,
    JSON.stringify({ gastos: [{ id: 'v', centesimos: 99000, categoria: 'hogar', fecha: '2026-10-15', nota: 'Alquiler' }], presupuesto: null }),
  )
  await montar()
  expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
  await fireEvent.press(screen.getByRole('button', { name: 'Mes anterior' }))
  expect(screen.getByText('Octubre de 2026')).toBeOnTheScreen()
  expect(screen.getByText('Alquiler')).toBeOnTheScreen()
  // En meses cerrados no se ofrece el formulario.
  expect(screen.queryByRole('button', { name: 'Agregar gasto' })).not.toBeOnTheScreen()
})

test('el reductor no duplica un gasto restaurado', () => {
  const gasto = { id: 'x', centesimos: 100, categoria: 'otros' as const, fecha: '2026-11-01', nota: '' }
  const con = reductor({ ...estadoInicial, cargado: true }, { tipo: 'agregar', gasto })
  expect(reductor(con, { tipo: 'restaurar', gasto }).gastos).toHaveLength(1)
})
