import vue from "eslint-plugin-vue";
import baseConfig from "../../eslint.config.mjs";

export default [
    ...baseConfig,
    ...vue.configs["flat/recommended"],
    {
        files: [
            "**/*.vue"
        ],
        languageOptions: {
            parserOptions: {
                parser: await import("@typescript-eslint/parser")
            }
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx",
            "**/*.vue"
        ],
        rules: {
            "vue/multi-word-component-names": "off",
            // Optional props are typed with `?`, an explicit `undefined` default adds nothing.
            "vue/require-default-prop": "off",
            // Template formatting is left to the editor rather than the linter.
            "vue/max-attributes-per-line": "off",
            "vue/singleline-html-element-content-newline": "off",
            "vue/html-self-closing": "off"
        }
    }
];
