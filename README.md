# Clinical Rule Engine – NTS & MBE

Aplicación React para evaluación clínica basada en reglas NTS/MBE, con:

- Editor visual de reglas
- Motor de evaluación clínica
- Gestión multi-establecimiento e inventario
- Versionado de reglas NTS
- Auditoría clínica y decision log
- Dashboard de estado del sistema

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Instalación

```bash
npm install
```

---

## Ejecución en desarrollo

```bash
npm run dev
```

Luego abre la URL mostrada por Vite (por defecto `http://localhost:5173`).

---

## Build de producción

```bash
npm run build
```

## Vista previa del build

```bash
npm run preview
```

---


## Petitorio nacional vs inventario local

Se separó el módulo de medicamentos en dos capas:

- **Base normativa nacional (`national_medications`)**: catálogo editable en `src/data/nationalMedications.json`, gestionado desde el módulo **Petitorio nacional** (crear/actualizar, importar CSV, exportar JSON, activar/desactivar sin eliminación física).
- **Inventario del establecimiento**: disponibilidad local por sede (`src/store/establishmentsStore.jsx`) usada por el motor para validar tratamiento y recursos.
  - Modelo `EstablishmentInventory` en tabla lógica `establishment_inventory`.
  - Permite asociar medicamentos nacionales, editar stock, marcar disponibilidad y carga masiva CSV mapeada contra `national_medications`.
- En carga CSV de inventario se validan columnas requeridas: `genericName`, `concentration`, `pharmaceuticalForm`, `route`, `presentation`, `stock`; se muestra resumen (procesados, coincidencias, nuevos creados, errores).

> El inventario local solo agrega medicamentos activos del petitorio nacional.

## Pruebas

```bash
npm run test
```

Incluye pruebas básicas de:

- Evaluación de regla (`evaluateRule`)
- Cálculo de dosis (`calculateDosage`)

Archivo: `src/tests/engine.test.js`.

---

## Configuración principal

- `vite.config.js`: configuración de Vite + Vitest
- `src/main.jsx`: bootstrap de React
- `src/App.jsx`: entrada principal de UI

---

## Reglas por defecto (JSON)

El sistema carga reglas iniciales desde:

- `src/data/defaultRules.json`

Estas reglas se normalizan al iniciar `clinicalStore` y quedan listas para evaluación.

---

## Script de ejemplo de motor (Node)

```bash
node --experimental-default-type=module src/engine/example.js
```



Vista de inventario: `src/components/InventoryDashboard.jsx` (buscador, filtros por vía/forma y disponibilidad).
- InventoryDashboard incluye tabla compacta con scroll vertical, buscador con autocompletado, chips de vía (VO/IV/IM), indicador de disponibilidad por color y exportación de inventario.
