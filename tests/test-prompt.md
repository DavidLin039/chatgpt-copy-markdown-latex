# Regression-test prompt for ChatGPT

Ask ChatGPT to answer the following in ONE response. Then use the resulting rendered response to test the userscript.

---

Create a compact Markdown test document containing all of the following. Render the mathematics normally.

1. H1, H2, H3 headings.
2. Chinese and English prose.
3. Bold, italic, and strike-through.
4. Inline formulas including:
   - \(z_t\)
   - \(\hat z_{t+H}=F_\omega(z_t,A_t)\)
5. Display equations for:
   - subscript/superscript
   - a fraction
   - a summation and integral
   - a 2x2 matrix
   - an aligned environment
   - a cases environment
   - \(\mathcal A=\{z:\text{stable grasp state}\}\)
6. An unordered list with a nested list and inline math.
7. An ordered list.
8. A block quote containing inline math.
9. A Markdown table with one column containing math.
10. A Python code block EXACTLY containing:

```python
def test():
    x = "$$ not math $$"
    return x
```

11. A JavaScript code block containing a string with backticks.
12. A normal hyperlink.
13. End with a display formula:
\[
d(\hat z_{t+H},\mathcal A_k)\rightarrow 0
\]

Do not put the entire answer inside a code block.
