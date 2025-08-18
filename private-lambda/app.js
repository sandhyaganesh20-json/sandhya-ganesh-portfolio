import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import Joi from 'joi';

const REGION = process.env.REGION || 'us-east-1'; // Default to us-east-1 if not set
const sesClient = new SESClient({ region: REGION });

const schema = Joi.object({
    email: Joi.string().email().required().invalid('', null),
    senderEmail: Joi.string().email().required().invalid('', null),
    recipientEmail: Joi.string().email().required().invalid('', null),
});

export const handler = async (event) => {
  if(!event.body) {
    return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Request body is missing." }),
    };
  }

  const { name, email, message } = JSON.parse(event.body); //name and message are already validated in the public lambda
  const senderEmail = process.env.SENDER_EMAIL; //the values are set default to protect privacy
  const recipientEmail = process.env.RECIPIENT_EMAIL; //the values are set default to protect privacy
  console.log("Sender Email:", senderEmail);
  console.log("Recipient Email:", recipientEmail);
  if(!recipientEmail || !senderEmail) throw new Error("Sender/Recipient email should not be empty");
  
  const { error } = schema.validate({email, senderEmail, recipientEmail});

  if (error) {
    return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Invalid email addresses", details: error.details }),
    };
  }

  const emailParams = {
    Destination: { ToAddresses: [recipientEmail] },
    Message: {
      Body: {
        Html: { Charset: "UTF-8", Data: `<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message}</p>` },
        Text: { Charset: "UTF-8", Data: `Name: ${name}\nEmail: ${email}\nMessage: ${message}` }
      },
      Subject: { Charset: "UTF-8", Data: `New Message from ${name} via Portfolio` }
    },
    Source: senderEmail,
    ReplyToAddresses: [email],
  };

  console.log("Email Params:", JSON.stringify(emailParams));

  try {
    await sesClient.send(new SendEmailCommand(emailParams));
    console.log("Email sent successfully.");
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Email sent successfully!" }) };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Failed to send email" }) };
  }
};
