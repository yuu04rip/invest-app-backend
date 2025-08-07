const multer = require('multer');

// Limiti e filtro MIME
const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/", "audio/", "video/"];
        if (!allowed.some(t => file.mimetype.startsWith(t))) {
            return cb(new Error("Tipo file non ammesso."));
        }
        cb(null, true);
    },
    storage: multer.diskStorage({
        destination: 'uploads/', // cambia se usi cloud
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
});

module.exports = upload;