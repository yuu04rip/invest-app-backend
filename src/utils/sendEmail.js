const nodemailer = require('nodemailer');

// Configura il trasportatore per Nodemailer usando variabili d'ambiente
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Funzione per inviare un'email con OTP per registrazione/verifica
const sendEmail = async (to, otp, verifyUrl) => {
    const subject = 'Codice di verifica';
    const text = `
Per verificare la tua identità, utilizza il codice seguente:

${otp}

Oppure clicca sul link per verificare:
${verifyUrl}?email=${encodeURIComponent(to)}&otp=${otp}

Non condividere questo OTP con nessuno. Il nostro team di assistenza clienti non ti chiederà mai la tua password, OTP, carta di credito o informazioni bancarie.

Ci auguriamo di vederti presto.
    `;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email inviata a: ${to}`);
};

// Funzione per inviare OTP per reset password
const sendResetOtpEmail = async (to, otp) => {
    const subject = 'OTP per reset password';
    const text = `
Hai richiesto di resettare la password.
Il tuo codice OTP è: ${otp}
Il codice scade tra 10 minuti.

Se non hai richiesto questa operazione ignora questa email.
    `;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Reset password OTP inviata a: ${to}`);
};

module.exports = {
    sendEmail,
    sendResetOtpEmail,
};