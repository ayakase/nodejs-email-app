const express = require('express');
const app = express();
const port = 8000;
const bodyParser = require('body-parser');
const connection = require('./connect');
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                res.redirect('/inbox')
            } else {
                res.render('signin')
            }
        })
    } else {
        res.render('signin')
    }

});
app.get('/inbox', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                connection.query(`SELECT emails.*, sender.name AS sender_name
                FROM emails
                JOIN users AS sender ON emails.sender_id = sender.id
                WHERE emails.receiver_id = ? AND emails.deleted_by_receiver = 0 ORDER BY sent_at DESC;
                `,
                    [result[0].id], (err, result) => {
                        if (err) throw err;
                        res.render('inbox', { emails: result, username: username });
                    });
            } else {
                res.render('error')
            }
        })
    } else {
        res.render('error')
    }

});

app.delete('/inbox/:array', (req, res) => {
    deleteArray = req.params.array.split(',').map(Number);
    connection.query(`UPDATE emails SET deleted_by_receiver = 1 WHERE id IN (?)`, [deleteArray], (err, result) => {
        if (err) throw err
        res.sendStatus(200)
    })
})
app.delete('/outbox/:array', (req, res) => {
    deleteArray = req.params.array.split(',').map(Number);
    connection.query(`UPDATE emails SET deleted_by_sender = 1 WHERE id IN (?)`, [deleteArray], (err, result) => {
        if (err) throw err
        res.sendStatus(200)
    })
})
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/outbox', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                connection.query(`SELECT emails.*, receiver.name AS receiver_name
            FROM emails
            JOIN users AS receiver ON emails.receiver_id = receiver.id
            WHERE emails.sender_id = ? AND emails.deleted_by_sender = 0 ORDER BY sent_at DESC;
            `,
                    [result[0].id], (err, results) => {
                        if (err) throw err;
                        res.render('outbox', { emails: results, username: username });
                    });
            } else {
                res.render('error')
            }
        })
    } else {
        res.render('error')
    }

});
app.get('/compose', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                connection.query(`SELECT * FROM users`,
                    [result[0].id], (err, results) => {
                        if (err) throw err;
                        res.render('compose', { users: results, username: username });
                    });
            } else {
                res.render('error')
            }
        })
    } else {
        res.render('error')
    }
});
app.post('/compose', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                connection.query(`SELECT * FROM users`,
                    [result[0].id], (err, result) => {
                        if (err) throw err;
                        connection.query(`SELECT * from users WHERE email = ?`, [req.body.sender], (err, results) => {
                            if (err) throw err
                            connection.query(`INSERT INTO emails (sender_id, receiver_id,subject,content) VALUES (?, ?, ?, ?)`, [results[0].id, req.body.receiver, req.body.subject, req.body.content], (err, results) => {
                                if (err) throw err
                                res.render('compose', { users: result, username: username, message: "Email sent" });
                            })
                        })
                    });
            } else {
                res.render('error')
            }
        })
    } else {
        res.render('error')
    }

})
app.get('/signin', (req, res) => {
    res.render('signin');
})

app.post('/signin', (req, res) => {
    connection.query(`SELECT * FROM users WHERE email = ? `, [req.body.username, req.body.email], (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
            if (req.body.password == result[0].password) {
                res.cookie('username', req.body.username)
                res.cookie('password', req.body.password)
                res.redirect('inbox')
            } else {
                res.render('signin', { message: "Password not true" })
            }
        } else {
            res.render('signin', { message: "Email does not exist" })
        }
    });
});
app.get('/inboxdetail', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                connection.query(`
                SELECT emails.*, users.name AS sender_name, users.email AS sender_email
                FROM emails
                JOIN users ON emails.sender_id = users.id
                WHERE emails.id = ?
                `
                    , [emailId], (err, result) => {
                        if (err) throw err;
                        res.render('inboxdetail', { username: username, detail: result })
                    })
            }
        })
    } else {
        res.render('error')
    }
    const emailId = req.query.id;
})
app.get('/outboxdetail', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                connection.query(`
                SELECT emails.*, users.name AS receiver_name, users.email AS receiver_email
                FROM emails
                JOIN users ON emails.receiver_id = users.id
                WHERE emails.id = ?
                `
                    , [emailId], (err, result) => {
                        if (err) throw err;
                        res.render('outboxdetail', { username: username, detail: result })
                    })
            }
        })
    } else {
        res.render('error')
    }
    const emailId = req.query.id;

})
app.post('/signup', (req, res) => {
    if (req.body.password != req.body.reenter) {
        res.render('signup', { message: 'Password not match' })
    } else if (req.body.password.length < 6) {
        res.render('signup', { message: 'Password must have more than 6 characters' })
    } else {
        connection.query(`SELECT * FROM users WHERE email = ?`, [req.body.email], (error, result) => {
            if (error) throw error
            if (result.length > 0) {
                res.render('signup', { message: "Email already in use" })
            } else {
                connection.query(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [req.body.name, req.body.email, req.body.password], (error, result) => {
                    if (error) throw error
                    res.render('signup', { message: "Successfully created an account!" })
                })
            }
        })
    }
})
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
