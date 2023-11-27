// const mysql = require('mysql2');
const connection = require('./connect');
connection.connect((err) => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected');
    connection.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );`, (err) => {
        if (err) throw err;
        console.log('Created user table');

        connection.query(`
        CREATE TABLE IF NOT EXISTS emails (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sender_id INT NOT NULL,
          receiver_id INT NOT NULL,
          subject TEXT,
          content TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_by_sender TINYINT(1) DEFAULT 0,
          deleted_by_receiver TINYINT(1) DEFAULT 0,
          FOREIGN KEY (sender_id) REFERENCES users(id),
          FOREIGN KEY (receiver_id) REFERENCES users(id)
        );
      `, (err) => {
            if (err) throw err;
            console.log('Emails table created');

            connection.query(`
            INSERT INTO users (name, email, password) VALUES
            ('User1', 'a@a.com', 'password1'),
            ('User2', 'user2@example.com', 'password2'),
            ('User3', 'user3@example.com', 'password3');
          `, (err) => {
                if (err) throw err;
                console.log('Sample users inserted');

                connection.query(`
                INSERT INTO emails (sender_id, receiver_id, content) VALUES
                (1, 2, 'Hello User2, this is a message from User1.'),
                (2, 1, 'Hi User1, thanks for the message!'),
                (3, 1, 'Hey User1, how are you?'),
                (1, 3, 'Hello User3, this is a message from User1.'),
                (3, 1, 'Im doing well, thanks! How about you?'),
                (2, 1, 'User1, I have some news to share.'),
                (1, 2, 'Sure, whats the news?'),
                (2, 1, 'Lets meet up for coffee tomorrow.');
              `, (err) => {
                    if (err) throw err;
                    console.log('Sample emails inserted');
                });
            });
        });
    });
});
