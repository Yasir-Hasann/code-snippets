// module imports
const nodemailer = require('nodemailer');
const { SMTPServer } = require('smtp-server');

const server = new SMTPServer({
  authOptional: true,
  onData(stream, session, callback) {
    let emailData = '';
    stream.on('data', (chunk) => {
      emailData += chunk.toString();
    });

    stream.on('end', () => {
      console.log('Received email data:', emailData);
      callback(null);
    });
  },
  onAuth(auth, session, callback) {
    if (auth.username === 'username' && auth.password === 'password') {
      callback(null, { user: auth.username });
    } else {
      callback(new Error('Invalid username or password'));
    }
  },
});

server.listen(2525, () => {
  console.log('Server is listening on port: 2525');
});

const sendEmail = async () => {
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false, // Set to true if using port 465 with SSL
    auth: {
      user: 'username',
      pass: 'password',
    },
  });

  const mailOptions = {
    from: 'sender@example.com',
    to: 'receiver@example.com',
    subject: 'Hello from your SMTP Server',
    text: 'This is a test email sent from a custom SMTP server in Node.js!',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

sendEmail();
