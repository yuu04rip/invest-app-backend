const request = require('supertest');
const express = require('express');
const albumAccessController = require('/src/controllers/albumAccessController');
jest.mock('/src/prisma', () => ({
    albumAccess: {
        findFirst: jest.fn(({ where }) =>
            Promise.resolve(where.albumId === 'has-access' ? { id: 1 } : null)
        ),
    },
}));

const app = express();
app.use((req, res, next) => { req.user = { id: 'user1' }; next(); });
app.get('/album-access/:albumId', albumAccessController.hasAlbumAccess);

describe('AlbumAccess Controller', () => {
    it('should return accessGranted true if access exists', async () => {
        const res = await request(app).get('/album-access/has-access');
        expect(res.statusCode).toBe(200);
        expect(res.body.accessGranted).toBe(true);
    });

    it('should return accessGranted false if access does not exist', async () => {
        const res = await request(app).get('/album-access/no-access');
        expect(res.statusCode).toBe(200);
        expect(res.body.accessGranted).toBe(false);
    });
});