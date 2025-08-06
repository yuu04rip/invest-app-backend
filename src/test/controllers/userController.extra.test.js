const userController = require('../../controllers/userController');
const prisma = require('../../prisma');

jest.mock('../../prisma');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('userController.me', () => {
    beforeEach(() => jest.clearAllMocks());

    it('404 se utente non trovato', async () => {
        const req = { user: { userId: 123 } };
        const res = mockRes();
        prisma.user.findUnique.mockResolvedValueOnce(null);

        await userController.me(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('ritorna dati utente', async () => {
        const user = {
            id: 123,
            email: 'test@example.com',
            username: 'testuser',
            profileImageUrl: 'http://img',
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            Profile: {},
            referrals: [],
            usedReferrals: [],
        };
        const req = { user: { userId: 123 } };
        const res = mockRes();
        prisma.user.findUnique.mockResolvedValueOnce(user);

        await userController.me(req, res);

        expect(res.json).toHaveBeenCalledWith(user);
    });

    it('catch error', async () => {
        const req = { user: { userId: 123 } };
        const res = mockRes();
        prisma.user.findUnique.mockRejectedValueOnce(new Error('fail'));

        await userController.me(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json.mock.calls[0][0].error).toBe('Server error');
    });
});

describe('userController.checkUsername', () => {
    beforeEach(() => jest.clearAllMocks());

    it('400 se manca username', async () => {
        const req = { query: {} };
        const res = mockRes();
        await userController.checkUsername(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Username obbligatorio' });
    });

    it('available true se non esiste', async () => {
        const req = { query: { username: 'pippo' } };
        const res = mockRes();
        prisma.user.findUnique.mockResolvedValueOnce(null);
        await userController.checkUsername(req, res);
        expect(res.json).toHaveBeenCalledWith({ available: true });
    });

    it('available false se esiste', async () => {
        const req = { query: { username: 'pippo' } };
        const res = mockRes();
        prisma.user.findUnique.mockResolvedValueOnce({ id: '1', username: 'pippo' });
        await userController.checkUsername(req, res);
        expect(res.json).toHaveBeenCalledWith({ available: false });
    });
});

describe('userController.updateMe', () => {
    beforeEach(() => jest.clearAllMocks());

    it('400 se manca username', async () => {
        const req = { user: { userId: '1' }, body: {} };
        const res = mockRes();
        await userController.updateMe(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Username obbligatorio' });
    });

    it('409 se username già esistente', async () => {
        const req = { user: { userId: '2' }, body: { username: 'pippo' } };
        const res = mockRes();
        prisma.user.findUnique.mockResolvedValueOnce({ id: '1', username: 'pippo' });
        await userController.updateMe(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Username già esistente' });
    });

    it('aggiorna utente', async () => {
        const req = { user: { userId: '1' }, body: { username: 'nuovo', profileImageUrl: 'http://img' } };
        const res = mockRes();
        prisma.user.findUnique.mockResolvedValueOnce(null);
        prisma.user.update.mockResolvedValueOnce({ id: '1', username: 'nuovo', profileImageUrl: 'http://img' });
        await userController.updateMe(req, res);
        expect(prisma.user.update).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ id: '1', username: 'nuovo', profileImageUrl: 'http://img' });
    });

    it('catch error', async () => {
        const req = { user: { userId: '1' }, body: { username: 'a' } };
        const res = mockRes();
        prisma.user.findUnique.mockRejectedValueOnce(new Error('fail'));
        await userController.updateMe(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json.mock.calls[0][0].error).toBe('Unable to update user');
    });
});