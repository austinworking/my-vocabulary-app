const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Import the path module

const app = express();
const port = 3000;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'austinalfredhillSQL456',
  database: 'mydb',
  connectionLimit: 10
});


// Middleware setup
app.use(cors({
  origin:'*'}));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve index.html when the root URL is requested
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Fetch all words
app.get('/words', (req, res) => {
  pool.query('SELECT * FROM vocabulary', (err, results) => {
    if (err) {
      console.error('Error fetching words:', err);
      return res.status(500).json({ error: 'Failed to fetch words' });
    }
    res.json(results);
  });
});

// Search words
app.get('/search', (req, res) => {
  const { query } = req.query;
  console.log('Search query received:', query);
  const sql = `
    SELECT * FROM vocabulary
    WHERE englishWord LIKE ? OR indonesianWord LIKE ? OR wordClass LIKE ? OR verb2 LIKE ? OR verb3 LIKE ?
  `;
  const searchQuery = `%${query}%`;
  pool.query(sql, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Error fetching search results:', err);
      return res.status(500).json({ error: 'Failed to fetch search results' });
    }
    res.json(results);
  });
});

// Add a new word
app.post('/words', (req, res) => {
    const { id, englishWord, indonesianWord, wordClass, verb2, verb3 } = req.body;
    const sql = 'INSERT INTO vocabulary (id, englishWord, indonesianWord, wordClass, verb2, verb3) VALUES (?, ?, ?, ?, ?, ?)';
    pool.query(sql, [id, englishWord, indonesianWord, wordClass, verb2, verb3], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Database insert error');
        return;
      }
      res.status(200).send('Word added');
    });
  });

// Delete a word
app.delete('/words/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM vocabulary WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting word:', err);
      return res.status(500).json({ error: 'Failed to delete word' });
    }
    res.status(204).send();
  });
});

// Endpoint to update an existing word
app.put('/words/:id', (req, res) => {
    const wordId = req.params.id;
    const { englishWord, indonesianWord, wordClass, verb2, verb3 } = req.body;
    console.log("Received PUT request for word ID:", wordId);
    const query = `
      UPDATE vocabulary
      SET englishWord = ?, indonesianWord = ?, wordClass = ?, verb2 = ?, verb3 = ?
      WHERE id = ?;
    `;
  
    pool.query(
      query,
      [englishWord, indonesianWord, wordClass, verb2, verb3, wordId],
      (err, result) => {
        if (err) {
          console.error('Error updating word in the database:', err);
          res.status(500).send('Error updating word in the database.');
        } else {
          res.sendStatus(200);
        }
      }
    );
  });

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
