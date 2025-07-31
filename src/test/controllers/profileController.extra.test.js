const profileController = require('../../controllers/profileController');
const prisma = require('../../prisma');

jest.mock('../../prisma');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('profileController - copertura totale', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('getMyProfile', () => {
        it('404 se profilo non trovato', async () => {
            const req = { user: { userId: 1 } };
            const res = mockRes();
            prisma.profile.findUnique.mockResolvedValueOnce(null);
            await profileController.getMyProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Profile not found' });
        });
    });

    describe('updateMyProfile', () => {
        it('400 se manca name o surname', async () => {
            const req = { user: { userId: 1 }, body: { name: '', surname: '' } };
            const res = mockRes();
            await profileController.updateMyProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Name and surname are required." });
        });

        it('crea nuovo profilo se non trovato', async () => {
            const req = { user: { userId: 2 }, body: { name: 'A', surname: 'B', bio: '', sector: '', interests: '' } };
            const res = mockRes();
            prisma.profile.findUnique.mockResolvedValueOnce(null);
            prisma.profile.create.mockResolvedValueOnce({ userId: 2, name: 'A', surname: 'B' });
            await profileController.updateMyProfile(req, res);
            expect(prisma.profile.create).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ userId: 2, name: 'A', surname: 'B' });
        });

        it('catch error', async () => {
            const req = { user: { userId: 3 }, body: { name: 'A', surname: 'B' } };
            const res = mockRes();
            prisma.profile.findUnique.mockRejectedValueOnce(new Error('fail'));
            await profileController.updateMyProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to update profile');
        });
    });

    describe('getAllProfiles', () => {
        it('catch error', async () => {
            const req = {};
            const res = mockRes();
            prisma.profile.findMany.mockRejectedValueOnce(new Error('fail'));
            await profileController.getAllProfiles(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to fetch profiles');
        });
    });

    describe('getProfileById', () => {
        it('404 se profilo non trovato', async () => {
            const req = { params: { id: 123 } };
            const res = mockRes();
            prisma.profile.findUnique.mockResolvedValueOnce(null);
            await profileController.getProfileById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Profile not found' });
        });

        it('catch error', async () => {
            const req = { params: { id: 123 } };
            const res = mockRes();
            prisma.profile.findUnique.mockRejectedValueOnce(new Error('fail'));
            await profileController.getProfileById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to fetch profile');
        });
    });

    describe('updateProfileById', () => {
        it('400 se manca name o surname', async () => {
            const req = { params: { id: 1 }, body: { name: '', surname: '' } };
            const res = mockRes();
            await profileController.updateProfileById(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Name and surname are required." });
        });

        it('catch error', async () => {
            const req = { params: { id: 1 }, body: { name: 'A', surname: 'B' } };
            const res = mockRes();
            prisma.profile.update.mockRejectedValueOnce(new Error('fail'));
            await profileController.updateProfileById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to update profile');
        });
    });

    describe('deleteProfileById', () => {
        it('catch error', async () => {
            const req = { params: { id: 1 } };
            const res = mockRes();
            prisma.profile.delete.mockRejectedValueOnce(new Error('fail'));
            await profileController.deleteProfileById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to delete profile');
        });
    });
});