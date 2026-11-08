# Gastos personales — React Native + Expo

Aplicación móvil para registrar gastos del día a día en pesos uruguayos, con presupuesto mensual, resumen por categoría y navegación entre meses. Funciona en Android, iOS y web desde una sola base de código.

![CI](https://github.com/matiasecheveste/gastos-react-native/actions/workflows/ci.yml/badge.svg)

## Qué demuestra

- **React Native 0.88 + Expo SDK 58** con TypeScript estricto (`strict`, `noUnusedLocals`).
- **Estado global con `useReducer` + Context**, persistido en `AsyncStorage` y con acción para deshacer.
- **Dominio separado de la interfaz** (`src/dominio/gastos.ts`): los montos se guardan en centésimos enteros para evitar errores de coma flotante; parseo y formato en estilo uruguayo (`$ 1.250,50`), meses en español del Uruguay ("setiembre").
- **Accesibilidad**: roles, etiquetas y estados (`accessibilityRole`, `accessibilityState`, regiones vivas) que además se usan como selectores en las pruebas.
- **Pruebas con Jest y React Native Testing Library**: 30 pruebas entre reglas de negocio y flujos completos de pantalla (alta, validación, presupuesto, deshacer, persistencia, navegación de meses).
- **CI en GitHub Actions**: compatibilidad de dependencias con el SDK, chequeo de tipos, pruebas con cobertura y exportación web.
- **Despliegue web** en Vercel con cabeceras de seguridad (CSP, `nosniff`).

## Estructura

```
App.tsx                      pantalla principal y navegación de meses
src/dominio/gastos.ts        reglas: montos, validación, resúmenes, presupuesto
src/estado/GastosContexto.tsx reductor, Context y persistencia
src/componentes/             Formulario, Resumen, Lista y tema
__tests__/                   pruebas de dominio y de pantalla
```

## Uso

```bash
npm install
npm start            # abre Expo (escanear el QR con Expo Go)
npm run web          # versión web en el navegador
npm test             # pruebas
npm run typecheck    # tipos
npm run exportar:web # genera dist/ para publicar
```

## Decisiones

- **Centésimos enteros**: `1.250,50` se guarda como `125050`; todas las sumas y porcentajes se calculan sobre enteros.
- **Sin gastos futuros** y formulario solo en el mes en curso: los meses cerrados quedan de consulta.
- **Promedio diario** sobre los días transcurridos del mes actual y sobre todos los días en meses anteriores.
- La fecha "hoy" se inyecta como propiedad de `App`, lo que hace las pruebas deterministas.

## Autor

Matías Nicolás Echeveste Cardozo — [Licencia MIT](LICENSE)
