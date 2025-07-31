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
});