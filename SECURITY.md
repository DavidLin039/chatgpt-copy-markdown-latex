# Security and Privacy

## Current security model

The userscript is designed to operate entirely inside the browser page.

It does not intentionally:

- send conversation text to a server;
- make `fetch` requests;
- use `XMLHttpRequest`;
- open WebSockets;
- collect analytics;
- collect telemetry.

The script reads DOM content related to the user's current selection and writes reconstructed Markdown to the clipboard.

## Clipboard scope

The script intercepts copy only when the selection is inside one ChatGPT assistant Markdown response.

It does not intentionally intercept:

- ChatGPT input/editor copy;
- arbitrary page copy;
- cross-message selections.

## Reporting a security issue

Do not include private conversation text in a public issue.

If you find a vulnerability, publish the minimum reproducible technical detail needed to demonstrate it. If the repository later enables private vulnerability reporting, prefer that channel for sensitive reports.
