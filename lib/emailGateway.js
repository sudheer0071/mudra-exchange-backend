//import package
import nodemailer from "nodemailer";

// import lib
import config from "../config";

export const sendEmail = async (to, content) => {
  try {
    const { subject, template } = content;

    if (process.env.NODE_ENV === "production" && config.SITE_NAME === "Mudra Exchange") {
      let ccemail = "info@mudra.exchange";
      let transporter = nodemailer.createTransport(
        config.emailGateway.nodemailer
      );

      let info = await transporter.sendMail({
        from: config.emailGateway.fromMail,
        to,
        bcc: ccemail,
        subject,
        html: template,
      });
      console.log("Message sent:", info?.messageId);

    } else {

      let transporter = nodemailer.createTransport(
        config.emailGateway.nodemailer
      );
      let info = await transporter.sendMail({
        from: config.emailGateway.fromMail,
        to,

        subject,
        html: template,
      });
      console.log("Message sent:", info?.messageId);
    }


  } catch (err) {
    console.log("-----err", err);
  }
};

// sendEmail(
//     "ajith@britisheducationonline.org",
//     {
//         subject: 'test',
//         template: '<h1>Test</h1>',
//     }
// )
