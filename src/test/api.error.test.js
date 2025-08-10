// Usa prisma reale per questa suite di integrazione
jest.unmock('../prisma');
jest.resetModules();

// Mocka side-effects che non servono ai test
jest.mock('../middleware/nsfwMiddleware', () => (req, res, next) => next());
jest.mock('../utils/sendEmail', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

const app = require('../index');           // importa l'app solo ora
const prisma = require('../prisma');       // stesso prisma dell'app
const request = require('supertest');

describe('API Error Cases - Invest App Backend', () => {
    const testEmail = `erruser_${Date.now()}@mail.com`;
    const testPassword = 'ErrPassw0rd!';
    let testToken;
    let testUser;

    beforeAll(async () => {
        await cleanupTestUser(testEmail);

        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: testPassword, role: 'investitore' });

        if (registerRes.status !== 201 && registerRes.status !== 200) {
            console.error('Register failed in error test:', registerRes.status, registerRes.body);
            throw new Error('Register failed in error test');
        }

        // Piccolo retry in caso di ritardo
        testUser = await findUserWithRetry(testEmail, 8, 50);
        if (!testUser) {
            console.error('User not found after registration (error test):', testEmail);
            throw new Error('User not found after registration (error test)');
        }

        const otpRes = await request(app)
            .post('/api/auth/verify-otp')
            .send({ email: testEmail, otp: testUser.otpCode });

        if (otpRes.status !== 200) {
            console.error('OTP verify failed in error test:', otpRes.status, otpRes.body);
            throw new Error('OTP verify failed in error test');
        }

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: testPassword });

        testToken = loginRes.body.token;
    }, 30000);

    afterAll(async () => {
        await cleanupTestUser(testEmail);
        await prisma.$disconnect();
    });

    async function cleanupTestUser(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.profile.deleteMany({ where: { userId: user.id } });
            await prisma.albumAccess.deleteMany({ where: { userId: user.id } });
            await prisma.referral.deleteMany({ where: { creatorUserId: user.id } });
            await prisma.referral.deleteMany({ where: { usedByUserId: user.id } });
            await prisma.user.deleteMany({ where: { email } });
        }
    }

    async function findUserWithRetry(email, retries = 5, delayMs = 50) {
        for (let i = 0; i < retries; i++) {
            const u = await prisma.user.findUnique({ where: { email } });
            if (u) return u;
            await new Promise(r => setTimeout(r, delayMs));
        }
        return null;
    }

    // --- Auth Error Cases ---
    describe('Auth errors', () => {
        it('non login con password sbagliata', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: 'wrongPassword' });
            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBeDefined();
        });

        it('non login con email inesistente', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@mail.com', password: 'anyPassword' });
            expect(res.statusCode).toBe(401);
        });

        it('verify otp errato', async () => {
            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ email: testEmail, otp: '000000' });
            expect([400, 401]).toContain(res.statusCode);
        });
    });

    // --- Products Error Cases ---
    describe('Products errors', () => {
        it('create prodotto senza nome', async () => {
            const res = await request(app)
                .post('/api/products/')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ description: 'No name', price: 10 });
            expect(res.statusCode).toBe(400);
        });

        it('update prodotto senza autorizzazione', async () => {
            const res = await request(app)
                .put('/api/products/invalidId')
                .send({ name: 'Invalid' });
            expect([401, 403]).toContain(res.statusCode);
        });
    });

    // --- Referral Error Cases ---
    describe('Referral errors', () => {
        it('usa referral code non valido', async () => {
            const res = await request(app)
                .post('/api/referral/use')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ code: 'INVALIDCODE' });
            expect([400, 404]).toContain(res.statusCode);
        });
    });

    // --- Profile Error Cases ---
    describe('Profile errors', () => {
        it('get profilo senza token', async () => {
            const res = await request(app).get('/api/profile/me');
            expect([401, 403]).toContain(res.statusCode);
        });

        it('update profilo con dati mancanti', async () => {
            const res = await request(app)
                .put('/api/profile/me')
                .set('Authorization', `Bearer ${testToken}`)
                .send({});
            expect(res.statusCode).toBe(400);
        });
    });

    // --- Common Errors ---
    describe('Common errors', () => {
        it('404 su endpoint inesistente', async () => {
            const res = await request(app).get('/api/endpoint/doesnotexist');
            expect(res.statusCode).toBe(404);
        });
    });
});