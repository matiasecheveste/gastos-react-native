/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 */
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { CATEGORIAS, estadoPresupuesto, formatearPesos, parsearMonto, type Resumen as DatosResumen } from '../dominio/gastos'
import { colores } from './tema'

const COLOR_NIVEL = { 'sin-presupuesto': colores.primario, bien: colores.bien, atencion: colores.atencion, excedido: colores.peligro }

export function Presupuesto({
  total,
  presupuesto,
  alDefinir,
}: {
  total: number
  presupuesto: number | null
  alDefinir: (centesimos: number | null) => void
}) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const { nivel, usado, restante } = estadoPresupuesto(total, presupuesto)

  const guardar = () => {
    alDefinir(texto.trim() === '' ? null : parsearMonto(texto))
    setEditando(false)
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.etiqueta}>Gastado este mes</Text>
      <Text style={estilos.total} accessibilityLabel="Total del mes">
        {formatearPesos(total)}
      </Text>

      {presupuesto ? (
        <>
          <View
            style={estilos.barra}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.min(100, Math.round(usado * 100)) }}
          >
            <View style={[estilos.relleno, { width: `${Math.min(100, usado * 100)}%`, backgroundColor: COLOR_NIVEL[nivel] }]} />
          </View>
          <Text style={[estilos.estado, { color: COLOR_NIVEL[nivel] }]}>
            {nivel === 'excedido'
              ? `Te pasaste del presupuesto por ${formatearPesos(-restante)}`
              : `${Math.round(usado * 100)} % de ${formatearPesos(presupuesto)} · quedan ${formatearPesos(restante)}`}
          </Text>
        </>
      ) : null}

      {editando ? (
        <View style={estilos.fila}>
          <TextInput
            accessibilityLabel="Presupuesto mensual"
            style={estilos.campo}
            value={texto}
            onChangeText={setTexto}
            keyboardType="decimal-pad"
            placeholder="Vacío para quitarlo"
            autoFocus
          />
          <Pressable accessibilityRole="button" onPress={guardar} style={estilos.botonChico}>
            <Text style={estilos.textoBoton}>Guardar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setEditando(true)}>
          <Text style={estilos.enlace}>{presupuesto ? 'Cambiar presupuesto' : 'Definir presupuesto mensual'}</Text>
        </Pressable>
      )}
    </View>
  )
}

export function PorCategoria({ resumen }: { resumen: DatosResumen }) {
  if (resumen.cantidad === 0) return null
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>Por categoría</Text>
      {resumen.porCategoria.map((c) => (
        <View key={c.categoria} style={{ gap: 4 }} accessibilityLabel={`${CATEGORIAS[c.categoria].etiqueta} ${c.porcentaje} %`}>
          <View style={estilos.filaEntre}>
            <Text style={{ color: colores.texto }}>{CATEGORIAS[c.categoria].etiqueta}</Text>
            <Text style={{ color: colores.secundario }}>
              {formatearPesos(c.centesimos)} · {c.porcentaje} %
            </Text>
          </View>
          <View style={estilos.barra}>
            <View style={[estilos.relleno, { width: `${c.porcentaje}%`, backgroundColor: CATEGORIAS[c.categoria].color }]} />
          </View>
        </View>
      ))}
      <Text style={estilos.etiqueta}>
        {resumen.cantidad} gastos · promedio diario {formatearPesos(resumen.promedioDiario)}
      </Text>
    </View>
  )
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie, borderRadius: 12, padding: 16, gap: 8, borderWidth: 1, borderColor: colores.borde },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  etiqueta: { fontSize: 13, color: colores.secundario },
  total: { fontSize: 32, fontWeight: '700', color: colores.texto },
  barra: { height: 10, borderRadius: 5, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: 5 },
  estado: { fontSize: 14, fontWeight: '500' },
  enlace: { color: colores.primario, fontWeight: '600', paddingVertical: 4 },
  fila: { flexDirection: 'row', gap: 8 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between' },
  campo: { flex: 1, borderWidth: 1, borderColor: colores.borde, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: colores.texto },
  botonChico: { backgroundColor: colores.primario, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  textoBoton: { color: '#fff', fontWeight: '600' },
})
