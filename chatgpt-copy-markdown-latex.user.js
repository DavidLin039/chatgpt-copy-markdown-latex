// ==UserScript==
// @name         ChatGPT Copy Markdown + LaTeX
// @namespace    https://github.com/DavidLin039/chatgpt-copy-markdown-latex
// @version      0.1.1
// @description  Copy selected ChatGPT text as clean Markdown for Typora; keep original LaTeX.
// @author       Davenny
// @license      MIT
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // Disable other ChatGPT copy-modifying userscripts while testing this one.
  const MATH = '[data-math-source],[data-math],[data-latex],[data-tex],.katex-display,.katex,mjx-container,math[alttext],[role="math"][aria-label]';
  let badge;

  function message(text, color = '#2563eb') {
    console.info('[GPT Latex Copy]', text);
    if (!badge) return;
    badge.textContent = text + ' · 点击此处手动复制选区';
    badge.style.background = color;
  }

  function createBadge() {
    if (badge || !document.body) return;
    badge = document.createElement('button');
    badge.type = 'button';
    badge.id = 'gpt-latex-copy-v030';
    badge.textContent = '公式复制 v0.3 已启动 · 点击手动复制选区';
    Object.assign(badge.style, {
      position: 'fixed', right: '16px', bottom: '85px',
      maxWidth: 'min(430px, 85vw)', padding: '10px 12px',
      color: '#fff', background: '#15803d', border: 'none', borderRadius: '8px',
      font: '13px/1.5 system-ui,sans-serif', cursor: 'pointer',
      zIndex: '2147483647', boxShadow: '0 4px 14px #0002'
    });
    badge.addEventListener('mousedown', ev => ev.preventDefault()); // Retain text selection.
    badge.addEventListener('click', async () => {
      const data = selectedAsMarkdown();
      if (!data) return message('未找到可读取的选区/公式', '#b45309');
      try {
        await navigator.clipboard.writeText(data.text);
        message(`手动复制成功：${data.count} 个公式`, '#15803d');
      } catch (error) {
        message('手动写入失败：' + error.message, '#b91c1c');
      }
    });
    document.body.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBadge, { once: true });
  } else {
    createBadge();
  }

  function isEditable(node) {
    const e = node?.nodeType === 1 ? node : node?.parentElement;
    return Boolean(e?.closest('textarea,input,[contenteditable="true"],[role="textbox"]'));
  }

  function unwrapTex(s) {
    let t = String(s || '').trim();
    const wrappers = [
      /^\\\[([\s\S]*)\\\]$/,
      /^\\\(([\s\S]*)\\\)$/,
      /^\$\$([\s\S]*)\$\$$/,
      /^\$([\s\S]*)\$$/
    ];
    for (const re of wrappers) {
      const m = t.match(re);
      if (m) { t = m[1].trim(); break; }
    }
    return t;
  }

  function latex(el) {
    if (!el || el.nodeType !== 1) return '';
    for (const attr of ['data-math-source', 'data-math', 'data-latex', 'data-tex']) {
      const source = el.getAttribute(attr);
      if (source?.trim()) return unwrapTex(source);
    }
    const ann = el.matches('annotation[encoding="application/x-tex"]')
      ? el : el.querySelector('annotation[encoding="application/x-tex"], annotation[encoding="LaTeX"]');
    if (ann?.textContent?.trim()) return unwrapTex(ann.textContent);
    const math = el.matches('math') ? el : el.querySelector('math[alttext]');
    if (math?.getAttribute('alttext')) return unwrapTex(math.getAttribute('alttext'));
    if (el.matches('[role="math"][aria-label]')) return unwrapTex(el.getAttribute('aria-label'));
    return '';
  }

  function isDisplay(el) {
    const source = el.getAttribute?.('data-math-source') || '';
    if (/^\s*(?:\\\[|\$\$)/.test(source)) return true;
    if (el.matches?.('.katex-display, mjx-container[display="true"], math[display="block"]')) return true;
    if (el.querySelector?.('.katex-display, mjx-container[display="true"], math[display="block"]')) return true;
    if (el.closest?.('.katex-display')) return true;
    if (el.getAttribute?.('data-display') === 'true' || el.getAttribute?.('data-math-display') === 'true') return true;
    // On current ChatGPT, block math may have data-math-source on a DIV.
    if (el.matches?.('[data-math-source]') && ['DIV', 'FIGURE'].includes(el.tagName)) return true;
    return false;
  }

  function mathEntries(fragment) {
    // Select outermost recoverable math elements to avoid duplicate rendered + assistive output.
    const candidates = [...fragment.querySelectorAll(MATH)]
      .map(el => ({ el, tex: latex(el) }))
      .filter(item => Boolean(item.tex));
    const set = new Set(candidates.map(item => item.el));
    return candidates.filter(({el}) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (set.has(p)) return false;
      }
      return true;
    });
  }

  function closestMath(node) {
    let el = node?.nodeType === 1 ? node : node?.parentElement;
    while (el && el.nodeType === 1) {
      if (el.matches(MATH) && latex(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  const children = (el, fn) => [...el.childNodes].map(fn).join('');
  const clean = s => String(s).replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  function markdown(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return children(node, markdown);
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (['script','style','noscript','button','svg','nav'].includes(tag)) return '';
    if (el.getAttribute('aria-hidden') === 'true' || el.classList.contains('sr-only')) return '';
    if (tag === 'br') return '\n';
    if (tag === 'hr') return '\n\n---\n\n';
    if (tag === 'table') {
      const rows = [...el.querySelectorAll('tr')].map(tr =>
        [...tr.children].filter(c => /^(TH|TD)$/.test(c.tagName)).map(c =>
          clean(children(c, markdown)).replace(/\n/g, ' ').replace(/\|/g, '\\|')));
      if (!rows.length || !rows[0].length) return '';
      const n = Math.max(...rows.map(r => r.length));
      const fmt = row => '| ' + Array.from({length:n}, (_,i) => row[i] || '').join(' | ') + ' |';
      return '\n\n' + [fmt(rows[0]),fmt(Array(n).fill('---')), ...rows.slice(1).map(fmt)].join('\n') + '\n\n';
    }
    if (tag === 'pre') {
      const code = (el.querySelector('code') || el).textContent.replace(/\n$/, '');
      const lang = (el.querySelector('code')?.className || '').match(/language-([\w-]+)/)?.[1] || '';
      const fence = code.includes('```') ? '````' : '```';
      return `\n\n${fence}${lang}\n${code}\n${fence}\n\n`;
    }
    const val = children(el, markdown);
    if (tag === 'code') return '`' + val + '`';
    if (tag === 'strong' || tag === 'b') return '**' + val + '**';
    if (tag === 'em' || tag === 'i') return '*' + val + '*';
    if (tag === 'a') {
      const href = el.getAttribute('href');
      return href && !href.startsWith('javascript:') ? `[${val}](${href})` : val;
    }
    if (/^h[1-6]$/.test(tag)) return '\n\n' + '#'.repeat(+tag[1]) + ' ' + val + '\n\n';
    if (tag === 'p') return val + '\n\n';
    if (tag === 'li') {
      const parent = el.parentElement;
      const isNum = parent?.tagName === 'OL';
      const index = isNum ? [...parent.children].indexOf(el) + 1 : 0;
      return (isNum ? `${index}. ` : '- ') + clean(val) + '\n';
    }
    if (tag === 'ol' || tag === 'ul') return '\n' + val + '\n';
    if (tag === 'blockquote') return '\n\n' + clean(val).split('\n').map(x => '> ' + x).join('\n') + '\n\n';
    if (['div', 'section', 'article'].includes(tag)) return val + '\n';
    return val;
  }

  function selectedAsMarkdown() {
    const s = window.getSelection();
    if (!s || s.isCollapsed || s.rangeCount !== 1) return null;
    const range = s.getRangeAt(0);
    if (isEditable(range.commonAncestorContainer)) return null;
    const fragment = range.cloneContents();
    const entries = mathEntries(fragment);
    for (const { el, tex } of entries) {
      const display = isDisplay(el);
      el.replaceWith(document.createTextNode(display ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`));
    }
    if (!entries.length) {
      // Partial selection inside one equation: use full source rather than inventing TeX from glyphs.
      const a = closestMath(range.startContainer);
      const b = closestMath(range.endContainer);
      if (a && a === b) {
        const tex = latex(a);
        return { text: isDisplay(a) ? `$$\n${tex}\n$$` : `$${tex}$`, count: 1 };
      }
      return null;
    }
    const value = clean(markdown(fragment));
    return value ? { text: value, count: entries.length } : null;
  }

  // Important: a copy listener only *observes* the operation unless it
  // calls setData() AND preventDefault(). Capturing on window also makes it
  // possible to stop later page copy listeners from overwriting our result.
  window.addEventListener('copy', event => {
    if (isEditable(event.target)) return;
    try {
      const data = selectedAsMarkdown();
      if (!data) return message('检测到复制，但未发现可恢复的公式；使用原生复制', '#b45309');
      if (!event.clipboardData) return message('检测到公式，但 copy 事件没有 clipboardData', '#b91c1c');
      event.clipboardData.setData('text/plain', data.text);
      event.preventDefault();
      event.stopImmediatePropagation();
      message(`Ctrl+C 已改写剪贴板：${data.count} 个公式`, '#15803d');
    } catch (err) {
      console.error('[GPT Latex Copy] Copy failure', err);
      message('公式转换错误：' + err.message, '#b91c1c');
    }
  }, true);
})();
