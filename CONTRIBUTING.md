# Contributing

Thanks for helping. This plugin is small and kept by one person, so a few rules keep it easy to look after.

## Before you start

- **Bugs:** open an issue with the bug report form. Say which MySQL Workbench version you use (Help > About) and
  attach `%TEMP%\modern-mysql-workbench.log` if there is one.
- **Ideas:** open an issue with the feature request form before writing code, so we can agree on it first.
- **Scope:** the plugin is for MySQL and MySQL Workbench 26 only. Features for other databases or other editors are
  out of scope.

## Ground rules for changes

- Never change Workbench's own files. Everything goes through `plugin/kgptalkie-plugin.js` and the local server in
  `package/kgptalkie_workbench.py`.
- Test in a separate Workbench profile against a throwaway MySQL server (`tests/testenv.ps1`, port 3310, localhost
  only), never in the Workbench and the database you use every day.
- Never commit passwords, API keys, tokens or your own connection details.
- Keep the user-facing wording plain and short. Do not use em dashes.
- Write sizes as KB, MB and GB, computed in binary (1 MB = 1024 KB).

## Making a pull request

1. Fork the repo and create a branch from `main`.
2. Make the change. If it touches keywords, run `npm run keywords`.
3. Run `npm run check` (syntax of the plugin and the Python programs).
4. Test it in the test Workbench and describe what you tested in the pull request.
5. Add a line to `CHANGELOG.md` under the next version.

By sending a contribution you agree that it is licensed under the Apache License 2.0, like the rest of the project.
