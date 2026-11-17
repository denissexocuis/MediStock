const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// altas rápidas de catálogos desde el formulario de medicamentos
const TABLAS = {
  farmacos: {
    sql: 'INSERT INTO farmaco (nombre, descripcion) VALUES ($1, $2) RETURNING id_farmaco AS id, nombre',
    conDescripcion: true,
  },
  marcas: { sql: 'INSERT INTO marca (nombre) VALUES ($1) RETURNING id_marca AS id, nombre' },
  ubicaciones: { sql: 'INSERT INTO ubicacion (nombre_ubi) VALUES ($1) RETURNING id_ubi AS id, nombre_ubi AS nombre' },
};

router.post('/:tipo', async (req, res) => {
  const t = TABLAS[req.params.tipo];
  if (!t) return res.status(404).json({ error: 'Catálogo no encontrado.' });
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'Escribe un nombre.' });
  try {
    const params = t.conDescripcion ? [nombre, (req.body.descripcion || '').trim() || null] : [nombre];
    const { rows } = await pool.query(t.sql, params);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe uno con ese nombre.' });
    throw e;
  }
});

module.exports = router;
