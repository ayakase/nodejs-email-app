const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
// middleware để parse cookies
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
    // check điều kiện xem có tồn tại user và pass trong cookies không, nếu 
    // có thì tìm trong database xem có đúng thông tin ko, đúng thì sang route /inbox, ko đúng thì render lại /signin
    // nếu ko tồn tại thì render lại route signin
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
    // check điều kiện xem có tồn tại user và pass trong cookies không, nếu 
    // có thì tìm trong database xem có đúng thông tin ko, đúng thì thực hiện query tìm tất cả các emails
    // đã nhận và trả về view, nếu cookies trống hoặc sai thì render view /error
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
    // nhận array gồm id những mail cần xóa và tiến hành query xóa bằng cách thay
    // deleted_by_receiver bằng 1 để không hiển thị trên views của người nhận
    // nhưng vẫn giữ nguyên cho người gửi
    deleteArray = req.params.array.split(',').map(Number);
    connection.query(`UPDATE emails SET deleted_by_receiver = 1 WHERE id IN (?)`, [deleteArray], (err, result) => {
        if (err) throw err
        // gủi status 200 để view xác nhận, ok thì tiến hành xóa element trong DOM
        res.sendStatus(200)
    })
})
app.delete('/outbox/:array', (req, res) => {
    // nhận array gồm id những mail cần xóa và tiến hành query xóa bằng cách thay
    // deleted_by_sender bằng 1 để không hiển thị trên views của người gửi
    // nhưng vẫn giữ nguyên cho người nhận
    deleteArray = req.params.array.split(',').map(Number);
    connection.query(`UPDATE emails SET deleted_by_sender = 1 WHERE id IN (?)`, [deleteArray], (err, result) => {
        if (err) throw err
        // gủi status 200 để view xác nhận, ok thì tiến hành xóa element trong DOM
        res.sendStatus(200)
    })
})
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/outbox', (req, res) => {
    let username = req.cookies['username']
    let password = req.cookies['password']
    // check điều kiện xem có tồn tại user và pass trong cookies không, nếu 
    // có thì tìm trong database xem có đúng thông tin ko, đúng thì thực hiện query tìm tất cả các emails
    // đã gửi và trả về view, nếu cookies trống hoặc sai thì render view /error
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
    // check điều kiện xem có tồn tại user và pass trong cookies không, nếu 
    // có thì tìm trong database xem có đúng thông tin ko, đúng thì thực hiện query
    // render ra danh sách người nhận, sai thì render error
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
    // check điều kiện xem có tồn tại user và pass trong cookies không, nếu 
    // có thì tìm trong database xem có đúng thông tin ko, đúng thì nhận dữ liệu từ form và insert
    // vào database
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
    //  nhận thông tin đăng nhập từ view và validate xem có hợp lệ không
    // có thì render view inbox và lưu thông tin vào cookies
    connection.query(`SELECT * FROM users WHERE email = ? `, [req.body.username, req.body.email], (error, result) => {
        if (error) throw error;
        if (result.length > 0) {
            // nếu password từ form trùng với trong database thì lưu vào cookies
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
    // vẫn là check thông tin từ cookies y như trên
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                // query để lấy thông tin chi tiết về Email đã nhận và render ra view /inboxdetail
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
    // vẫn là check thông tin từ cookies y như trên
    if (username && password) {
        connection.query(`SELECT * FROM users WHERE email = ?`, [username], (error, result) => {
            if (error) throw error
            if (password == result[0].password) {
                // query để lấy thông tin chi tiết về Email đã nhận và render ra view /inboxdetail
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
    // check thông tin đăng ký, password reenter ko trùng thì gửi lỗi
    if (req.body.password != req.body.reenter) {
        res.render('signup', { message: 'Password not match' })
        // pass dưới 6 chữ số thì gửi lỗi
    } else if (req.body.password.length < 6) {
        res.render('signup', { message: 'Password must have more than 6 characters' })
    } else {
        connection.query(`SELECT * FROM users WHERE email = ?`, [req.body.email], (error, result) => {
            if (error) throw error
            if (result.length > 0) {
                // tìm xem trong database có email này chưa, có thì hiển thị lỗi
                res.render('signup', { message: "Email already in use" })
            } else {
                // không có lỗi thì insert vào database và gửi message
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
