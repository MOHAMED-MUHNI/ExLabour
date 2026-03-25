const nodemailer = require('nodemailer');

/**
 * Email Service for sending transactional emails
 */

let transporter = null;

// Initialize transporter
const initializeTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production or configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✓ Email transporter configured with SMTP');
  } else if (process.env.NODE_ENV === 'production') {
    console.error('❌ Production environment but no SMTP credentials configured!');
  } else {
    // Development: Create Ethereal test account
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('✓ Email transporter configured with Ethereal (development)');
      console.log('📧 Ethereal Test Account:', testAccount.user);
    } catch (error) {
      console.error('❌ Failed to create Ethereal account:', error.message);
      transporter = null;
    }
  }
};

// Initialize transporter on module load
initializeTransporter().catch(console.error);

/**
 * Send email verification email
 * @param {String} email - Recipient email
 * @param {String} token - Verification token
 * @param {String} userName - User's name
 */
const sendVerificationEmail = async (email, token, userName) => {
  try {
    if (!transporter) {
      console.warn('Email transporter not configured. Skipping email send.');
      return { success: true, message: 'Email verification skipped (no transporter)' };
    }

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #007bff; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; border-top: 2px solid #eee; padding: 20px 0; }
            .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ExLabour!</h1>
              <p>Verify Your Email Address</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Thank you for registering with ExLabour. To complete your registration and start using our platform, please verify your email address.</p>
              
              <p>Click the button below to verify your email:</p>
              
              <center>
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </center>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #0066cc;">${verificationUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 24 hours. If you didn't create this account, please ignore this email.
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2026 ExLabour. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SENDER_EMAIL || 'noreply@exlabour.com',
      to: email,
      subject: 'Verify Your ExLabour Email Address',
      html: htmlContent,
      text: `Hi ${userName},\n\nPlease verify your email by clicking this link:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nThank you,\nExLabour Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Verification email sent:', info.response);
    
    // Log Ethereal preview URL for development
    if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl(info)) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 Email Preview URL:', previewUrl);
      console.log('🔗 Verification Link:', verificationUrl);
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return {
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
    };
  }
};

/**
 * Send welcome email (after email verification)
 * @param {String} email - Recipient email
 * @param {String} userName - User's name
 */
const sendWelcomeEmail = async (email, userName) => {
  try {
    if (!transporter) {
      console.warn('Email transporter not configured. Skipping welcome email.');
      return { success: true, message: 'Welcome email skipped (no transporter)' };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #28a745; }
            .content { padding: 30px 0; }
            .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; border-top: 2px solid #eee; padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Verified!</h1>
              <p>Welcome to the ExLabour Community</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Your email has been successfully verified. You're all set to start using ExLabour!</p>
              
              <p>Whether you're looking to post tasks or offer your services, ExLabour is the perfect platform to connect with talented individuals.</p>
              
              <p><strong>What you can do now:</strong></p>
              <ul>
                <li>Post tasks and find qualified taskers</li>
                <li>Browse and bid on available tasks</li>
                <li>Build your professional profile</li>
                <li>Earn reviews and build your reputation</li>
              </ul>
              
              <center>
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
              </center>
              
              <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2026 ExLabour. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SENDER_EMAIL || 'noreply@exlabour.com',
      to: email,
      subject: 'Welcome to ExLabour!',
      html: htmlContent,
      text: `Hi ${userName},\n\nYour email has been verified! Visit ${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard to get started.\n\nWelcome to ExLabour!\n\nExLabour Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Welcome email sent:', info.response);
    
    // Log Ethereal preview URL for development
    if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl(info)) {
      console.log('📧 Email Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      message: 'Welcome email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return {
      success: false,
      message: 'Failed to send welcome email',
      error: error.message,
    };
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
};
