/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 * Estado global con useReducer + Context y persistencia en AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'

import type { Gasto } from '../dominio/gastos'

export interface Estado {
  cargado: boolean
  gastos: Gasto[]
  /** Presupuesto mensual en centésimos. */
  presupuesto: number | null
}

export type Accion =
  | { tipo: 'cargar'; gastos: Gasto[]; presupuesto: number | null }
  | { tipo: 'agregar'; gasto: Gasto }
  | { tipo: 'quitar'; id: string }
  | { tipo: 'restaurar'; gasto: Gasto }
  | { tipo: 'presupuesto'; centesimos: number | null }

export const estadoInicial: Estado = { cargado: false, gastos: [], presupuesto: null }

export function reductor(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case 'cargar':
      return { cargado: true, gastos: accion.gastos, presupuesto: accion.presupuesto }
    case 'agregar':
    case 'restaurar':
      return estado.gastos.some((g) => g.id === accion.gasto.id) ? estado : { ...estado, gastos: [...estado.gastos, accion.gasto] }
    case 'quitar':
      return { ...estado, gastos: estado.gastos.filter((g) => g.id !== accion.id) }
    case 'presupuesto':
      return { ...estado, presupuesto: accion.centesimos }
  }
}

export const CLAVE = 'gastos:v1'

interface Guardado {
  gastos: Gasto[]
  presupuesto: number | null
}

export async function leerGuardado(): Promise<Guardado> {
  try {
    const texto = await AsyncStorage.getItem(CLAVE)
    const datos = texto ? (JSON.parse(texto) as Partial<Guardado>) : {}
    return { gastos: Array.isArray(datos.gastos) ? datos.gastos : [], presupuesto: datos.presupuesto ?? null }
  } catch {
    return { gastos: [], presupuesto: null } // datos dañados: no impedir que la app abra
  }
}

const Contexto = createContext<{ estado: Estado; despachar: (a: Accion) => void } | null>(null)

export function GastosProvider({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(reductor, estadoInicial)
  const primeraCarga = useRef(true)

  useEffect(() => {
    let vigente = true
    leerGuardado().then((g) => vigente && despachar({ tipo: 'cargar', ...g }))
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => {
    if (!estado.cargado) return
    if (primeraCarga.current) {
      primeraCarga.current = false // no reescribir lo que se acaba de leer
      return
    }
    const datos: Guardado = { gastos: estado.gastos, presupuesto: estado.presupuesto }
    AsyncStorage.setItem(CLAVE, JSON.stringify(datos)).catch(() => {})
  }, [estado])

  const valor = useMemo(() => ({ estado, despachar }), [estado])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useGastos() {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useGastos debe usarse dentro de GastosProvider')
  return valor
}
