/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 */
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { CATEGORIAS, formatearPesos, type Gasto } from '../dominio/gastos'
import { colores } from './tema'

export function Lista({ gastos, alQuitar }: { gastos: Gasto[]; alQuitar: (g: Gasto) => void }) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>Movimientos</Text>
      {gastos.length === 0 ? (
        <Text style={estilos.vacio}>No hay gastos registrados en este mes.</Text>
      ) : (
        gastos.map((g) => (
          <View key={g.id} style={estilos.fila} testID={`gasto-${g.id}`}>
            <View style={[estilos.punto, { backgroundColor: CATEGORIAS[g.categoria].color }]} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.descripcion}>{g.nota || CATEGORIAS[g.categoria].etiqueta}</Text>
              <Text style={estilos.detalle}>
                {g.fecha.slice(8, 10)}/{g.fecha.slice(5, 7)} · {CATEGORIAS[g.categoria].etiqueta}
              </Text>
            </View>
            <Text style={estilos.monto}>{formatearPesos(g.centesimos)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${g.nota || CATEGORIAS[g.categoria].etiqueta}`}
              onPress={() => alQuitar(g)}
              hitSlop={8}
            >
              <Text style={estilos.quitar}>✕</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie, borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: colores.borde },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  vacio: { color: colores.secundario },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  descripcion: { color: colores.texto, fontSize: 15 },
  detalle: { color: colores.secundario, fontSize: 12 },
  monto: { color: colores.texto, fontWeight: '600' },
  quitar: { color: colores.secundario, fontSize: 16, paddingHorizontal: 4 },
})
