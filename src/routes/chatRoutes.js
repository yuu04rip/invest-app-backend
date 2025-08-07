const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const mediaUpload = require('../middleware/mediaUpload');
const chatParticipant = require('../middleware/chatParticipant');
const chatRateLimiter = require('../middleware/chatRateLimiter');
const moderateMedia = require('../middleware/moderateMedia');
const nsfwMiddleware = require('../middleware/nsfwMiddleware');
const {
    sendChatRequest,
    listReceivedRequests,
    acceptChatRequest,
    rejectChatRequest,
    getChatMessages,
    sendMessage,
    uploadMedia,
    reportAbuse,
    blockChat,
    closeChat // opzionale
} = require('../controllers/chatController');

// Tutte le route sono protette!
router.use(authenticate);

// Chat request management
router.post('/request', sendChatRequest);
router.get('/requests', listReceivedRequests);
router.post('/request/:id/accept', acceptChatRequest);
router.post('/request/:id/reject', rejectChatRequest);

// Chat messages & actions
router.get('/:chatId/messages', chatParticipant, getChatMessages);
router.post('/:chatId/message', chatRateLimiter, chatParticipant, sendMessage);
router.post('/:chatId/report', chatParticipant, reportAbuse);
router.post('/:chatId/block', chatParticipant, blockChat);
router.post('/:chatId/close', chatParticipant, closeChat); // opzionale

// Media
router.post('/media/upload', mediaUpload.single('file'), moderateMedia, uploadMedia,nsfwMiddleware );

module.exports = router;