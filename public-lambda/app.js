import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import fetch from 'node-fetch';
import Joi from 'joi';

const REGION = process.env.REGION || 'us-east-1'; // Default to us-east-1 if not set
const secretsManagerClient = new SecretsManagerClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });

// Define the validation schema for the incoming data
const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().invalid('', null, undefined),
    email: Joi.string().email().required().invalid('', null, undefined),
    message: Joi.string().min(10).max(2000).required().invalid('', null, undefined),
    recaptchaToken: Joi.string().required().invalid('', null, undefined)
});

async function getRecaptchaSecret() {
    const command = new GetSecretValueCommand({ SecretId: process.env.SECRET_NAME });
    const response = await secretsManagerClient.send(command);
    console.log("Fetched secret:", response);
    return JSON.parse(response.SecretString).reCAPTCHA_Secret;
}

export const handler = async (event) => {
    try {
        if(!event.body) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Request body is missing." }),
            };
        }

        const requestBody = JSON.parse(event.body);

        // 1. Validate incoming data
        const { error, value } = schema.validate(requestBody);
        if (error) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Invalid input.", details: error.details }),
            };
        }
        
        const { name, email, message, recaptchaToken } = value;

        // 2. Verify reCAPTCHA
        const recaptchaSecret = await getRecaptchaSecret();
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;
        const verificationResponse = await fetch(verificationUrl, { method: 'POST' });
        const verificationData = await verificationResponse.json();

        if (!verificationData.success) {
            throw new Error("reCAPTCHA verification failed.");
        }

        // 3. Invoke private Lambda
        const invokeParams = {
            FunctionName: process.env.PRIVATE_FUNCTION_NAME,
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({ body: JSON.stringify({ name, email, message }) }),
        };
        const invokeCommand = new InvokeCommand(invokeParams);
        await lambdaClient.send(invokeCommand);

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Email sent successfully!" }) };
    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "An error occurred." }) };
    }
};
