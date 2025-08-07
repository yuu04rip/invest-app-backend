const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const is18PlusContent = require('../utils/is18PlusContent');

/**
 * Invia richiesta di chat (POST /chat/request)
 * Body: { toUserId }
 */
exports.sendChatRequest = async (req, res) => {
    const fromUserId = req.user?.id;
    const { toUserId } = req.body;

    if (!fromUserId) return res.status(401).json({ error: "Utente non autenticato." });
    if (!toUserId) return res.status(400).json({ error: "ID destinatario mancante." });
    if (fromUserId === toUserId) return res.status(400).json({ error: "Non puoi chattare con te stesso." });

    const existingChat = await prisma.chat.findFirst({
        where: {
            OR: [
                { userAId: fromUserId, userBId: toUserId },
                { userAId: toUserId, userBId: fromUserId }
            ]
        }
    });
    if (existingChat) return res.status(400).json({ error: "Chat già esistente." });

    const existingRequest = await prisma.chatRequest.findFirst({
        where: {
            fromUserId,
            toUserId,
            status: "pending"
        }
    });
    if (existingRequest) return res.status(400).json({ error: "Richiesta già inviata." });

    const chatRequest = await prisma.chatRequest.create({
        data: {
            fromUserId,
            toUserId,
            status: "pending"
        }
    });
    res.json({ chatRequest });
};

/**
 * Lista richieste ricevute (GET /chat/requests)
 */
exports.listReceivedRequests = async (req, res) => {
    const userId = req.user.id;
    const requests = await prisma.chatRequest.findMany({
        where: {
            toUserId: userId,
            status: "pending"
        },
        include: {
            fromUser: { select: { id: true, username: true, profileImageUrl: true } }
        }
    });
    res.json({ requests });
};

/**
 * ACCETTA richiesta di chat
 * POST /chat/request/:id/accept
 */
exports.acceptChatRequest = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const request = await prisma.chatRequest.findUnique({ where: { id: Number(id) } });
    if (!request || request.toUserId !== userId)
        return res.status(404).json({ error: "Richiesta non trovata o non autorizzato." });
    if (request.status !== "pending")
        return res.status(400).json({ error: "Richiesta già gestita." });

    let chat = await prisma.chat.findFirst({
        where: {
            OR: [
                { userAId: request.fromUserId, userBId: request.toUserId },
                { userAId: request.toUserId, userBId: request.fromUserId }
            ]
        }
    });
    if (chat) return res.status(400).json({ error: "Chat già esistente." });

    chat = await prisma.chat.create({
        data: {
            userAId: request.fromUserId,
            userBId: request.toUserId,
            chatRequestId: request.id
        }
    });

    await prisma.chatRequest.update({
        where: { id: request.id },
        data: {
            status: "accepted",
            acceptedAt: new Date(),
            chat: { connect: { id: chat.id } }
        }
    });

    res.json({
        chat: {
            ...chat,
            participants: [chat.userAId, chat.userBId]
        }
    });
};

/**
 * RIFIUTA richiesta di chat
 * POST /chat/request/:id/reject
 */
exports.rejectChatRequest = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const request = await prisma.chatRequest.findUnique({ where: { id: Number(id) } });
    if (!request || request.toUserId !== userId)
        return res.status(404).json({ error: "Richiesta non trovata o non autorizzato." });
    if (request.status !== "pending")
        return res.status(400).json({ error: "Richiesta già gestita." });

    await prisma.chatRequest.update({
        where: { id: request.id },
        data: { status: "rejected" }
    });

    res.json({ success: true });
};

/**
 * Ottieni messaggi della chat (GET /chat/:chatId/messages)
 */
exports.getChatMessages = async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } });
    if (!chat || (chat.userAId !== userId && chat.userBId !== userId)) return res.status(403).json({ error: "Accesso negato." });
    if (chat.isBlocked && chat.blockedById && chat.blockedById !== userId)
        return res.status(403).json({ error: "Questa chat è bloccata." });

    const messages = await prisma.message.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' }
    });
    res.json({ messages });
};

/**
 * Invia messaggio (POST /chat/:chatId/message)
 * Body: { type, content }
 */
exports.sendMessage = async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { type, content } = req.body;
    const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } });

    if (!chat || (chat.userAId !== userId && chat.userBId !== userId)) return res.status(403).json({ error: "Accesso negato." });
    if (chat.isBlocked) return res.status(403).json({ error: "Chat bloccata." });
    if (chat.isClosed) return res.status(403).json({ error: "Chat chiusa." });

    // Validazione type
    const allowedTypes = ["text", "image", "audio", "video"];
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: "Tipo messaggio non valido." });

    // Moderazione base: length
    if (type === "text" && typeof content === "string" && content.length > 2000)
        return res.status(400).json({ error: "Messaggio troppo lungo." });

    // Moderazione 18+ per testo
    if (type === "text" && await is18PlusContent(content)) {
        return res.status(400).json({ error: "Messaggio non ammesso (contenuto NSFW o vietato)." });
    }

    const message = await prisma.message.create({
        data: {
            chatId: chat.id,
            senderId: userId,
            type,
            content
        }
    });
    res.json({ message });
};

/**
 * Carica media (POST /media/upload)
 * Usa middleware nsfwMiddleware DOPO multer in router!
 */
exports.uploadMedia = async (req, res) => {
    const userId = req.user.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Nessun file ricevuto." });

    // Validazione mime-type
    const allowedTypes = ["image/", "audio/", "video/"];
    if (!allowedTypes.some(t => file.mimetype.startsWith(t)))
        return res.status(400).json({ error: "Tipo file non ammesso." });

    // La moderazione NSFW viene gestita dal middleware nsfwMiddleware!

    const media = await prisma.media.create({
        data: {
            url: file.path,
            type: file.mimetype.startsWith('image') ? 'image'
                : file.mimetype.startsWith('audio') ? 'audio'
                    : file.mimetype.startsWith('video') ? 'video'
                        : 'other',
            uploadedById: userId
        }
    });
    res.json({ media });
};

/**
 * Segnala abuso (POST /chat/:chatId/report)
 * Body: { messageId, reason }
 */
exports.reportAbuse = async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { messageId, reason } = req.body;
    const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } });
    if (!chat || (chat.userAId !== userId && chat.userBId !== userId)) return res.status(403).json({ error: "Accesso negato." });

    const message = await prisma.message.findUnique({ where: { id: Number(messageId) } });
    if (!message || message.chatId !== chat.id) return res.status(404).json({ error: "Messaggio non trovato nella chat." });

    await prisma.message.update({ where: { id: message.id }, data: { isFlagged: true, flaggedReason: reason } });
    res.json({ success: true });
};

/**
 * Blocca chat (POST /chat/:chatId/block)
 * Solo uno dei partecipanti può bloccare!
 */
exports.blockChat = async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } });
    if (!chat || (chat.userAId !== userId && chat.userBId !== userId))
        return res.status(403).json({ error: "Accesso negato." });

    if (chat.isBlocked) return res.status(400).json({ error: "Chat già bloccata." });

    await prisma.chat.update({
        where: { id: chat.id },
        data: { isBlocked: true, blockedById: userId, blockedAt: new Date() }
    });
    res.json({ success: true });
};

/**
 * Chiudi chat (POST /chat/:chatId/close)
 */
exports.closeChat = async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } });
    if (!chat || (chat.userAId !== userId && chat.userBId !== userId))
        return res.status(403).json({ error: "Accesso negato." });

    if (chat.isClosed) return res.status(400).json({ error: "Chat già chiusa." });

    await prisma.chat.update({
        where: { id: chat.id },
        data: { isClosed: true, closedAt: new Date() }
    });
    res.json({ success: true });
};