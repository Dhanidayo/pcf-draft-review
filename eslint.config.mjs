import eslintjs from "@eslint/js";
import microsoftPowerApps from "@microsoft/eslint-plugin-power-apps";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";
import typescriptEslint from "typescript-eslint";

export default [
  { ignores: ["**/generated/", "out/", "node_modules/"] },
  eslintjs.configs.recommended,
  ...typescriptEslint.configs.recommended,
  microsoftPowerApps.configs.paCheckerHosted,
  reactPlugin.configs.flat.recommended,
  {
    plugins: { "@microsoft/power-apps": microsoftPowerApps },
    languageOptions: { globals: { ...globals.browser, ComponentFramework: true } },
    settings: { react: { version: "16.14.0" } },
  },
];
