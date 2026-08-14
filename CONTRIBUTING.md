# Contributing

Thanks for helping improve ChatGPT Copy Markdown + LaTeX.

## Before opening an issue

1. Update to the latest userscript version.
2. Refresh ChatGPT.
3. Temporarily disable other extensions/userscripts that modify copy/clipboard behavior.
4. Reproduce the problem again.
5. Run the closest case in `tests/manual-test-matrix.md`.

## Good bug reports include

- OS
- Browser and version
- Userscript manager and version
- Script version
- Exact selection
- Expected Markdown
- Actual pasted result
- Screenshot
- Whether the issue occurs in Notepad/plain-text paste
- For math issues: the outer HTML of the affected rendered equation if possible

## How to capture formula outerHTML

1. Open browser DevTools.
2. Use the element picker.
3. Click the rendered equation.
4. Find the closest formula wrapper such as:
   - an element with `data-math-source`
   - `.katex-display`
   - `.katex`
   - `mjx-container`
5. Right-click that node.
6. Choose **Copy → Copy outerHTML**.
7. Paste it into the bug report inside a code block.

Remove any unrelated/private conversation content before posting.

## Pull requests

Keep PRs focused.

For behavior changes:

- explain the bug;
- include a reproducible example;
- update `tests/manual-test-matrix.md` when appropriate;
- update `CHANGELOG.md`;
- do not add network requests or telemetry without prior discussion.

## Privacy invariant

The project should remain local-only by default.

Do not add:

- analytics;
- telemetry;
- conversation uploads;
- remote parsing;
- hidden network requests.

If a future feature genuinely needs networking, it should be proposed separately and must be opt-in.
