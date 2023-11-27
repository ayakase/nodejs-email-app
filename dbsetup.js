const connection = require('./connect');
// file để khởi tạo các table của database,  tạo table và thêm sample data
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
            console.log('Created emails table');

            connection.query(`
            INSERT INTO users (name, email, password) VALUES
            ('User1', 'a@a.com', 'password1'),
            ('User2', 'user2@example.com', 'password2'),
            ('User3', 'user3@example.com', 'password3');
          `, (err) => {
                if (err) throw err;
                console.log('Inserted users sample');

                connection.query(`
                INSERT INTO emails (sender_id, receiver_id, content) VALUES
                (1, 2, 'Hello User2, How ur doing.'),
                (2, 1, 'Hi User1, thanks for asking, Im doing good!'),
                (3, 1, 'Hey User1,  u ok?'),
                (1, 3, 'Hello User3, Im ok, thanks for asking, how about u.'),
                (3, 1, 'Im doing well, thanks! '),
                (2, 1, 'User1, Lets go somewhere tommorow.'),
                (1, 2, 'Sure, where exactly ?'),
                (2, 1, 'How about the cafe ?'),
                (1, 2, 'That sounds wonderful?');
              `, (err) => {
                    if (err) throw err;
                    console.log('Inserted emails sample');
                });
            });
        });
    });
});
