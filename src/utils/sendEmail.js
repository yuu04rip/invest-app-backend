const nodemailer = require('nodemailer');

// Configura il trasportatore per Nodemailer usando variabili d'ambiente
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // es: 'noreplyopenbanking@gmail.com'
        pass: process.env.EMAIL_PASS, // la password o app password
    },
});

// Funzione per inviare un'email con OTP
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

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email inviata a: ${to}`);
    } catch (error) {
        console.error('Errore nell\'invio dell\'email:', error);
        throw error;
    }
};

module.exports = sendEmail;