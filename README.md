# ChatGPT Copy Markdown + LaTeX

> **Tired of ChatGPT equations turning into broken symbols, fragmented subscripts, or unusable text after copying?**

Your formulas look perfect in ChatGPT — but after pasting into Typora, Obsidian, VS Code, Jupyter, or GitHub Markdown, they may turn into things like `zₜ`, `Fω`, broken superscripts, or other hard-to-edit text.

## Just select → Ctrl/Cmd+C → paste

**No extra copy button. No formula-by-formula copying.**

Install this userscript once, then keep using the browser's normal copy shortcut:

```text
Select content in ChatGPT
        ↓
Ctrl+C / Cmd+C
        ↓
Paste
        ↓
Clean Markdown + reusable LaTeX
```
---



![原生复制与脚本复制效果对比](assets/01-compare.png)


For complete equations, the script recovers the original LaTeX source exposed by ChatGPT whenever possible.

**Public status:** `v0.1.0-beta`

---

## What can it copy?

You can directly select and copy:

- ✅ Normal Chinese / English prose
- ✅ A single inline equation
- ✅ A single display equation
- ✅ Prose mixed with multiple equations
- ✅ Part of an equation (preserved as Markdown math, but original LaTeX is not guaranteed)
- ✅ Complex equations with fractions, sums, integrals, matrices, `aligned`, `cases`, etc.
- ✅ Headings
- ✅ **Bold**, *italic*, and ~~strike-through~~
- ✅ Ordered and unordered lists
- ✅ Nested lists
- ✅ Block quotes
- ✅ Links
- ✅ Markdown tables
- ✅ Tables containing equations
- ✅ Inline code
- ✅ Multi-line fenced code blocks
- ✅ Code containing literal strings such as `$$ not math $$`

### Complete equations

When a complete rendered equation is selected, the script tries to recover the **original LaTeX source** and writes it as Markdown math:

```markdown
$$
\hat z_{t+H}=F_\omega(z_t,A_t)
$$
```

### Partial equations

When only part of a rendered equation is selected, the script keeps only the selected content and wraps it as Markdown math (`$...$` or `$$...$$`).

Please note:

- **Partial equations do not recover the original LaTeX source**
- They only preserve the selected rendered fragment as Markdown math
- For complex formulas, a partial selection may not match the exact original LaTeX expression

In short:

- **Complete equation** → original LaTeX whenever available
- **Partial equation** → Markdown math only; original LaTeX is not guaranteed

---

## Why use it?

### Native workflow

You still use:

- Windows / Linux: `Ctrl+C`
- macOS: `Cmd+C`
- Browser context-menu **Copy**

There is no additional floating button or separate export workflow.

### Original LaTeX whenever available

For complete equations, the script prefers LaTeX already stored in the live ChatGPT page instead of trying to reconstruct mathematical notation from Unicode characters.

### Markdown, not rich-text fragments

The selected content is reconstructed into reusable Markdown, including formulas, lists, tables, links, quotes, and code blocks.

### Local-only

Everything runs inside your browser.

- No `fetch`
- No `XMLHttpRequest`
- No WebSocket
- No analytics
- No telemetry
- No conversation upload
- No external server

---

## Installation

### Step 1: Install Tampermonkey in Microsoft Edge

1. Open **Microsoft Edge**
2. Click the **three-dot menu** in the top-right corner
3. Go to **Extensions**
4. Click **Get Microsoft Edge extensions**
5. Search for **Tampermonkey**
6. Open the **Tampermonkey** extension page
7. Click **Get / Install**
8. Finish the installation

### Step 2: Install this script from GitHub

1. Open this repository
2. Click the file: chatgpt-copy-markdown-latex.user.js
3. On the script file page, click **Raw**
4. Tampermonkey should automatically open the install page
5. Click **Install**
6. 
### Step 3: Refresh ChatGPT


Open or reload:


```
https://chatgpt.com/
```


### Step 4: Copy normally


In ChatGPT, select the content you want and simply press:


- Windows / Linux: `Ctrl+C`
- macOS: `Cmd+C`


Then paste it into Typora, Obsidian, VS Code, Jupyter Markdown, GitHub Markdown, or any other Markdown editor.


![安装流程](assets/04-install-pipeline.png)
---

## Example

In ChatGPT, select prose together with:

$$
z_t=E_\theta(o_t)
$$

and:

$$
\hat z_{t+H}=F_\omega(z_t,A_t)
$$

Then simply press `Ctrl+C` / `Cmd+C`.

The pasted Markdown can contain:

```markdown
The current latent state is $z_t=E_\theta(o_t)$.

$$
\hat z_{t+H}=F_\omega(z_t,A_t)
$$
```

No formula-by-formula copying is required.

---

## Compatibility

| Platform | Browser | Status |
|---|---|---|
| Windows 10/11 | Microsoft Edge | ✅ Primary tested target |
| Windows 10/11 | Chrome | 🧪 Testing recommended |
| macOS | Chrome | 🧪 Expected compatible; testers wanted |
| macOS | Edge | 🧪 Expected compatible; testers wanted |
| macOS | Safari | ⚠️ Experimental / unverified |
| Firefox | Any OS | ⚠️ Experimental / unverified |
| iOS / iPadOS | Safari | ❌ Not officially supported |

ChatGPT can change its page structure at any time, so browser and DOM compatibility may change between versions.

---

## Current limitations

- ChatGPT DOM changes may require script updates.
- Cross-response selections are not converted in `v0.1.0-beta`; they fall back to native browser copy.
- Complete equations can recover original LaTeX only when ChatGPT exposes a usable source in the page.
- Partial-equation conversion is best-effort and may not reproduce the exact original LaTeX for complex selections.
- Images are best-effort and may reference temporary URLs.
- ChatGPT citations may require additional compatibility handling.
- Other clipboard-modifying extensions or userscripts may conflict.
- Safari and Firefox have not been fully validated.

If conversion fails unexpectedly, the script is designed to leave the browser's native copy behavior available instead of blocking copy entirely.

---

## Testing

Manual regression tests are included in:

```text
tests/manual-test-matrix.md
```

A ready-made ChatGPT test prompt is included in:

```text
tests/test-prompt.md
```

Before marking a browser as supported, the P0 tests should pass on that browser/platform combination.

---

## Bug reports

If something does not copy correctly, please include:

- OS
- Browser and version
- Userscript manager and version
- Script version
- What you selected
- Expected pasted Markdown
- Actual pasted result
- Screenshot
- For formula-related bugs, the equation's `outerHTML` if possible

Use the GitHub issue template so the problem can be reproduced.

---

## Privacy

The script processes the selected ChatGPT DOM locally and writes the converted result to your clipboard.

It does **not** upload your conversations to any server.

---

## License

MIT License. See [`LICENSE`](LICENSE).

---

## Contributing

Bug reports, DOM samples, browser compatibility reports, and focused pull requests are welcome.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).
