let nsfw, tf, available = false;
try {
    nsfw = require('nsfwjs');
    tf = require('@tensorflow/tfjs-node');
    available = true;
} catch (e) {
    console.warn('[NSFW Middleware] Tensorflow non disponibile: moderazione disabilitata.');
}

const fs = require('fs');

let modelPromise;
function getModel() {
    if (!modelPromise && available) modelPromise = nsfw.load();
    return modelPromise;
}

module.exports = async (req, res, next) => {
    // Se non disponibile, lascia passare sempre!
    if (!available) return next();

    const file = req.file;
    if (!file) return res.status(400).json({ error: "File non trovato." });

    if (!file.mimetype.startsWith('image/')) return next();

    try {
        const imageBuffer = fs.readFileSync(file.path);
        const imageTensor = tf.node.decodeImage(imageBuffer, 3);
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