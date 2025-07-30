const request = require('supertest');
const express = require('express');
const { createAlbumValidator, updateAlbumValidator, idParamValidator } = require('/src/middleware/albumValidators');
const validate = require('/src/middleware/validate');

const app = express();
app.use(express.json());
app.post('/albums', createAlbumValidator, validate, (req, res) => res.status(200).json({ ok: true }));
app.put('/albums/:id', idParamValidator, validate, updateAlbumValidator, validate, (req, res) => res.status(200).json({ ok: true }));

describe('Album Validators', () => {
    it('should fail if name is missing in create', async () => {
        const res = await request(app).post('/albums').send({});
        expect(res.statusCode).toBe(400);
    });

    it('should pass with valid create body', async () => {
        const res = await request(app).post('/albums').send({ name: 'Test' });
        expect(res.statusCode).toBe(200);
    });

    it('should fail if id is missing in update', async () => {
        const res = await request(app).put('/albums/').send({ name: 'Test' });
        expect(res.statusCode).toBe(404);
    });

    it('should pass with valid update body', async () => {
        const res = await request(app).put('/albums/abc').send({ name: 'Test updated' });
        expect(res.statusCode).toBe(200);
    });
});