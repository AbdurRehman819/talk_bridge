module.exports = (name, resetLink) => `<!DOCTYPE html>
<html>
  <head>
    <style>
      .container {
        max-width: 600px;
        margin: auto;
        padding: 30px;
        border-radius: 10px;
        background-color: #fffafa;
        font-family: Arial, sans-serif;
        border: 1px solid #ddd;
      }
      .btn {
        display: inline-block;
        background-color: #f44336;
        color: white;
        padding: 12px 20px;
        text-decoration: none;
        border-radius: 6px;
        margin-top: 20px;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #888;
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
      <h2>Password Reset Request</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your TalkBridge password. If this was you, click the button below:</p>
      <a class="btn" href="${resetLink}">Reset Password</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      
      <p class="warning">
        ⚠️ If you did not request a password reset, you can safely ignore this email. Your account is still secure.
      </p>
      
      <div class="footer">This link will expire in 10 minutes.</div>
    </div>
  </body>
</html>`
