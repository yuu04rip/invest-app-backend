/**
 * Moderazione base testo (mock).
 * Puoi sostituire con API esterne (Perspective, OpenAI, ecc).
 */
const bannedWords = ["porno", "sex", "xxx", "nude", "hentai"];

module.exports = async function is18PlusContent(text) {
    if (typeof text !== "string") return false;
    return bannedWords.some(w => text.toLowerCase().includes(w));
};