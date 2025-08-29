

module.exports= (name, verificationLink) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      .container {
        max-width: 600px;
        margin: auto;
        padding: 30px;
        border-radius: 10px;
        background-color: #f9f9f9;
        font-family: Arial, sans-serif;
        border: 1px solid #ddd;
      }
      .btn {
        display: inline-block;
        background-color: #4CAF50;
        color: white;
        padding: 12px 20px;
        text-decoration: none;
        border-radius: 6px;
        margin-top: 20px;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #999;
      }
      .warning {
        margin-top: 20px;
        font-size: 13px;
        color: #b00;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Welcome to TalkBridge!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for signing up. Please click the button below to verify your email address:</p>
      <a class="btn" href="${verificationLink}">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
      
      <p class="warning">
        ⚠️ If you did not sign up for TalkBridge, please ignore this email. Do not click the link.
      </p>
      
      <div class="footer">This verification link will expire in 24 hours.</div>
    </div>
  </body>
</html>`
