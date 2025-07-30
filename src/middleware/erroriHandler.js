/**
 * Middleware di gestione errori centralizzata.
 * Va posizionato come ultimo middleware nella tua app Express.
 */
function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
}

module.exports = errorHandler;