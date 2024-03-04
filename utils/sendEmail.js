
// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

// Nodemailer
const sendEmail = async (options) => {
  // 1) Create transporter ( service that will send email like "gmail","Mailgun", "mialtrap", sendGrid)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // if secure false port = 587, if true port= 465
    secure: true,
    auth: {
      user:process.env.EMAIL_USERNAME,
      pass:process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define email options (like from, to, subject, email content)
  const mailOpts = {
    from:'Auction plus <auctin_suport@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Send email
  await transporter.sendMail(mailOpts);
};

module.exports = sendEmail;