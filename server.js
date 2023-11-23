const express = require('express');
const app = express();
const port = 8000;
const bodyParser = require('body-parser');
const connection = require('./dbsetup');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    console.log("a")
    res.render('inbox');
});
app.get('/signup', (req, res) => {
    console.log("a")
    res.render('signup');
});
app.get('/inbox', (req, res) => {
    connection.query('SELECT * FROM `emails` WHERE sender_id = ?', [1], (err, results) => {
        if (err) throw err;
        console.log(results);
        res.render('inbox', { emails: results });
    });
});

app.get('/outbox', (req, res) => {
    res.render('outbox');
});
app.get('/compose', (req, res) => {
    res.render('compose');
});

app.post('/signin', (req, res) => {
    console.log(req.body)
    res.render('inbox');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
