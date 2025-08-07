const request = require('supertest');
const app = require('../../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper per creare un utente con verifica OTP e login, pronto per i test
async function createUserAndLogin(username, role = 'imprenditore') {
    const email = `${username}@test.com`;
    const password = 'testpassword';

    // 1. Registrazione
    await request(app)
        .post('/api/auth/register')
        .send({ username, password, email, role });

    // 2. Prendi OTP dal DB
    const userDb = await prisma.user.findUnique({ where: { email } });
    if (!userDb) throw new Error(`User not found after registration: ${email}`);

    // 3. Verifica OTP
    await request(app)
        .post('/api/auth/verify-otp')
        .send({ email, otp: userDb.otpCode });

    // 4. Login
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

    if (!loginRes.body.user || !loginRes.body.token) {
        throw new Error(`Login failed for ${username}: ${JSON.stringify(loginRes.body)}`);
    }
    return { user: loginRes.body.user, token: loginRes.body.token };
}

module.exports = { createUserAndLogin };