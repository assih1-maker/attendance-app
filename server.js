const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware : permet à Express de comprendre le JSON envoyé dans une requête
// (placé tout en haut, avant toutes les routes qui en ont besoin)
app.use(express.json());

// Route d'accueil
app.get('/', (req, res) => {
  res.send('Bonjour ! Le serveur de présence fonctionne 🎉');
});

// Route GET : récupérer toutes les présences enregistrées
app.get('/api/attendance', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        attendance.id,
        students.full_name,
        courses.code AS course_code,
        attendance.date,
        attendance.present
      FROM attendance
      JOIN students ON attendance.student_id = students.id
      JOIN courses ON attendance.course_id = courses.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/attendance/course/:courseId', async (req, res) => {
  const { courseId } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        attendance.id,
        students.full_name,
        courses.code AS course_code,
        attendance.date,
        attendance.present
      FROM attendance
      JOIN students ON attendance.student_id = students.id
      JOIN courses ON attendance.course_id = courses.id
      WHERE attendance.course_id = ?
    `, [courseId]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route POST : soumettre l'appel complet d'un cours (plusieurs étudiants à la fois)
app.post('/api/attendance/submit', async (req, res) => {
  const { courseId, date, records } = req.body;

  if (!courseId || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Données manquantes ou invalides' });
  }

  try {
    for (const record of records) {
      await db.query(
        'INSERT INTO attendance (student_id, course_id, date, present) VALUES (?, ?, ?, ?)',
        [record.studentId, courseId, date, record.present]
      );
    }

    res.status(201).json({
      message: 'Appel enregistré avec succès',
      total: records.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM attendance WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Enregistrement introuvable' });
    }

    res.json({ message: 'Présence supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});