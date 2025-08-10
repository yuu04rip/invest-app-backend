const profileController = require('../../controllers/profileController');

// Mock esplicito del client Prisma usato dal controller
jest.mock('../../prisma', () => ({
    profile: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require('../../prisma');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

describe('profileController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMyProfile', () => {
        it('401 se utente non autenticato', async () => {
            const req = { user: undefined };
            const res = mockRes();

            await profileController.getMyProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
            expect(prisma.profile.findUnique).not.toHaveBeenCalled();
        });

        it('404 se profilo non trovato', async () => {
            const req = { user: { userId: 'u1' } };
            const res = mockRes();
            prisma.profile.findUnique.mockResolvedValueOnce(null);

            await profileController.getMyProfile(req, res);

            expect(prisma.profile.findUnique).toHaveBeenCalledWith({ where: { userId: 'u1' } });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Profile not found' });
        });

        it('200 con profilo', async () => {
            const req = { user: { userId: 'u1' } };
            const res = mockRes();
            const profile = { id: 'p1', userId: 'u1', name: 'Mario', surname: 'Rossi' };
            prisma.profile.findUnique.mockResolvedValueOnce(profile);

            await profileController.getMyProfile(req, res);

            expect(res.json).toHaveBeenCalledWith(profile);
        });

        it('500 su errore prisma', async () => {
            const req = { user: { userId: 'u1' } };
            const res = mockRes();
            prisma.profile.findUnique.mockRejectedValueOnce(new Error('fail'));

            await profileController.getMyProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to get profile');
        });
    });

    describe('updateMyProfile', () => {
        it('401 se utente non autenticato', async () => {
            const req = { user: undefined, body: { name: 'A', surname: 'B' } };
            const res = mockRes();

            await profileController.updateMyProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
            expect(prisma.profile.upsert).not.toHaveBeenCalled();
        });

        it('400 se manca name o surname (dopo trim)', async () => {
            const req = { user: { userId: 'u1' }, body: { name: '  ', surname: '' } };
            const res = mockRes();

            await profileController.updateMyProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Name and surname are required.' });
            expect(prisma.profile.upsert).not.toHaveBeenCalled();
        });

        it('200 upsert profilo con campi opzionali null quando vuoti', async () => {
            const req = {
                user: { userId: 'u1' },
                body: { name: 'A', surname: 'B', bio: '  ', sector: '', interests: undefined },
            };
            const res = mockRes();
            const updated = { id: 'p1', userId: 'u1', name: 'A', surname: 'B', bio: null, sector: null, interests: null };

            prisma.profile.upsert.mockResolvedValueOnce(updated);

            await profileController.updateMyProfile(req, res);

            expect(prisma.profile.upsert).toHaveBeenCalledWith({
                where: { userId: 'u1' },
                update: { name: 'A', surname: 'B', bio: null, sector: null, interests: null },
                create: { userId: 'u1', name: 'A', surname: 'B', bio: null, sector: null, interests: null },
            });
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('500 su errore prisma.upsert', async () => {
            const req = { user: { userId: 'u1' }, body: { name: 'A', surname: 'B' } };
            const res = mockRes();
            prisma.profile.upsert.mockRejectedValueOnce(new Error('fail'));

            await profileController.updateMyProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to update profile');
        });
    });

    describe('getAllProfiles', () => {
        it('200 con lista profili', async () => {
            const req = {};
            const res = mockRes();
            const list = [{ id: 'p1' }, { id: 'p2' }];
            prisma.profile.findMany.mockResolvedValueOnce(list);

            await profileController.getAllProfiles(req, res);

            expect(prisma.profile.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
            expect(res.json).toHaveBeenCalledWith(list);
        });

        it('500 su errore prisma.findMany', async () => {
            const req = {};
            const res = mockRes();
            prisma.profile.findMany.mockRejectedValueOnce(new Error('fail'));

            await profileController.getAllProfiles(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to fetch profiles');
        });
    });

    describe('getProfileById', () => {
        it('404 se non trovato', async () => {
            const req = { params: { id: 'pX' } };
            const res = mockRes();
            prisma.profile.findUnique.mockResolvedValueOnce(null);

            await profileController.getProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Profile not found' });
        });

        it('200 con profilo', async () => {
            const req = { params: { id: 'p1' } };
            const res = mockRes();
            const profile = { id: 'p1' };
            prisma.profile.findUnique.mockResolvedValueOnce(profile);

            await profileController.getProfileById(req, res);

            expect(res.json).toHaveBeenCalledWith(profile);
        });

        it('500 su errore prisma.findUnique', async () => {
            const req = { params: { id: 'p1' } };
            const res = mockRes();
            prisma.profile.findUnique.mockRejectedValueOnce(new Error('fail'));

            await profileController.getProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to fetch profile');
        });
    });

    describe('updateProfileById', () => {
        it('400 se manca name o surname (dopo trim)', async () => {
            const req = { params: { id: 'p1' }, body: { name: ' ', surname: '' } };
            const res = mockRes();

            await profileController.updateProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Name and surname are required.' });
            expect(prisma.profile.update).not.toHaveBeenCalled();
        });

        it('200 aggiorna profilo', async () => {
            const req = {
                params: { id: 'p1' },
                body: { name: 'A', surname: 'B', bio: '', sector: '  ', interests: undefined },
            };
            const res = mockRes();
            const updated = { id: 'p1', name: 'A', surname: 'B', bio: null, sector: null, interests: null };
            prisma.profile.update.mockResolvedValueOnce(updated);

            await profileController.updateProfileById(req, res);

            expect(prisma.profile.update).toHaveBeenCalledWith({
                where: { id: 'p1' },
                data: { name: 'A', surname: 'B', bio: null, sector: null, interests: null },
            });
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('404 su P2025', async () => {
            const req = { params: { id: 'p404' }, body: { name: 'A', surname: 'B' } };
            const res = mockRes();
            const err = new Error('not found');
            err.code = 'P2025';
            prisma.profile.update.mockRejectedValueOnce(err);

            await profileController.updateProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Profile not found' });
        });

        it('500 su errore generico', async () => {
            const req = { params: { id: 'p1' }, body: { name: 'A', surname: 'B' } };
            const res = mockRes();
            prisma.profile.update.mockRejectedValueOnce(new Error('fail'));

            await profileController.updateProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to update profile');
        });
    });

    describe('deleteProfileById', () => {
        it('204 su successo', async () => {
            const req = { params: { id: 'p1' } };
            const res = mockRes();
            prisma.profile.delete.mockResolvedValueOnce({});

            await profileController.deleteProfileById(req, res);

            expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('404 su P2025', async () => {
            const req = { params: { id: 'p404' } };
            const res = mockRes();
            const err = new Error('not found');
            err.code = 'P2025';
            prisma.profile.delete.mockRejectedValueOnce(err);

            await profileController.deleteProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Profile not found' });
        });

        it('500 su errore generico', async () => {
            const req = { params: { id: 'p1' } };
            const res = mockRes();
            prisma.profile.delete.mockRejectedValueOnce(new Error('fail'));

            await profileController.deleteProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json.mock.calls[0][0].error).toBe('Unable to delete profile');
        });
    });
});