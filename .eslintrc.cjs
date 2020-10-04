module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:jsdoc/recommended",
        "plugin:import/errors",
        "plugin:import/typescript",
        "plugin:node/recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
        ecmaVersion: 6,
        sourceType: "module",
        warnOnUnsupportedTypeScriptVersion: false,
    },
    plugins: ["@typescript-eslint"],
    rules: {
        // does not handle return types being annotated in a type comment
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",

        // allow import syntax as we compile that away with babel for node
        "node/no-unsupported-features/es-syntax": [
            "error",
            {
                ignores: ["dynamicImport", "modules"],
            },
        ],

        // sometimes we need this with jsdoc typing
        "@typescript-eslint/ban-ts-comment": "off",

        // some typescript type productions do not parse
        "jsdoc/valid-types": "off",
        "jsdoc/no-undefined-types": "off",

        // opt-out of providing descriptions at the start
        // FIXME: turn these rules back on
        "jsdoc/require-property-description": "off",
        "jsdoc/require-returns-description": "off",
        "jsdoc/require-param-description": "off",
        "jsdoc/check-tag-names": [
            "warn",
            {
                definedTags: ["internal"],
            },
        ],
    },
};