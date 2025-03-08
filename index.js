// app.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = "data.json";
const UNIT_PRICE = 8;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load data helper
const loadData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return { records: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
};

// Save data helper
const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Routes
app.get('/', (req, res) => {
  const data = loadData();
  res.render('index', { data });
});

app.post('/add_reading', (req, res) => {
  const currentReading = req.body.current_reading;
  
  if (typeof currentReading !== 'number') {
    return res.status(400).json({ error: "Invalid reading" });
  }

  const data = loadData();
  const lastEntry = data.records[0] || null;
  const lastReading = lastEntry ? lastEntry.reading : 0;
  
  const unitsUsed = Math.max(currentReading - lastReading, 0);
  const billAmount = unitsUsed * UNIT_PRICE;
  
  const now = new Date();
  const entry = {
    timestamp: now.toISOString(),
    date: now.toISOString().slice(0, 7), // YYYY-MM format
    reading: currentReading,
    units_used: unitsUsed,
    bill: billAmount
  };

  data.records.unshift(entry); // Add to beginning
  saveData(data);

  res.json({
    message: "Reading added",
    entry,
    units_used: unitsUsed,
    bill_amount: billAmount
  });
});

app.get('/get_data', (req, res) => {
  res.json(loadData());
});

// Error handling
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server Error');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});