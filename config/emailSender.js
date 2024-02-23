const nodemailer =require('nodemailer')

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    // secure: false,
    // requireTLS: true,
    auth: {
      user: "kalartisko@gmail.com",
      pass: "sepi fojh eonz vkwp",
    }
});

module.exports= transporter;

