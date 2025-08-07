const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware: verifica che l'utente sia partecipante della chat
 * Usa req.user.id (popolato da auth) e req.params.chatId
 */
module.exports = async (req, res, next) => {
    const userId = req.user.id;
    const chatId = req.params.chatId;
    if (!chatId) return res.status(400).json({ error: "ChatId mancante." });

    const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } });
    if (!chat || (chat.userAId !== userId && chat.userBId !== userId))
        return res.status(403).json({ error: "Accesso negato alla chat." });

    req.chat = chat; // Passa la chat agli handler successivi se serve
    next();
};