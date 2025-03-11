// src/lib/email.js
import nodemailer from 'nodemailer';

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Using Gmail service
  auth: {
    user: process.env.EMAIL_USERNAME, // mdhasibulhasan360@gmail.com
    pass: process.env.EMAIL_PASSWORD, // App password: tpna ktvz scfz zvkj
  },
});

/**
 * Send an email
 * @param {Object} options Email options
 * @param {string} options.to Recipient email
 * @param {string} options.subject Email subject
 * @param {string} options.text Plain text content (optional if html is provided)
 * @param {string} options.html HTML content (optional if text is provided)
 * @param {string} options.from Sender email (optional, falls back to default)
 * @returns {Promise<Object>} Message info
 */
export const sendEmail = async ({ to, subject, text, html, from = process.env.EMAIL_USERNAME }) => {
  try {
    if (!to || !subject || (!text && !html)) {
      throw new Error('Missing required email parameters');
    }

    const mailOptions = {
      from,
      to,
      subject,
      text,
      html,
    };

    // Remove undefined values
    Object.keys(mailOptions).forEach(key => {
      if (mailOptions[key] === undefined) {
        delete mailOptions[key];
      }
    });

    console.log('Sending email to:', to, 'with subject:', subject);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Utility function to create standard email templates
export const createEmailTemplate = (options) => {
  const { title, heading, content, buttonText, buttonUrl, footerText } = options;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .content {
          padding: 30px 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${heading}</h1>
        </div>
        <div class="content">
          ${content}
          ${buttonText && buttonUrl ? `<div style="text-align: center;"><a href="${buttonUrl}" class="button">${buttonText}</a></div>` : ''}
        </div>
        <div class="footer">
          ${footerText || '© Tradie Service Marketplace. All rights reserved.'}
        </div>
      </div>
    </body>
    </html>
  `;
};