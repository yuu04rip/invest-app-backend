const request = require('supertest');
const express = require('express');
const albumController = require('/src/controllers/albumController');
const prisma = require('../../prisma');
jest.mock('/src/prisma', () => ({
    album: {
        create: jest.fn(({ data }) => Promise.resolve({ id: '1', ...data })),
        findMany: jest.fn(() => Promise.resolve([{ id: '1', name: 'Album' }])),
        findUnique: jest.fn(({ where }) => Promise.resolve(where.id === 'notfound' ? null : { id: where.id, name: 'Album' })),
        update: jest.fn(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
        delete: jest.fn(({ where }) => Promise.resolve({ id: where.id })),
    },
}));

const app = express();
app.use(express.json());
app.post('/albums', albumController.createAlbum);
app.get('/albums', albumController.getAllAlbums);
app.get('/albums/:id', albumController.getAlbumById);
app.put('/albums/:id', albumController.updateAlbumById);
app.delete('/albums/:id', albumController.deleteAlbumById);

describe('Album Controller', () => {
    it('should create an album', async () => {
        const res = await request(app).post('/albums').send({ name: 'Test album' });
        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe('Test album');
    });

    it('should get all albums', async () => {
        const res = await request(app).get('/albums');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get an album by id', async () => {
        const res = await request(app).get('/albums/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe('1');
    });

    it('should return 404 for non-existing album', async () => {
        const res = await request(app).get('/albums/notfound');
        expect(res.statusCode).toBe(404);
    });

    it('should update an album', async () => {
        const res = await request(app).put('/albums/1').send({ name: 'Updated' });
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Updated');
    });

    it('should delete an album', async () => {
        const res = await request(app).delete('/albums/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe('1');
    });
});
describe('Album Controller extra coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if album name is missing', async () => {
        const res = await request(app).post('/albums').send({ productIds: [] });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Name is required');
    });

    it('should handle error in createAlbum', async () => {
        prisma.album.create.mockRejectedValueOnce(new Error('fail'));
        const res = await request(app).post('/albums').send({ name: 'test' });
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Unable to create album');
    });

    it('should handle error in getAllAlbums', async () => {
        prisma.album.findMany.mockRejectedValueOnce(new Error('fail'));
        const res = await request(app).get('/albums');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Unable to fetch albums');
    });

    it('should handle error in getAlbumById', async () => {
        prisma.album.findUnique.mockRejectedValueOnce(new Error('fail'));
        const res = await request(app).get('/albums/err');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Unable to fetch album');
    });

    it('should handle error in updateAlbumById', async () => {
        prisma.album.update.mockRejectedValueOnce(new Error('fail'));
        const res = await request(app).put('/albums/1').send({ name: 'test' });
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Unable to update album');
    });

    it('should handle error in deleteAlbumById', async () => {
        prisma.album.delete.mockRejectedValueOnce(new Error('fail'));
        const res = await request(app).delete('/albums/1');
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe('Unable to delete album');
    });
});