import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure email service - using Gmail or other SMTP provider
// For Gmail: You need to use App Passwords (2FA enabled) instead of regular password
// https://support.google.com/accounts/answer/185833

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password', // Use app password for Gmail
  },
});

// HTML email template for OTP
const getOTPEmailTemplate = (otp, recipientName = 'User') => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; }
        .expiry-text { color: #666; font-size: 14px; margin-top: 10px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 4px; color: #856404; }
        .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Campus Emergency Response System</h1>
          <p>Secure Authentication</p>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>
          <p>Your One-Time Password (OTP) for secure login to the Campus Security system is:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry-text">Valid for 10 minutes</div>
          </div>

          <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>

          <div class="warning">
            <strong>⚠️ Security Warning:</strong> If you did not request this OTP, please ignore this email. Your account may be under attempt of unauthorized access. Contact support immediately if you have concerns.
          </div>

          <p><strong>What to do next:</strong></p>
          <ul>
            <li>Enter the OTP code in the authentication screen</li>
            <li>If you requested multiple OTPs, use only the most recent one</li>
            <li>Never share your OTP with anyone, including support staff</li>
          </ul>

          <p>Best regards,<br>Campus Security System</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>For support, contact: security@campus.edu</p>
        </div>
      </div>
    </body>
  </html>
`;

/**
 * Send OTP to user's email
 * @param email - Recipient email address
 * @param otp - 6-digit OTP code
 * @param userName - User's name for personalization (optional)
 * @returns Promise with success status and error message if applicable
 */
export const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return { success: false, error: 'Invalid OTP format' };
    }

    const mailOptions = {
      from: `Campus Security <${process.env.EMAIL_USER || 'noreply@campus.edu'}>`,
      to: email,
      subject: '🔐 Your One-Time Password (OTP) - Campus Security',
      html: getOTPEmailTemplate(otp, userName),
      // Plain text fallback
      text: `Your OTP: ${otp}\n\nValid for 10 minutes. Do not share this code with anyone.`,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', {
      messageId: info.messageId,
      to: email,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', {
      error: error.message,
      code: error.code,
      email,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: error.message || 'Failed to send OTP email. Please try again later.',
    };
  }
};

/**
 * Send welcome email to new user
 * @param email - Recipient email address
 * @param userName - User's full name
 * @returns Promise with success status
 */
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: `Campus Security <${process.env.EMAIL_USER || 'noreply@campus.edu'}>`,
      to: email,
      subject: '👋 Welcome to Campus Security Emergency System',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 30px; background: #f9f9f9; }
              .feature-list { list-style: none; padding: 0; }
              .feature-list li { padding: 10px 0; border-bottom: 1px solid #ddd; }
              .feature-list strong { color: #667eea; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Campus Security!</h1>
              </div>
              <div class="content">
                <p>Hello ${userName},</p>
                <p>Your account has been successfully created. You now have access to the Campus Emergency Response System.</p>
                
                <h3>Features Available:</h3>
                <ul class="feature-list">
                  <li><strong>Emergency SOS:</strong> Activate alerts with automatic location tracking</li>
                  <li><strong>Live Recording:</strong> Stream video, audio, and photos to security team</li>
                  <li><strong>Location Sharing:</strong> Real-time GPS tracking during emergencies</li>
                  <li><strong>Notifications:</strong> Receive real-time alerts and updates</li>
                </ul>

                <p>Your account is secured with:</p>
                <ul>
                  <li>Email verification via OTP</li>
                  <li>Secure password authentication</li>
                  <li>Google OAuth single sign-on option</li>
                </ul>

                <p>If you have any questions or need support, please contact: <strong>security@campus.edu</strong></p>
                
                <p>Stay safe!<br>Campus Security Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Welcome ${userName}! Your account has been created. Visit the app to get started.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', { messageId: info.messageId, to: email });

    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 * Verifies that the email service is properly configured
 */
export const testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    console.log('Email service configured correctly');
    return { success: true };
  } catch (error) {
    console.error('Email service configuration error:', error.message);
    return { success: false, error: error.message };
  }
};
