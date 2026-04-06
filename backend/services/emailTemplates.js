const getWelcomeEmailHtml = (userName, loginUrl, tempPassword = null) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #0f172a; text-align: center;">Welcome to Portfolio<span style="color: #3b82f6;">Pro</span>!</h2>
      <p style="font-size: 16px; color: #334155;">Hello ${userName},</p>
      <p style="font-size: 16px; color: #334155;">We are thrilled to have you on board! Let's get started on tracking and growing your stock portfolio.</p>
      
      ${tempPassword ? `
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px dashed #cbd5e1;">
        <p style="margin: 0; color: #475569;">Your temporary login credentials are:</p>
        <p style="font-weight: bold; font-size: 18px; text-align: center; margin: 10px 0;">${tempPassword}</p>
        <p style="margin: 0; color: #ef4444; font-size: 14px;">Please change your password immediately upon logging in for the first time.</p>
      </div>` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Log in to your account</a>
      </div>
      
      <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px;">
        If you did not sign up for this account, please ignore this email.
      </p>
    </div>
  `;
};

const getLoginAlertHtml = (userName, time, device, location) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #0f172a;">New Login Detected</h2>
      <p style="font-size: 16px; color: #334155;">Hello ${userName},</p>
      <p style="font-size: 16px; color: #334155;">We noticed a new login to your PortfolioPro account. If this was you, no action is required.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
        <p style="margin: 5px 0;"><strong>Device/Browser:</strong> ${device}</p>
        <p style="margin: 5px 0;"><strong>Approximate Location:</strong> ${location}</p>
      </div>

      <p style="font-size: 14px; color: #ef4444; font-weight: bold; margin-top: 20px;">
        If you do not recognize this activity, please secure your account and reset your password immediately.
      </p>
    </div>
  `;
};

const getGeneralNotificationHtml = (userName, title, messageHtml) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #0f172a;">${title}</h2>
      <p style="font-size: 16px; color: #334155;">Hello ${userName},</p>
      
      <div style="margin: 20px 0; font-size: 16px; color: #334155; line-height: 1.5;">
        ${messageHtml}
      </div>

      <div style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        This is an automated notification from PortfolioPro.
      </div>
    </div>
  `;
};

const getOtpEmailHtml = (userName, otpCode) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #0f172a;">Your Verification Code</h2>
      <p style="font-size: 16px; color: #334155;">Hello ${userName},</p>
      <p style="font-size: 16px; color: #334155;">Please use the verification code below to complete your action:</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3b82f6;">${otpCode}</span>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
        This code will expire in 10 minutes. Do not share it with anyone.
      </p>
    </div>
  `;
};

module.exports = {
  getWelcomeEmailHtml,
  getLoginAlertHtml,
  getGeneralNotificationHtml,
  getOtpEmailHtml,
};
