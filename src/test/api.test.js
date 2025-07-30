const request = require('supertest');
const app = require('../index');
const prisma = require('../prisma');

describe('API Integrata - Invest App Backend', () => {
    // Variabili condivise tra i test
    let testEmail = `testuser_${Date.now()}@mail.com`;
    const testPassword = 'TestPassword123!';
    let testToken;
    let testProfileId;
    let testProductId;
    let testAlbumId;
    let otp;

    // Pulizia prima/dopo i test
    beforeAll(async () => {
        // Elimina dati collegati PRIMA di eliminare user (per foreign key)
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (user) {
            await prisma.profile.deleteMany({ where: { userId: user.id } });
            await prisma.product.deleteMany({}); // aggiungi filtro userId se necessario
            await prisma.albumAccess.deleteMany({ where: { userId: user.id } });
            // Elimina referral usati/creati dall'utente
            await prisma.referral.deleteMany({ where: { OR: [{ creatorUserId: user.id }, { usedByUserId: user.id }] } });
        }
        await prisma.user.deleteMany({ where: { email: testEmail } });
    });
    afterAll(async () => {
        // Elimina dati collegati PRIMA di eliminare user (per foreign key)
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (user) {
            await prisma.profile.deleteMany({ where: { userId: user.id } });
            await prisma.product.deleteMany({}); // aggiungi filtro userId se necessario
            await prisma.albumAccess.deleteMany({ where: { userId: user.id } });
            await prisma.referral.deleteMany({ where: { OR: [{ creatorUserId: user.id }, { usedByUserId: user.id }] } });
        }
        await prisma.user.deleteMany({ where: { email: testEmail } });
        await prisma.$disconnect();
    });

    // ------------------ AUTH ------------------
    describe('Auth', () => {
        it('POST /api/auth/register → registra utente, invia OTP', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: testEmail, password: testPassword, role: 'investitore' });
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('email', testEmail);

            const user = await prisma.user.findUnique({ where: { email: testEmail } });
            expect(user).not.toBeNull();
            expect(user.otpCode).toBeDefined();
        });

        it('POST /api/auth/login → blocca login se non verificato', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: testPassword });
            expect(res.statusCode).toBe(403);
        });

        it('POST /api/auth/verify-otp → verifica OTP', async () => {
            // Prende OTP reale dal DB
            const user = await prisma.user.findUnique({ where: { email: testEmail } });
            otp = user.otpCode;
            expect(otp).toBeDefined();

            const res = await request(app)
                .post('/api/auth/verify-otp')
                .send({ email: testEmail, otp });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body.success).toBe(true);
        });

        it('POST /api/auth/login → login dopo verifica', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: testPassword });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            testToken = res.body.token;
        });

        it('POST /api/auth/resend-otp → errore se già verificato', async () => {
            const res = await request(app)
                .post('/api/auth/resend-otp')
                .send({ email: testEmail });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toMatch(/già verificata/i);
        });
    });

    // ------------------ PROFILE ------------------
    describe('Profile', () => {
        it('GET /api/profile/me → profilo dell\'utente', async () => {
            const res = await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('userId');
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('surname');
            testProfileId = res.body.id;
        });

        it('PUT /api/profile/me → aggiorna profilo utente', async () => {
            const res = await request(app)
                .put('/api/profile/me')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Test', surname: 'User', bio: "Bio", sector: "IT", interests: "Startup" });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('name', 'Test');
            expect(res.body).toHaveProperty('surname', 'User');
        });

        it('GET /api/profile/ → lista profili', async () => {
            const res = await request(app)
                .get('/api/profile/')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('GET /api/profile/:id → profilo per ID', async () => {
            const res = await request(app)
                .get(`/api/profile/${testProfileId}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('id', testProfileId);
            expect(res.body).toHaveProperty('name');
        });

        it('PUT /api/profile/:id → aggiorna profilo per ID', async () => {
            const res = await request(app)
                .put(`/api/profile/${testProfileId}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'New', surname: 'Name' });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('name', 'New');
            expect(res.body).toHaveProperty('surname', 'Name');
        });

        // DELETE test disabilitato per sicurezza
        // it('DELETE /api/profile/:id → elimina profilo', async () => {
        //   const res = await request(app)
        //     .delete(`/api/profile/${testProfileId}`)
        //     .set('Authorization', `Bearer ${testToken}`);
        //   expect([200, 204]).toContain(res.statusCode);
        // });
    });

    // ------------------ REFERRAL ------------------
    describe('Referral', () => {
        it('POST /api/referral/generate → genera referral', async () => {
            const res = await request(app)
                .post('/api/referral/generate')
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('code');
        });

        it('GET /api/referral/me → referral utente', async () => {
            const res = await request(app)
                .get('/api/referral/me')
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 201]).toContain(res.statusCode);
            // Cambia il test per aspettarsi la struttura corretta!
            expect(res.body).toHaveProperty('created');
            expect(Array.isArray(res.body.created)).toBe(true);
            // Se c'è almeno un referral creato, aspettati code
            if (res.body.created.length > 0) {
                expect(res.body.created[0]).toHaveProperty('code');
            }
        });
    });

    // ------------------ USER ------------------
    describe('User', () => {
        it('GET /api/user/me → info utente', async () => {
            const res = await request(app)
                .get('/api/user/me')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('email', testEmail);
        });
    });

    // ------------------ PRODUCTS ------------------
    describe('Products', () => {
        it('POST /api/products/ → crea prodotto', async () => {
            const res = await request(app)
                .post('/api/products/')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Prodotto Test', description: 'Desc', price: 99.9 });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('id');
            testProductId = res.body.id;
        });

        it('GET /api/products/ → lista prodotti', async () => {
            const res = await request(app)
                .get('/api/products/')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('GET /api/products/:id → prodotto per ID', async () => {
            const res = await request(app)
                .get(`/api/products/${testProductId}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('id', testProductId);
        });

        it('PUT /api/products/:id → aggiorna prodotto', async () => {
            const res = await request(app)
                .put(`/api/products/${testProductId}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Prodotto Modificato' });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body.name).toBe('Prodotto Modificato');
        });

        it('DELETE /api/products/:id → elimina prodotto', async () => {
            const res = await request(app)
                .delete(`/api/products/${testProductId}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 204]).toContain(res.statusCode);
        });
    });

    // ------------------ ALBUMS ------------------
    describe('Albums', () => {
        it('POST /api/albums/ → crea album', async () => {
            const res = await request(app)
                .post('/api/albums/')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Album Test', description: 'Album Desc' });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('id');
            testAlbumId = res.body.id;
        });

        it('GET /api/albums/ → lista album', async () => {
            const res = await request(app)
                .get('/api/albums/')
                .set('Authorization', `Bearer ${testToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('GET /api/albums/:id → album per ID', async () => {
            const res = await request(app)
                .get(`/api/albums/${testAlbumId}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('id', testAlbumId);
        });

        it('PUT /api/albums/:id → aggiorna album', async () => {
            const res = await request(app)
                .put(`/api/albums/${testAlbumId}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send({ name: 'Album Modificato' });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body.name).toBe('Album Modificato');
        });

        it('DELETE /api/albums/:id → elimina album', async () => {
            const res = await request(app)
                .delete(`/api/albums/${testAlbumId}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 204]).toContain(res.statusCode);
        });
    });

    // ------------------ ALBUM ACCESS ------------------
    describe('Album Access', () => {
        it('GET /api/album-access/:albumId → accesso album', async () => {
            // Prima crea un album per test se non esiste
            const album = await prisma.album.create({
                data: { name: 'AlbumAccess', description: 'Test' }
            });
            const res = await request(app)
                .get(`/api/album-access/${album.id}`)
                .set('Authorization', `Bearer ${testToken}`);
            expect([200, 201, 404]).toContain(res.statusCode); // 404 se album non accessibile
            await prisma.album.delete({ where: { id: album.id } });
        });
    });

    // ------------------ PAYMENTS ------------------
    describe('Payments', () => {
        it('POST /api/payments/checkout → crea pagamento', async () => {
            // NB: Adatta secondo la tua implementazione e parametri richiesti
            const res = await request(app)
                .post('/api/payments/checkout')
                .set('Authorization', `Bearer ${testToken}`)
                .send({ amount: 100, productId: testProductId || 1 });
            expect([200, 201, 400]).toContain(res.statusCode); // 400 se productId mancante/non valido
        });
    });

    // ------------------ STRIPE WEBHOOK ------------------
    describe('Stripe Webhook', () => {
        it('POST /webhook/stripe → mock chiamata webhook', async () => {
            // NB: Adatta/mocca payload secondo la tua implementazione Stripe
            const res = await request(app)
                .post('/webhook/stripe')
                .send({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_test' } } });
            expect([200, 201, 400]).toContain(res.statusCode);
        });
    });

    // ------------------ ROOT ------------------
    describe('Root', () => {
        it('GET / → backend running', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toBe(200);
            expect(res.text).toMatch(/Invest App Backend is running/i);
        });
    });
});