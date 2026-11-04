# Security policy

## Supported versions

Only the latest release gets security fixes.

| Version | Supported |
|---|---|
| 10.x | Yes |
| older | No |

## Reporting a problem

Please do **not** open a public issue for a security problem. Use GitHub's private reporting instead: the
**Security** tab of this repository > **Report a vulnerability**.

Include what you found, how to reproduce it, and which version of the plugin and of MySQL Workbench you used. You will
get an answer within a week.

## What the plugin does with your data

- The local server binds `127.0.0.1:9241` only and answers Workbench's own page only (Origin, Host and a custom
  header are checked; other web pages get a refused CORS preflight).
- The Explorer can only list folders and read Workbench file types (`.sql`, `.mysql`, `.js`, `.ts`,
  `.mysql-notebook`, `.sqlnb`), up to 20 MB each. It never writes or deletes.
- AI API keys are encrypted with Windows DPAPI for the current user in `%APPDATA%\Modern MySQL Workbench\ai.json`. They never
  reach the page and are never written into notebooks.
- MySQL passwords are handled by Workbench itself. The plugin never sees or stores them.
