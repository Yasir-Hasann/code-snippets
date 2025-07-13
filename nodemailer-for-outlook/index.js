// Here are the things we have to do first:

// 1st:
// To connect your business email (support@website.com) with our website’s email system, we need to enable a setting called SMTP AUTH.

// Steps:
// Go to https://admin.microsoft.com and sign in with your Microsoft 365 admin account.
// Click "Users" > "Active users"
// Click on the user support@website.com
// In the left panel, click "Mail", then choose "Manage email apps"
// Make sure “Authenticated SMTP” is enabled (checked)
// Click Save

// 2nd
// Go to https://aad.portal.azure.com
// Sign in with the Microsoft 365 Admin account
// Go to Azure Active Directory → Properties
// Click “Manage Security Defaults”
// Set “Enable Security Defaults” to No
// Click Save

// 3rd: (Optional)
// Create an App Password (if MFA is enabled)
// Visit: https://mysignins.microsoft.com/security-info
// Sign in as support@dragspace.com
// Click “Add method” > Choose “App password”
// Give it a name like Website SMTP
// Copy the password that is generated (you’ll only see it once)

// module imports
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});
