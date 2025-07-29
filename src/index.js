// index.js
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Invest App Backend is running!');
});

module.exports = app;
