const nsfw = require('nsfwjs');
const tf = require('@tensorflow/tfjs'); // NOT tfjs-node!
const fs = require('fs');

let modelPromise;
function getModel() {
    if (!modelPromise) modelPromise = nsfw.load();
    return modelPromise;
}

module.exports = async (req, res, next) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "File non trovato." });

    if (!file.mimetype.startsWith('image/')) return next();

    try {
        const imageBuffer = fs.readFileSync(file.path);
        const imageTensor = tf.node
            ? tf.node.decodeImage(imageBuffer, 3) // se tfjs-node c'è, usalo
            : tf.browser.fromPixels(new Uint8Array(imageBuffer)); // fallback browser API
        const model = await getModel();
        const predictions = await model.classify(imageTensor);
        if (imageTensor.dispose) imageTensor.dispose();

        const isAdult = predictions.some(p =>
            (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.7
        );
        if (isAdult) {
            return res.status(400).json({ error: "Immagine NSFW/non ammessa." });
        }
        next();
    } catch (err) {
        return res.status(500).json({ error: "Errore moderazione." });
    }
};