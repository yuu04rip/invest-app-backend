module.exports = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    profile: {
        create: jest.fn(),
    },
    referral: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};