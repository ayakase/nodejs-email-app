const express = require('express');
const app = express();
const port = 8000;
const bodyParser = require('body-parser');
const connection = require('./dbsetup');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    // connection.query('SELECT * FROM `emails` WHERE receiver_id = ?', [1], (err, results) => {
    //     if (err) throw err;
    //     console.log(results);
    //     res.render('inbox', { emails: results });
    // });
    res.redirect('signin')
});
app.get('/inbox', (req, res) => {
    connection.query(`SELECT emails.*, sender.name AS sender_name
    FROM emails
    JOIN users AS sender ON emails.sender_id = sender.id
    WHERE emails.receiver_id = ?;
    `,
        [1], (err, results) => {
            if (err) throw err;
            res.render('inbox', { emails: results });
        });
});
app.post('/inbox', (req, res) => {
    console.log(req.body);
})
app.delete('/inbox/:array', (req, res) => {
    deleteArray = req.params.array.split(',').map(Number);
    deleteArray.forEach(id => {
        console.log(id);
    });
})
app.get('/signup', (req, res) => {
    console.log("a")
    res.render('signup');
});

app.get('/outbox', (req, res) => {
    res.render('outbox');
});
app.get('/compose', (req, res) => {
    res.render('compose');
});
app.get('/signin', (req, res) => {
    res.render('signin');
})

app.post('/signin', (req, res) => {
    console.log(req.body)
    connection.query(`SELECT * FROM users WHERE email = ?`, [req.body.username, req.body.email], (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
            if (req.body.password == result[0].password) {
                res.redirect('inbox')
            } else {
                res.render('signin', { message: "Password not true" })
            }
        } else {
            res.render('signin', { message: "Email does not exist" })
        }
    });
    // res.render('inbox');
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
