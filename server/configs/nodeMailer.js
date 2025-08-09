import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}); 

const sendEmail = async({to, subject, body, attachments = []}) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html: body,
  };

  // Add attachments if provided
  if (attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  const response = await transporter.sendMail(mailOptions);
  return response;
}

export default sendEmail;