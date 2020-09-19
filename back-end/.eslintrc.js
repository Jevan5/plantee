module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true
    },
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 12
    },
    rules: {
        'eol-last': ['error', 'always'],
        indent: ['error', 4],
        quotes: [2, 'single', 'avoid-escape'],
        semi: [2, 'always'],
    }
};
