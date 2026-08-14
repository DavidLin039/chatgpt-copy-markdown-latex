// ==UserScript==
// @name         ChatGPT Copy Markdown + LaTeX 1111
// @namespace    https://github.com/DavidLin039/chatgpt-copy-markdown-latex
// @version      0.1.0
// @description  Select ChatGPT content and copy clean Markdown with original LaTeX preserved.
// @author       Davenny
// @license      MIT
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * ChatGPT Copy Markdown + LaTeX
 *
 * Design goals:
 * - Preserve normal rendered ChatGPT output while reading.
 * - Ctrl/Cmd+C turns fully selected rendered equations into original LaTeX.
 * - Inline math -> $...$
 * - Display math -> $$ ... $$
 * - Preserve code-block line breaks and fence literal "$$" inside code.
 * - Respect partial formula/code selections instead of expanding them.
 * - Never prevent native copy if parsing fails.
 * - No network requests, analytics, or conversation uploads.
 */

(function () {
    'use strict';

    const CONFIG = Object.freeze({
        debug: false,

        // Testing only. Set true temporarily to verify that parser exceptions
        // fall back to the browser's native copy behavior.
        simulateFailure: false,

        // Public beta intentionally supports selections inside ONE assistant
        // Markdown response. Cross-message selections fall back to native copy.
        assistantOnly: true,
    });

    const MARKERS = Object.freeze({
        math: 'data-cml-copy-math-id',
        code: 'data-cml-copy-code-id',
        literal: 'data-cml-copy-literal',
    });

    const SOURCE_ATTRIBUTES = Object.freeze([
        'data-math-source',
        'data-latex',
        'data-tex',
        'data-math',
        'data-original-tex',
    ]);

    const SOURCE_SELECTOR = SOURCE_ATTRIBUTES.map(a => `[${a}]`).join(',');

    const MATH_QUERY = [
        SOURCE_SELECTOR,
        '.katex-display',
        '.katex',
        'mjx-container',
        'math',
    ].join(',');

    const INVISIBLE_RE = /[\u200B\u200C\u200D\u2060\uFEFF]/g;

    function log(...args) {
        if (CONFIG.debug) {
            console.debug('[ChatGPT Copy Markdown + LaTeX]', ...args);
        }
    }

    function nodeElement(node) {
        if (!node) return null;
        return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    }

    function stripInvisible(text) {
        return String(text ?? '').replace(INVISIBLE_RE, '');
    }

    function normalizeLineEndings(text) {
        return stripInvisible(text).replace(/\r\n?/g, '\n');
    }

    function normalizeForComparison(text) {
        return normalizeLineEndings(text)
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, '')
            .trim();
    }

    function cleanLatex(text) {
        let tex = normalizeLineEndings(text).trim();

        // Strip only one outer delimiter pair if the page stored it.
        const wrappers = [
            [/^\$\$([\s\S]*)\$\$$/, '$1'],
            [/^\\\[([\s\S]*)\\\]$/, '$1'],
            [/^\\\(([\s\S]*)\\\)$/, '$1'],
            [/^\$([\s\S]*)\$$/, '$1'],
        ];

        for (const [pattern, replacement] of wrappers) {
            if (pattern.test(tex)) {
                tex = tex.replace(pattern, replacement).trim();
                break;
            }
        }

        return tex;
    }

    function isEditable(node) {
        const el = nodeElement(node);
        if (!el) return false;

        return Boolean(el.closest([
            'textarea',
            'input',
            'select',
            '[contenteditable="true"]',
            '[contenteditable="plaintext-only"]',
            '.CodeMirror',
            '.cm-editor',
            '.monaco-editor',
        ].join(',')));
    }

    function getAssistantMarkdown(node) {
        const el = nodeElement(node);
        if (!el) return null;

        const markdown = el.closest('.markdown');
        if (!markdown) return null;

        if (!CONFIG.assistantOnly) return markdown;

        const message = markdown.closest('[data-message-author-role]');
        if (!message) {
            // ChatGPT occasionally changes wrappers. A .markdown block is still
            // a safer target than hijacking arbitrary page copy.
            return markdown;
        }

        return message.getAttribute('data-message-author-role') === 'assistant'
            ? markdown
            : null;
    }

    function shouldHandleSelection(selection) {
        if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) {
            return null;
        }

        if (isEditable(selection.anchorNode) || isEditable(selection.focusNode)) {
            return null;
        }

        const startMarkdown = getAssistantMarkdown(selection.anchorNode);
        const endMarkdown = getAssistantMarkdown(selection.focusNode);

        // v0.1.0 deliberately avoids cross-response conversion.
        if (!startMarkdown || !endMarkdown || startMarkdown !== endMarkdown) {
            return null;
        }

        return startMarkdown;
    }

    function getSourceAttributeLatex(root) {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) return '';

        const candidates = [root, ...root.querySelectorAll(SOURCE_SELECTOR)];

        for (const candidate of candidates) {
            for (const attr of SOURCE_ATTRIBUTES) {
                const raw = candidate.getAttribute?.(attr);
                if (raw) {
                    const tex = cleanLatex(raw);
                    if (tex) return tex;
                }
            }
        }

        return '';
    }

    function getAnnotationLatex(root) {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) return '';

        const annotation = root.querySelector?.([
            'annotation[encoding="application/x-tex"]',
            'annotation[encoding="application/tex"]',
            'annotation[encoding="text/x-tex"]',
        ].join(','));

        return cleanLatex(annotation?.textContent || '');
    }

    function getLatex(root) {
        return getSourceAttributeLatex(root) || getAnnotationLatex(root);
    }

    function canonicalMathRoot(node, boundaryRoot = null) {
        let el = nodeElement(node);
        if (!el) return null;

        let katexCandidate = null;
        let displayCandidate = null;
        let mathJaxCandidate = null;

        while (el && el !== boundaryRoot?.parentElement) {
            if (SOURCE_ATTRIBUTES.some(attr => el.hasAttribute?.(attr))) {
                return el;
            }

            if (el.classList?.contains('katex-display')) {
                displayCandidate = el;
            }

            if (el.tagName?.toLowerCase() === 'mjx-container') {
                mathJaxCandidate = el;
            }

            if (el.classList?.contains('katex')) {
                katexCandidate = el;
            }

            if (boundaryRoot && el === boundaryRoot) break;
            el = el.parentElement;
        }

        return displayCandidate || mathJaxCandidate || katexCandidate;
    }

    function isDisplayMath(root) {
        if (!root) return false;

        if (
            root.matches?.('.katex-display, mjx-container[display="true"], math[display="block"]') ||
            root.closest?.('.katex-display') ||
            root.querySelector?.('.katex-display')
        ) {
            return true;
        }

        const display = (
            root.getAttribute?.('data-display') ||
            root.getAttribute?.('data-math-display') ||
            root.getAttribute?.('display') ||
            ''
        ).toLowerCase();

        return ['true', 'block', 'display'].includes(display);
    }

    function mathToMarkdown(info) {
        const tex = info.latex.trim();
        if (!tex) return '';

        return info.display
            ? `\n\n$$\n${tex}\n$$\n\n`
            : `$${tex}$`;
    }

    function partialMathToMarkdown(range, root) {
        const text = normalizeLineEndings(
            selectedVisibleTextInsideNode(range, root)
        ).trim();

        if (!text) return '';

        const safeText = text.replace(/\$/g, '\\$');

        return isDisplayMath(root)
            ? `$$\n${safeText}\n$$`
            : `$${safeText}$`;
    }

    function getVisibleMathText(root) {
        if (!root) return '';

        const katexHtml = root.matches?.('.katex-html')
            ? root
            : root.querySelector?.('.katex-html');

        if (katexHtml) {
            return normalizeLineEndings(katexHtml.innerText || katexHtml.textContent || '');
        }

        const mjx = root.matches?.('mjx-container')
            ? root
            : root.querySelector?.('mjx-container');

        if (mjx) {
            return normalizeLineEndings(mjx.innerText || mjx.textContent || '');
        }

        return normalizeLineEndings(root.innerText || root.textContent || '');
    }

    function rangeIntersectsNode(range, node) {
        try {
            return range.intersectsNode(node);
        } catch (_) {
            return false;
        }
    }

    function selectedVisibleTextInsideNode(range, node) {
        if (!rangeIntersectsNode(range, node)) return '';

        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);

        const intersection = range.cloneRange();

        // Clamp selection to node boundaries.
        if (intersection.compareBoundaryPoints(Range.START_TO_START, nodeRange) < 0) {
            intersection.setStart(nodeRange.startContainer, nodeRange.startOffset);
        }

        if (intersection.compareBoundaryPoints(Range.END_TO_END, nodeRange) > 0) {
            intersection.setEnd(nodeRange.endContainer, nodeRange.endOffset);
        }

        const holder = document.createElement('div');
        holder.appendChild(intersection.cloneContents());

        // KaTeX may carry an accessibility MathML copy in addition to the
        // visible HTML. Remove semantic/assistive branches before comparing.
        holder.querySelectorAll(
            '.katex-mathml, annotation, mjx-assistive-mml, semantics > annotation, math'
        ).forEach(n => n.remove());

        const katexHtml = holder.querySelector('.katex-html');
        const text = katexHtml
            ? (katexHtml.textContent || '')
            : (holder.textContent || '');

        return normalizeLineEndings(text);
    }

    function isEffectivelyFullySelected(range, selection, node, visibleTextGetter) {
        try {
            if (selection.containsNode(node, false)) {
                return true;
            }
        } catch (_) {
            // Continue with text comparison.
        }

        const selected = normalizeForComparison(
            selectedVisibleTextInsideNode(range, node)
        );
        const full = normalizeForComparison(visibleTextGetter(node));

        return Boolean(full && selected && selected === full);
    }

    function collectMathRoots(markdownRoot, range) {
        const roots = [];
        const seen = new Set();

        for (const candidate of markdownRoot.querySelectorAll(MATH_QUERY)) {
            if (!rangeIntersectsNode(range, candidate)) continue;

            const root = canonicalMathRoot(candidate, markdownRoot) || candidate;
            if (!root || seen.has(root) || !rangeIntersectsNode(range, root)) {
                continue;
            }

            const latex = getLatex(root);
            if (!latex) continue;

            seen.add(root);
            roots.push(root);
        }

        roots.sort((a, b) => {
            if (a === b) return 0;
            const relation = a.compareDocumentPosition(b);
            return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });

        return roots;
    }

    function getCodeText(pre) {
        const code = pre.querySelector('code') || pre;

        // innerText on the LIVE DOM preserves visual line breaks in ChatGPT
        // code renderers better than detached textContent.
        let text = code.innerText;

        if (typeof text !== 'string' || text.length === 0) {
            text = code.textContent || '';
        }

        text = normalizeLineEndings(text);

        // Browsers frequently append one terminal newline to <pre>.
        // Remove at most one; preserve all internal blank lines.
        if (text.endsWith('\n')) {
            text = text.slice(0, -1);
        }

        return text;
    }

    function getCodeLanguage(pre) {
        const code = pre.querySelector('code');

        if (code) {
            for (const cls of code.classList) {
                const match = cls.match(/^(?:language-|lang-)(.+)$/i);
                if (match) return match[1].trim();
            }

            const dataLanguage = code.getAttribute('data-language');
            if (dataLanguage) return dataLanguage.trim();
        }

        const preLanguage = pre.getAttribute('data-language');
        return preLanguage?.trim() || '';
    }

    function codeFenceFor(text) {
        const runs = text.match(/`+/g) || [];
        const longest = runs.reduce((max, run) => Math.max(max, run.length), 0);
        return '`'.repeat(Math.max(3, longest + 1));
    }

    function codeToMarkdown(info) {
        const fence = codeFenceFor(info.text);
        return `\n\n${fence}${info.language || ''}\n${info.text}\n${fence}\n\n`;
    }

    function getVisibleCodeText(pre) {
        return getCodeText(pre);
    }

    function findSingleContainingRoot(startNode, endNode, rootResolver) {
        const startRoot = rootResolver(startNode);
        const endRoot = rootResolver(endNode);
        return startRoot && startRoot === endRoot ? startRoot : null;
    }

    function createLiteralNode(markdown) {
        const span = document.createElement('span');
        span.setAttribute(MARKERS.literal, '1');
        span.textContent = markdown;
        return span;
    }

    function markLiveNode(node, attr, id, markedNodes) {
        node.setAttribute(attr, id);
        markedNodes.push([node, attr]);
    }

    function cleanupLiveMarkers(markedNodes) {
        for (const [node, attr] of markedNodes) {
            try {
                node.removeAttribute(attr);
            } catch (_) {
                // Never let cleanup failure affect native copy fallback.
            }
        }
    }

    function replaceMarkedNodes(clone, attr, infoMap, formatter) {
        const replaced = new Set();

        for (const node of clone.querySelectorAll(`[${attr}]`)) {
            const id = node.getAttribute(attr);
            const info = infoMap.get(id);
            if (!info) continue;

            node.replaceWith(createLiteralNode(formatter(info)));
            replaced.add(id);
        }

        return replaced;
    }

    function replaceLostFullMath(clone, orderedEntries, replacedIds) {
        /*
         * Conservative fallback only.
         *
         * A fully selected boundary formula normally keeps its marker because
         * we expand the CLONE-ONLY working Range to the formula wrapper.
         *
         * If a browser still strips that wrapper, map remaining rendered math
         * fragments only when the counts line up exactly with unresolved live
         * entries. This prevents a pending FULL formula from accidentally
         * replacing a PARTIAL formula earlier in the selection.
         */
        const unresolved = orderedEntries.filter(entry => {
            return !(entry.full && entry.id && replacedIds.has(entry.id));
        });

        if (!unresolved.some(entry => entry.full)) return;

        const candidates = Array.from(clone.querySelectorAll(
            '.katex-display, .katex, .katex-html, mjx-container'
        )).filter(node => {
            const parent = node.parentElement;
            if (!parent) return true;

            return !parent.closest(
                '.katex-display, .katex, .katex-html, mjx-container'
            );
        });

        // If structure is ambiguous, do nothing rather than replace the wrong
        // partial formula. The remaining fragment will be sanitized visually.
        if (candidates.length !== unresolved.length) {
            return;
        }

        for (let i = 0; i < candidates.length; i++) {
            const entry = unresolved[i];

            if (entry.full && entry.info) {
                candidates[i].replaceWith(
                    createLiteralNode(mathToMarkdown(entry.info))
                );
            }
        }
    }

    function sanitizeUnreplacedMath(clone) {
        // IMPORTANT: these are partial formula fragments. Do NOT expand them to
        // the whole equation and do NOT guess LaTeX from Unicode.
        clone.querySelectorAll(
            '.katex-mathml, annotation, mjx-assistive-mml, semantics > annotation, math'
        ).forEach(node => node.remove());

        // Flatten remaining visible KaTeX to avoid one-token-per-line output.
        const visibleRoots = Array.from(clone.querySelectorAll('.katex-html'))
            .filter(node => !node.parentElement?.closest('.katex-html'));

        for (const root of visibleRoots) {
            const text = normalizeLineEndings(root.textContent || '').trim();

            if (!text) {
                root.remove();
                continue;
            }

            const display = Boolean(root.closest('.katex-display'));

            const markdown = display
                ? `\n\n$$\n${text}\n$$\n\n`
                : `$${text}$`;

            root.replaceWith(createLiteralNode(markdown));
        }
    }

    function convertChildren(element, ctx = {}) {
        return Array.from(element.childNodes)
            .map(node => convertNode(node, ctx))
            .join('');
    }

    function convertNode(node, ctx = {}) {
        if (!node) return '';

        if (node.nodeType === Node.TEXT_NODE) {
            const text = normalizeLineEndings(node.nodeValue || '');

            if (ctx.pre) return text;

            if (/^[ \t\r\n]+$/.test(text)) {
                return text.includes('\n') ? '\n' : ' ';
            }

            return text;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        if (node.hasAttribute(MARKERS.literal)) {
            return node.textContent || '';
        }

        const tag = node.tagName.toUpperCase();

        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BUTTON'].includes(tag)) {
            return '';
        }

        switch (tag) {
            case 'P': {
                const content = convertChildren(node, ctx).trim();
                return content ? `${content}\n\n` : '';
            }

            case 'BR':
                return '\n';

            case 'H1':
            case 'H2':
            case 'H3':
            case 'H4':
            case 'H5':
            case 'H6': {
                const level = Number(tag.slice(1));
                const content = convertChildren(node, ctx).trim();
                return content ? `${'#'.repeat(level)} ${content}\n\n` : '';
            }

            case 'STRONG':
            case 'B': {
                const content = convertChildren(node, ctx).trim();
                return content ? `**${content}**` : '';
            }

            case 'EM':
            case 'I': {
                const content = convertChildren(node, ctx).trim();
                return content ? `*${content}*` : '';
            }

            case 'DEL':
            case 'S': {
                const content = convertChildren(node, ctx).trim();
                return content ? `~~${content}~~` : '';
            }

            case 'CODE': {
                // Fully selected PRE blocks are replaced before this stage.
                // This handles inline code and conservative fallback.
                if (node.closest('pre')) {
                    return normalizeLineEndings(node.textContent || '');
                }

                const content = normalizeLineEndings(node.textContent || '');
                if (!content) return '';

                const runs = content.match(/`+/g) || [];
                const longest = runs.reduce(
                    (max, run) => Math.max(max, run.length),
                    0
                );
                const fence = '`'.repeat(Math.max(1, longest + 1));

                return `${fence}${content}${fence}`;
            }

            case 'PRE': {
                // Fallback if a full PRE was not pre-captured for any reason.
                const info = {
                    text: getCodeText(node),
                    language: getCodeLanguage(node),
                };
                return codeToMarkdown(info);
            }

            case 'A': {
                const content = convertChildren(node, ctx).trim();
                const href = node.getAttribute('href') || '';
                if (!content) return '';
                return href ? `[${content}](${href})` : content;
            }

            case 'BLOCKQUOTE': {
                const content = convertChildren(node, ctx).trim();
                if (!content) return '';

                return content
                    .split('\n')
                    .map(line => `> ${line}`)
                    .join('\n') + '\n\n';
            }

            case 'UL':
                return convertList(node, false, ctx);

            case 'OL':
                return convertList(node, true, ctx);

            case 'LI':
                return convertChildren(node, ctx);

            case 'TABLE':
                return convertTable(node, ctx);

            case 'HR':
                return '---\n\n';

            case 'IMG': {
                const alt = node.getAttribute('alt') || '';
                const src = node.getAttribute('src') || '';
                return src ? `![${alt}](${src})` : alt;
            }

            default:
                return convertChildren(node, ctx);
        }
    }

    function convertList(list, ordered, ctx) {
        let output = '';
        let index = Number(list.getAttribute('start') || 1);

        for (const li of Array.from(list.children)) {
            if (li.tagName !== 'LI') continue;

            let direct = '';
            let nested = '';

            for (const child of Array.from(li.childNodes)) {
                if (
                    child.nodeType === Node.ELEMENT_NODE &&
                    (child.tagName === 'UL' || child.tagName === 'OL')
                ) {
                    nested += convertNode(child, ctx);
                } else {
                    direct += convertNode(child, ctx);
                }
            }

            direct = direct.trim();
            const marker = ordered ? `${index}. ` : '- ';
            output += `${marker}${direct}\n`;

            if (nested.trim()) {
                output += nested
                    .trim()
                    .split('\n')
                    .map(line => `  ${line}`)
                    .join('\n') + '\n';
            }

            if (ordered) index++;
        }

        return `${output}\n`;
    }

    function convertTable(table, ctx) {
        const rows = [];

        for (const tr of table.querySelectorAll('tr')) {
            const cells = Array.from(tr.children)
                .filter(el => el.tagName === 'TD' || el.tagName === 'TH')
                .map(el => convertChildren(el, ctx)
                    .trim()
                    .replace(/\|/g, '\\|')
                    .replace(/\n+/g, '<br>'));

            if (cells.length) rows.push(cells);
        }

        if (!rows.length) return '';

        const width = Math.max(...rows.map(row => row.length));

        for (const row of rows) {
            while (row.length < width) row.push('');
        }

        let out = `| ${rows[0].join(' | ')} |\n`;
        out += `| ${Array(width).fill('---').join(' | ')} |\n`;

        for (const row of rows.slice(1)) {
            out += `| ${row.join(' | ')} |\n`;
        }

        return `${out}\n`;
    }

    function cleanupMarkdown(markdown) {
        return normalizeLineEndings(markdown)
            .replace(/\u00A0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{4,}/g, '\n\n\n')
            .trim();
    }

    function expandWorkingRangeForFullySelectedBoundaries(
        originalRange,
        workingRange,
        selection,
        markdownRoot
    ) {
        /*
         * Important distinction:
         * - PARTIAL boundary formula/code: never expand.
         * - FULL visual boundary formula/code: expand only the CLONE range to
         *   include its wrapper so marker attributes survive cloneContents().
         *
         * The user's actual browser selection is never modified.
         */

        const startMath = canonicalMathRoot(
            originalRange.startContainer,
            markdownRoot
        );

        if (
            startMath &&
            isEffectivelyFullySelected(
                originalRange,
                selection,
                startMath,
                getVisibleMathText
            )
        ) {
            try {
                workingRange.setStartBefore(startMath);
            } catch (_) {
                // Conservative fallback: keep original boundary.
            }
        }

        const endMath = canonicalMathRoot(
            originalRange.endContainer,
            markdownRoot
        );

        if (
            endMath &&
            isEffectivelyFullySelected(
                originalRange,
                selection,
                endMath,
                getVisibleMathText
            )
        ) {
            try {
                workingRange.setEndAfter(endMath);
            } catch (_) {
                // Conservative fallback.
            }
        }

        const startPre = nodeElement(originalRange.startContainer)?.closest('pre');
        if (
            startPre &&
            markdownRoot.contains(startPre) &&
            isEffectivelyFullySelected(
                originalRange,
                selection,
                startPre,
                getVisibleCodeText
            )
        ) {
            try {
                workingRange.setStartBefore(startPre);
            } catch (_) {
                // Conservative fallback.
            }
        }

        const endPre = nodeElement(originalRange.endContainer)?.closest('pre');
        if (
            endPre &&
            markdownRoot.contains(endPre) &&
            isEffectivelyFullySelected(
                originalRange,
                selection,
                endPre,
                getVisibleCodeText
            )
        ) {
            try {
                workingRange.setEndAfter(endPre);
            } catch (_) {
                // Conservative fallback.
            }
        }

        return workingRange;
    }

    function copyAsMarkdown(event, markdown) {
        if (!markdown || !event.clipboardData) return false;

        /*
         * Critical fallback property:
         * 1. Finish ALL parsing before this function.
         * 2. Write clipboard data first.
         * 3. preventDefault() only after setData succeeds.
         *
         * Any exception before this point leaves native browser copy intact.
         */
        event.clipboardData.setData('text/plain', markdown);
        event.preventDefault();

        // Prevent a later page/extension listener from replacing our completed
        // clipboard payload. This is only reached after successful parsing.
        event.stopImmediatePropagation();

        return true;
    }

    document.addEventListener('copy', function (event) {
        const selection = window.getSelection();
        const markdownRoot = shouldHandleSelection(selection);

        if (!markdownRoot) {
            return; // Native copy.
        }

        const originalRange = selection.getRangeAt(0).cloneRange();
        const markedNodes = [];

        try {
            if (CONFIG.simulateFailure) {
                throw new Error('Simulated parser failure for fallback testing.');
            }

            /*
             * Partial formula behavior:
             * If the entire selection lives inside one formula, convert only
             * when the VISIBLE formula is fully selected. Otherwise return and
             * let the browser copy exactly the partial visual selection.
             */
            const sameMathRoot = findSingleContainingRoot(
                originalRange.startContainer,
                originalRange.endContainer,
                node => canonicalMathRoot(node, markdownRoot)
            );

            if (sameMathRoot) {
                const isFull = isEffectivelyFullySelected(
                    originalRange,
                    selection,
                    sameMathRoot,
                    getVisibleMathText
                );

                // Partial formula: keep exactly the selected visual fragment,
                // but wrap it as Markdown math.
                if (!isFull) {
                    const markdown = partialMathToMarkdown(
                        originalRange,
                        sameMathRoot
                    );

                    if (markdown) {
                        copyAsMarkdown(event, markdown);
                    }

                    return;
                }

                // Full formula: recover original LaTeX.
                const latex = getLatex(sameMathRoot);

                if (latex) {
                    const markdown = mathToMarkdown({
                        latex,
                        display: isDisplayMath(sameMathRoot),
                    });

                    copyAsMarkdown(event, markdown.trim());
                }

                return;
            }

            /*
             * Partial code behavior mirrors partial math:
             * exact full code selection -> fenced Markdown;
             * partial code-only selection -> native browser copy.
             */
            const startPre = nodeElement(originalRange.startContainer)?.closest('pre');
            const endPre = nodeElement(originalRange.endContainer)?.closest('pre');

            if (startPre && startPre === endPre) {
                const isFull = isEffectivelyFullySelected(
                    originalRange,
                    selection,
                    startPre,
                    getVisibleCodeText
                );

                if (!isFull) {
                    return;
                }

                const markdown = codeToMarkdown({
                    text: getCodeText(startPre),
                    language: getCodeLanguage(startPre),
                });

                copyAsMarkdown(event, cleanupMarkdown(markdown));
                return;
            }

            const workingRange = expandWorkingRangeForFullySelectedBoundaries(
                originalRange,
                originalRange.cloneRange(),
                selection,
                markdownRoot
            );

            /*
             * Pre-capture FULL equations from the LIVE DOM before cloning.
             * This avoids losing original TeX when Range.cloneContents()
             * clips a KaTeX wrapper at a selection boundary.
             */
            const mathInfoMap = new Map();
            const orderedMathInfos = [];

            let mathIndex = 0;
            const orderedMathEntries = [];

            for (const root of collectMathRoots(markdownRoot, workingRange)) {
                const full = isEffectivelyFullySelected(
                    originalRange,
                    selection,
                    root,
                    getVisibleMathText
                );

                const latex = getLatex(root);

                if (!full || !latex) {
                    orderedMathEntries.push({
                        full: false,
                        id: null,
                        info: null,
                    });
                    continue;
                }

                const id = `m-${Date.now()}-${mathIndex++}`;
                const info = {
                    latex,
                    display: isDisplayMath(root),
                };

                markLiveNode(root, MARKERS.math, id, markedNodes);
                mathInfoMap.set(id, info);
                orderedMathInfos.push({ id, info });
                orderedMathEntries.push({
                    full: true,
                    id,
                    info,
                });
            }

            /*
             * Pre-capture FULL code blocks from LIVE DOM.
             * innerText is read while the PRE is still rendered, preserving
             * visual line breaks that detached clones can lose.
             */
            const codeInfoMap = new Map();
            let codeIndex = 0;

            for (const pre of markdownRoot.querySelectorAll('pre')) {
                if (!rangeIntersectsNode(workingRange, pre)) continue;

                if (!isEffectivelyFullySelected(
                    originalRange,
                    selection,
                    pre,
                    getVisibleCodeText
                )) {
                    continue;
                }

                const id = `c-${Date.now()}-${codeIndex++}`;
                const info = {
                    text: getCodeText(pre),
                    language: getCodeLanguage(pre),
                };

                markLiveNode(pre, MARKERS.code, id, markedNodes);
                codeInfoMap.set(id, info);
            }

            const clone = document.createElement('div');
            clone.appendChild(workingRange.cloneContents());

            // Remove temporary attributes from the LIVE page as soon as clone
            // is complete. The outer finally is a second safety net.
            cleanupLiveMarkers(markedNodes);
            markedNodes.length = 0;

            const replacedMathIds = replaceMarkedNodes(
                clone,
                MARKERS.math,
                mathInfoMap,
                mathToMarkdown
            );

            replaceLostFullMath(clone, orderedMathEntries, replacedMathIds);

            replaceMarkedNodes(
                clone,
                MARKERS.code,
                codeInfoMap,
                codeToMarkdown
            );

            /*
             * Any remaining math is partial/unrecoverable. Flatten only the
             * SELECTED visible fragment. Never expand it, and never guess TeX.
             */
            sanitizeUnreplacedMath(clone);

            const markdown = cleanupMarkdown(convertChildren(clone));

            if (!markdown) {
                return; // Native copy.
            }

            copyAsMarkdown(event, markdown);

        } catch (error) {
            /*
             * Deliberately DO NOT call preventDefault() here.
             * Native browser copy remains the fallback.
             */
            console.error(
                '[ChatGPT Copy Markdown + LaTeX] Parser failed; using native copy:',
                error
            );
        } finally {
            cleanupLiveMarkers(markedNodes);
        }
    }, true);
})();
