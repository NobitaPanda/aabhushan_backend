const nodemailer = require('nodemailer');

let transporter;

const isProduction = () => process.env.NODE_ENV === 'production';

const getTransportConfig = () => {
  const {
    EMAIL_PROVIDER,
    EMAIL_USER,
    EMAIL_PASS,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE
  } = process.env;

  const provider = EMAIL_PROVIDER || '';
  const user = SMTP_USER || EMAIL_USER || '';
  const pass = SMTP_PASS || EMAIL_PASS || '';

  if (provider && user && pass) {
    return {
      mode: 'service',
      config: {
        service: provider,
        auth: { user, pass }
      }
    };
  }

  if (!SMTP_HOST || !SMTP_PORT || !user || !pass) {
    return null;
  }

  return {
    mode: 'smtp',
    config: {
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: { user, pass }
    }
  };
};

const getTransporter = () => {
  if (transporter) return transporter;

  const transport = getTransportConfig();
  if (!transport) {
    return null;
  }

  transporter = nodemailer.createTransport(transport.config);

  return transporter;
};

const getFromAddress = () =>
  process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@goldshop.local';

const buildFailureResult = (reason, errorMessage) => ({
  delivered: false,
  reason,
  error: errorMessage || '',
  simulated: !isProduction()
});

exports.sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return buildFailureResult('Recipient email missing');

  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.log(`[email:fallback] To: ${to} | Subject: ${subject}`);
    console.log(text || html || '');
    return buildFailureResult('Email service is not configured');
  }

  try {
    const info = await mailTransporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html
    });

    return {
      delivered: true,
      reason: '',
      messageId: info.messageId || '',
      accepted: info.accepted || []
    };
  } catch (err) {
    console.error('[email:error]', err.message);
    return buildFailureResult('Email could not be sent', err.message);
  }
};

exports.getEmailServiceStatus = () => {
  const transport = getTransportConfig();
  return {
    configured: Boolean(transport),
    mode: transport?.mode || 'unconfigured',
    provider: process.env.EMAIL_PROVIDER || process.env.SMTP_HOST || ''
  };
};
