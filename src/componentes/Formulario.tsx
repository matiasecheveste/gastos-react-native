/*
 * Gastos personales — Matías Nicolás Echeveste Cardozo
 */
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { CATEGORIAS, LISTA_CATEGORIAS, parsearMonto, validarGasto, type Categoria, type Errores, type Gasto } from '../dominio/gastos'
import { colores } from './tema'

const nuevoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function Formulario({ hoy, alAgregar }: { hoy: string; alAgregar: (g: Gasto) => void }) {
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [fecha, setFecha] = useState(hoy)
  const [nota, setNota] = useState('')
  const [errores, setErrores] = useState<Errores>({})

  const enviar = () => {
    const entrada = { monto, categoria, fecha: fecha.trim(), nota: nota.trim() }
    const encontrados = validarGasto(entrada, hoy)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return
    alAgregar({ id: nuevoId(), centesimos: parsearMonto(monto)!, categoria: categoria!, fecha: entrada.fecha, nota: entrada.nota })
    setMonto('')
    setNota('')
    setCategoria(null)
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>Nuevo gasto</Text>

      <Text style={estilos.etiqueta}>Monto</Text>
      <TextInput
        accessibilityLabel="Monto"
        style={estilos.campo}
        value={monto}
        onChangeText={setMonto}
        placeholder="$ 0,00"
        keyboardType="decimal-pad"
      />
      {errores.monto && <Text style={estilos.error}>{errores.monto}</Text>}

      <Text style={estilos.etiqueta}>Categoría</Text>
      <View style={estilos.chips} accessibilityRole="radiogroup">
        {LISTA_CATEGORIAS.map((c) => {
          const elegida = c === categoria
          return (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegida }}
              onPress={() => setCategoria(c)}
              style={[estilos.chip, elegida && { backgroundColor: CATEGORIAS[c].color, borderColor: CATEGORIAS[c].color }]}
            >
              <Text style={[estilos.textoChip, elegida && { color: '#fff' }]}>{CATEGORIAS[c].etiqueta}</Text>
            </Pressable>
          )
        })}
      </View>
      {errores.categoria && <Text style={estilos.error}>{errores.categoria}</Text>}

      <View style={estilos.fila}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.etiqueta}>Fecha</Text>
          <TextInput accessibilityLabel="Fecha" style={estilos.campo} value={fecha} onChangeText={setFecha} placeholder="AAAA-MM-DD" />
        </View>
        <View style={{ flex: 2 }}>
          <Text style={estilos.etiqueta}>Nota</Text>
          <TextInput accessibilityLabel="Nota" style={estilos.campo} value={nota} onChangeText={setNota} placeholder="Opcional" maxLength={140} />
        </View>
      </View>
      {errores.fecha && <Text style={estilos.error}>{errores.fecha}</Text>}
      {errores.nota && <Text style={estilos.error}>{errores.nota}</Text>}

      <Pressable accessibilityRole="button" onPress={enviar} style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.8 }]}>
        <Text style={estilos.textoBoton}>Agregar gasto</Text>
      </Pressable>
    </View>
  )
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie, borderRadius: 12, padding: 16, gap: 6, borderWidth: 1, borderColor: colores.borde },
  titulo: { fontSize: 18, fontWeight: '600', color: colores.texto, marginBottom: 4 },
  etiqueta: { fontSize: 13, color: colores.secundario, marginTop: 6 },
  campo: { borderWidth: 1, borderColor: colores.borde, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colores.texto, backgroundColor: colores.fondo },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colores.borde, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  textoChip: { color: colores.texto },
  fila: { flexDirection: 'row', gap: 12 },
  error: { color: colores.peligro, fontSize: 13 },
  boton: { marginTop: 12, backgroundColor: colores.primario, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  textoBoton: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
