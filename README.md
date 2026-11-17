# MediStock
Sistema de control de medicamentos para pacientes.

--- 
Este sistema tiene el propósito de administrar y llevar un control de medicamentos que ya no son utilizados por los pacientes con la intención de tener un lugar donde se pueda ver que hay, para qué sirve y en qué estado está, y así, poder aprovechar los medicamentos de forma segura.

---
**Problemática que resuelve**:

Este proyecto resuelve la complejidad de llevar un control de:

- Saber los medicamentos que están guardados.
- Si los paquetes están sellados, nuevos o ya fueron abiertos.
- Cuándo van a caduar.
- Para qué sirve cada uno.

---
## Instalación (red local de la clínica)

Requisitos: Node.js 20+ y PostgreSQL 14+.

```bash
# 1. Base de datos
createdb medistock
psql -d medistock -f backend/schema.sql

# 2. Backend
cd backend
npm install
cp .env.example .env        
npm run dev                 
```

## Pantallas

| Pantalla | Para qué sirve |
|---|---|
| Inventario | Buscar, filtrar, agregar, editar y eliminar medicamentos; avisa los caducados y por caducar |
| Fármacos / Marcas | Alta, edición y baja (con motivo); todo queda en el historial |
| Doctores | Doctores activos, su último acceso y cuántos movimientos han hecho |
| Historial | Quién hizo qué, cuándo y por qué; filtra por fecha, acción, tipo y medicamento/paciente |
