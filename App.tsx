/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 */
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import { Formulario } from './src/componentes/Formulario'
import { Lista } from './src/componentes/Lista'
import { PorCategoria, Presupuesto } from './src/componentes/Resumen'
import { colores } from './src/componentes/tema'
import { desplazarMes, fechaLocal, gastosDelMes, mesDe, nombreMes, resumenDelMes, type Gasto } from './src/dominio/gastos'
import { GastosProvider, useGastos } from './src/estado/GastosContexto'

export default function App({ hoy = new Date() }: { hoy?: Date }) {
  return (
    <SafeAreaProvider>
      <GastosProvider>
        <Pantalla hoy={fechaLocal(hoy)} />
      </GastosProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  )
}

function Pantalla({ hoy }: { hoy: string }) {
  const { estado, despachar } = useGastos()
  const [mes, setMes] = useState(mesDe(hoy))
  const [quitado, setQuitado] = useState<Gasto | null>(null)

  // El aviso de "Deshacer" desaparece a los 6 segundos.
  useEffect(() => {
    if (!quitado) return
    const t = setTimeout(() => setQuitado(null), 6000)
    return () => clearTimeout(t)
  }, [quitado])

  const resumen = useMemo(() => resumenDelMes(estado.gastos, mes, hoy), [estado.gastos, mes, hoy])
  const movimientos = useMemo(() => gastosDelMes(estado.gastos, mes), [estado.gastos, mes])
  const esMesActual = mes === mesDe(hoy)

  if (!estado.cargado) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    )
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.encabezado}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={() => setMes(desplazarMes(mes, -1))} hitSlop={12}>
          <Text style={estilos.flecha}>‹</Text>
        </Pressable>
        <Text style={estilos.mes} accessibilityRole="header">
          {mayusculaInicial(nombreMes(mes))}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          accessibilityState={{ disabled: esMesActual }}
          disabled={esMesActual}
          onPress={() => setMes(desplazarMes(mes, 1))}
          hitSlop={12}
        >
          <Text style={[estilos.flecha, esMesActual && { opacity: 0.25 }]}>›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <Presupuesto total={resumen.total} presupuesto={estado.presupuesto} alDefinir={(c) => despachar({ tipo: 'presupuesto', centesimos: c })} />
        {esMesActual && (
          <Formulario
            hoy={hoy}
            alAgregar={(gasto) => {
              despachar({ tipo: 'agregar', gasto })
              setMes(mesDe(gasto.fecha))
            }}
          />
        )}
        <PorCategoria resumen={resumen} />
        <Lista
          gastos={movimientos}
          alQuitar={(g) => {
            despachar({ tipo: 'quitar', id: g.id })
            setQuitado(g)
          }}
        />
      </ScrollView>

      {quitado && (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Text style={estilos.textoAviso}>Gasto quitado</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              despachar({ tipo: 'restaurar', gasto: quitado })
              setQuitado(null)
            }}
          >
            <Text style={estilos.deshacer}>Deshacer</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}

const mayusculaInicial = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  mes: { fontSize: 20, fontWeight: '700', color: colores.texto },
  flecha: { fontSize: 32, color: colores.primario, paddingHorizontal: 8 },
  contenido: { padding: 16, gap: 16, paddingBottom: 96, maxWidth: 640, width: '100%', alignSelf: 'center' },
  aviso: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colores.texto,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textoAviso: { color: '#fff' },
  deshacer: { color: '#5eead4', fontWeight: '700' },
})
