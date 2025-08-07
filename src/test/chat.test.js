const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createUserAndLogin } = require('./utils/testHelpers');
jest.mock('../utils/sendEmail', () => ({
    sendEmail: jest.fn().mockResolvedValue(),
    sendResetOtpEmail: jest.fn().mockResolvedValue(),
}));
let userA, tokenA;
let userB, tokenB;
let userC, tokenC;

beforeEach(async () => {
    // Pulizia del database per evitare conflitti tra i test
    await prisma.message.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.chatRequest.deleteMany();
    await prisma.user.deleteMany();

    // Ricreiamo gli utenti
    ({ user: userA, token: tokenA } = await createUserAndLogin('userA'));
    ({ user: userB, token: tokenB } = await createUserAndLogin('userB'));
    ({ user: userC, token: tokenC } = await createUserAndLogin('userC'));
});

test('userA invia una richiesta a userB', async () => {
    const res = await request(app)
        .post('/api/chat/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ toUserId: userB.id });

    expect(res.statusCode).toBe(200);
    expect(res.body.chatRequest.fromUserId).toBe(userA.id);
    expect(res.body.chatRequest.toUserId).toBe(userB.id);
});

test('userB accetta la richiesta di userA', async () => {
    // A → B
    const res1 = await request(app)
        .post('/api/chat/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ toUserId: userB.id });

    expect(res1.statusCode).toBe(200);
    const requestId = res1.body.chatRequest.id;

    const res2 = await request(app)
        .post(`/api/chat/request/${requestId}/accept`)
        .set('Authorization', `Bearer ${tokenB}`);

    expect(res2.statusCode).toBe(200);
    console.log('res2.body.chat:', res2.body.chat);
    expect(res2.body.chat.participants).toContain(userA.id);
    expect(res2.body.chat.participants).toContain(userB.id);
});

test('userA invia una seconda richiesta e userB la rifiuta', async () => {
    // A → B
    const res1 = await request(app)
        .post('/api/chat/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ toUserId: userB.id });

    expect(res1.statusCode).toBe(200);
    const newRequestId = res1.body.chatRequest.id;

    // B rifiuta
    const res2 = await request(app)
        .post(`/api/chat/request/${newRequestId}/reject`)
        .set('Authorization', `Bearer ${tokenB}`);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.success).toBe(true);
});
