const request = require('supertest');
const express = require('express');
const { albumIdParamValidator } = require('/src/middleware/albumAccessValidators');
const validate = require('/src/middleware/validate');

const app = express();
app.get('/access/:albumId', albumIdParamValidator, validate, (req, res) => res.status(200).json({ ok: true }));

describe('AlbumAccess Validators', () => {
    it('should fail if albumId is missing', async () => {
        const res = await request(app).get('/access/');
        expect(res.statusCode).toBe(404);
    });

    it('should fail if albumId is empty', async () => {
        const res = await request(app).get('/access/').send();
        expect(res.statusCode).toBe(404);
    });

    it('should pass with valid albumId', async () => {
        const res = await request(app).get('/access/123');
        expect(res.statusCode).toBe(200);
    });
});