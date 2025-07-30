const request = require('supertest');
const app = require('../index');
const prisma = require('../prisma');

describe('API Error Cases - Invest App Backend', () => {
    let testEmail = `erruser_${Date.now()}@mail.com`;
    const testPassword = 'ErrPassw0rd!';
    let testToken;

    beforeAll(async () => {
        await cleanupTestUser(testEmail);
        await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: testPassword, role: 'investitore' });
        // Verifica OTP
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        await request(app)
            .post('/api/auth/verify-otp')
            .send({ email: testEmail, otp: user.otpCode });
        // Login
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testEmail, password: testPassword });
        testToken = res.body.token;
    });

    afterAll(async () => {
        await cleanupTestUser(testEmail);
        await prisma.$disconnect();
    });

    // Utility di pulizia per evitare errori di foreign key
    async function cleanupTestUser(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.profile.deleteMany({ where: { userId: user.id } });
            await prisma.albumAccess.deleteMany({ where: { userId: user.id } });
            // Elimina referral creati o usati dall'utente
            await prisma.referral.deleteMany({ where: { creatorUserId: user.id } });
            await prisma.referral.deleteMany({ where: { usedByUserId: user.id } });
            // Ora elimina l'utente
            await prisma.user.deleteMany({ where: { email } });
        }
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
            const res = await request(app)
                .get('/api/profile/me');
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
            const res = await request(app)
                .get('/api/endpoint/doesnotexist');
            expect(res.statusCode).toBe(404);
        });
    });
});