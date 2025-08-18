# sandhya-ganesh-portfolio
Creating a portfolio connected with AWS Lambda and SES for job search

Key Points Summary
Frontend: A single index.html file built with Tailwind CSS. Hosted for free on GitHub Pages.

Backend: An AWS serverless application that powers the contact form.

Architecture: A secure two-lambda pattern. A public Lambda validates user input and a reCAPTCHA token, then invokes a private Lambda that sends the email using Amazon SES.

Infrastructure as Code: The entire backend is defined in the template.yaml file and deployed using the AWS SAM CLI.

Security: The form is protected from spam with Google reCAPTCHA v2. Secrets are managed securely using AWS Secrets Manager.

Cost: The entire project is free to host and operate, as it falls within the free tiers of GitHub, AWS, and Google.

Features
Modern Frontend: A clean, single-page portfolio built with HTML and Tailwind CSS.

Responsive Design: Fully optimized for viewing on desktop, tablet, and mobile devices.

Serverless Backend: The contact form is powered by AWS Lambda, API Gateway, and Amazon SES, ensuring scalability and cost-efficiency.

Secure Architecture: Implements a two-lambda (public/private) pattern with reCAPTCHA verification and input validation to protect against spam and malicious requests.

Infrastructure as Code (IaC): All AWS resources are defined and managed using the AWS SAM framework (template.yaml).

Local Testing: The entire backend can be tested locally using the AWS SAM CLI and Docker.

