// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import { google } from "googleapis";
// dotenv.config(); 
// const oAuth2Client = new google.auth.OAuth2(
//   process.env.GMAIL_CLIENT_ID,
//   process.env.GMAIL_CLIENT_SECRET,
//   "https://developers.google.com/oauthplayground" 
// );
// oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
// async function getAccessToken() {
//   const { token } = await oAuth2Client.getAccessToken();
//   return token;
// }
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     type: "OAuth2",
//     user: process.env.GMAIL_USER,
//     clientId: process.env.GMAIL_CLIENT_ID,
//     clientSecret: process.env.GMAIL_CLIENT_SECRET,
//     refreshToken: process.env.GMAIL_REFRESH_TOKEN,
//     accessToken: await getAccessToken(), 
//   },
// });
// const sendEmail = async (email, subject, htmlContent) => {
//   try {
//     const accessToken = await getAccessToken(); 
//     const result = await transporter.sendMail({
//       from: `"TheNimantran.com" <${process.env.GMAIL_USER}>`,
//       to: email,
//       subject: subject,
//       html: htmlContent,
//       auth: {
//         type: "OAuth2",
//         user: process.env.GMAIL_USER,
//         clientId: process.env.GMAIL_CLIENT_ID,
//         clientSecret: process.env.GMAIL_CLIENT_SECRET,
//         refreshToken: process.env.GMAIL_REFRESH_TOKEN,
//         accessToken: accessToken,
//       },
//     });
//     console.log(" Email sent:", result.response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };
// export { sendEmail };
import nodemailer from "nodemailer";
export const transporter = nodemailer.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    service: "gmail",
    auth: {
        user: process.env.COMP_EMAIL,
        pass: process.env.COMP_PASS,
    }
});
// const sendEmail = (email,subject,data)=>{transporter.sendMail({
//  from:`"TheNimantran.com" ${""}`,
//  to:email,
//  subject:subject,
//  html:` 
//     <h1>TheNimantran.com</h1>
//     <h2>Your OTP for verification :<h2>
//     <h3>    ${data}     </h3>`
// })
// };
// export {sendEmail}
