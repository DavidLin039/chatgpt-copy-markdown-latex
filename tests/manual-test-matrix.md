# Manual Release Test Matrix

Run this matrix before every public release.

Use **Notepad / plain-text editor first**, then test Typora. This separates browser-copy bugs from editor paste behavior.

Record:

- OS
- Browser + version
- Userscript manager + version
- Script version

---

# P0 — Release blockers

Every P0 test must pass on a platform before that platform is marked supported.

| ID | Test | Expected |
|---|---|---|
| P0-01 | Copy ordinary Chinese prose | Exact readable text |
| P0-02 | Copy ordinary English prose | Exact readable text |
| P0-03 | Copy prose containing one full inline formula | Formula becomes `$...$` |
| P0-04 | Copy one full display formula only | Formula becomes `$$ ... $$` |
| P0-05 | Copy prose with 5+ mixed formulas | No duplicates, no fragmented glyphs |
| P0-06 | Selection begins exactly at a full formula and continues into prose | Full formula becomes LaTeX |
| P0-07 | Selection ends exactly after a full formula | Full formula becomes LaTeX |
| P0-08 | Select only the left half of a formula | Only selected visual portion is copied; selection is NOT expanded |
| P0-09 | Select only the right half of a formula | Same as P0-08 |
| P0-10 | Select a full formula without surrounding prose | Must still include `$` or `$$` Markdown delimiters |
| P0-11 | Copy a multi-line full code block | Every source line remains on its own line |
| P0-12 | Code contains `$$ not math $$` | It remains literal code |
| P0-13 | Code contains triple backticks | Output fence is long enough not to break |
| P0-14 | Copy partial code only | Native exact visual/code selection; no forced full block |
| P0-15 | Copy inside ChatGPT input box | Native browser copy; userscript must not hijack |
| P0-16 | Copy outside assistant Markdown | Native browser copy |
| P0-17 | Copy across two separate ChatGPT responses | Native browser copy in v0.1.0 |
| P0-18 | No selection + copy | No script exception |
| P0-19 | Set `simulateFailure: true` and copy | Native browser copy still works |
| P0-20 | Restore `simulateFailure: false` | Markdown conversion works again |

---

# Math regression suite

## M-01 Subscript / superscript

```latex
z_{t+H}=F_\omega(z_t,A_t)
```

## M-02 Accents and calligraphic symbols

```latex
\hat z_t,\quad \bar{x},\quad \tilde q,\quad \mathcal A_k
```

## M-03 Fractions

```latex
p(x\mid y)=\frac{p(y\mid x)p(x)}{p(y)}
```

## M-04 Sum and integral

```latex
\sum_{i=1}^{N}x_i,\qquad \int_0^T f(t)\,dt
```

## M-05 Matrix

```latex
A=
\begin{bmatrix}
a & b\\
c & d
\end{bmatrix}
```

## M-06 Aligned

```latex
\begin{aligned}
z_t &= E(o_t),\\
\hat z_{t+H} &= F(z_t,A_t),\\
L &= \|\hat z_{t+H}-z_{t+H}\|_2^2.
\end{aligned}
```

## M-07 Cases

```latex
f(x)=
\begin{cases}
x^2,&x>0,\\
0,&x\le0.
\end{cases}
```

## M-08 Text inside math

```latex
\mathcal A=\{z:\text{stable grasp state}\}
```

## M-09 Chinese text inside math

```latex
\mathcal A=\{z:\text{稳定抓取状态}\}
```

## M-10 Long delimiters

```latex
\left(
\frac{x_1+x_2}{y}
\right)
```

---

# Markdown regression suite

## MD-01 Headings

Test H1 through H4.

## MD-02 Emphasis

- bold
- italic
- strike-through
- bold containing inline math
- italic containing inline math

## MD-03 Lists

- unordered list
- ordered list
- nested list
- list item containing inline math
- list item containing display math

## MD-04 Block quote

Quote containing prose and math.

## MD-05 Links

Normal hyperlink with surrounding prose.

## MD-06 Tables

Test:

- plain table;
- table with formulas;
- table cell containing `|`;
- Chinese table.

## MD-07 Code

Test:

```python
def test():
    x = "$$ not math $$"
    return x
```

Then test code containing:

````text
```markdown
inside = "```"
```
````

---

# Selection-boundary abuse tests

Intentionally select awkward regions:

1. middle of paragraph → middle of paragraph;
2. middle of heading → middle of paragraph;
3. middle of formula → paragraph end;
4. paragraph start → middle of formula;
5. middle of bold → middle of formula;
6. middle of list item 2 → middle of list item 4;
7. one partial table region;
8. formula only;
9. code only;
10. partial code only.

Expected rule:

> Never silently expand a partial formula or partial code selection to a larger object.

---

# Clipboard conflict test

Temporarily enable any other clipboard-modifying extension you normally use.

If behavior changes:

1. disable the other extension;
2. retest;
3. record the conflicting extension in the issue.

---

# Long-response stress test

Use one response containing:

- 10,000+ characters;
- 20+ formulas;
- at least one table;
- at least one code block;
- nested lists.

Check:

- no obvious freeze;
- no missing tail;
- no duplicated formulas;
- no code-line collapse.

---

# Privacy/static audit

Search the distributable `.user.js` for:

```text
fetch(
XMLHttpRequest
GM_
WebSocket
sendBeacon
```

Expected: no networking implementation.

Also verify metadata contains:

```text
@grant none
```
