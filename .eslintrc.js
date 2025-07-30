module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true, // <--- AGGIUNGI QUESTO!
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        // Add your custom rules here
    },
};