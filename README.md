[English](README.EN.md) | [简体中文](README.md)

# ChatGPT Copy Markdown + LaTeX

> **还在为 ChatGPT 里的公式一复制就变成乱码、碎掉的上下标、无法继续编辑的符号而苦恼？**

公式在 ChatGPT 里明明显示得很漂亮，但一粘贴到 Typora、Obsidian、VS Code、Jupyter 或 GitHub Markdown，就可能变成 `zₜ`、`Fω`、破碎的上下标，或者其他难以继续编辑的文本。

## 只需选中 → Ctrl/Cmd+C → 粘贴

**不需要额外按钮，也不需要一个公式一个公式地单独复制。**

安装一次这个 userscript，以后继续使用浏览器最普通的复制快捷键：

```text
在 ChatGPT 中选中内容
        ↓
Ctrl+C / Cmd+C
        ↓
粘贴
        ↓
干净的 Markdown + 可继续编辑的 LaTeX
```
---

![原生复制与脚本复制效果对比](assets/01-compare.png)



对于完整公式，只要 ChatGPT 页面中保留了可用的原始公式源码，脚本就会尽可能恢复原始 LaTeX。

**公开版本状态：** `v0.1.0-beta`

---

## 它能复制什么？

你可以直接框选并复制：

- ✅ 普通中文 / 英文文本
- ✅ 单独一个行内公式
- ✅ 单独一个块级公式
- ✅ 普通文字与多个公式混合
- ✅ 公式的一部分（保留为 Markdown 数学格式，但不保证恢复原始 LaTeX）
- ✅ 分式、求和、积分、矩阵、`aligned`、`cases` 等复杂公式
- ✅ 标题
- ✅ **粗体**、*斜体*、~~删除线~~
- ✅ 有序列表和无序列表
- ✅ 嵌套列表
- ✅ 引用块
- ✅ 链接
- ✅ Markdown 表格
- ✅ 含公式的表格
- ✅ 行内代码
- ✅ 多行 fenced code block
- ✅ 含有 `$$ not math $$` 等字面字符串的代码

### 完整公式

当你完整选中一个已经渲染的公式时，脚本会尝试恢复其**原始 LaTeX 源码**，并写成 Markdown 数学格式：

```markdown
$$
\hat z_{t+H}=F_\omega(z_t,A_t)
$$
```

### 部分公式

当你只选中一个公式的一部分时，脚本会保留你实际选中的内容，并将其包装成 Markdown 数学格式（`$...$` 或 `$$...$$`）。

但需要注意：

- **部分公式不会恢复原始 LaTeX 源码**
- 它只会把你选中的“渲染结果”包装成 Markdown 数学块
- 因此复杂公式的局部选择，可能无法得到与原公式完全一致的 LaTeX 表达

也就是说：

- **完整公式** → 尽可能恢复原始 LaTeX
- **部分公式** → 只有 Markdown 数学块，不保证原始 LaTeX

---

## 为什么使用它？

### 保持最自然的复制习惯

你仍然只需要使用：

- Windows / Linux：`Ctrl+C`
- macOS：`Cmd+C`
- 浏览器右键菜单中的 **复制**

没有额外悬浮按钮，也没有单独的导出流程。

### 能拿原始 LaTeX 就不猜

对于完整公式，脚本优先读取 ChatGPT 当前页面中已经保存的 LaTeX，而不是把 Unicode 数学符号再反向猜成 LaTeX。

### 得到的是 Markdown，而不是富文本碎片

选中的内容会被重新构造成可复用的 Markdown，包括公式、列表、表格、链接、引用和代码块。

### 完全本地运行

所有处理都发生在你的浏览器中。

- 不使用 `fetch`
- 不使用 `XMLHttpRequest`
- 不使用 WebSocket
- 无分析统计
- 无遥测
- 不上传对话
- 不连接外部服务器

---

## 安装

### 第一步：在 Edge 中安装 Tampermonkey（篡改猴）

1. 打开 **Microsoft Edge**
2. 点击右上角 **“…”**
3. 进入 **扩展**
4. 点击 **获取 Microsoft Edge 扩展**
5. 在扩展商店中搜索 **Tampermonkey**
6. 找到 **Tampermonkey（篡改猴）**
7. 点击 **获取 / 安装**
8. 按提示完成安装
9.(重要！！！） 打开Tampermonkey拓展详情页（点击**管理扩展**），开启“允许用户脚本”

### 第二步：从 GitHub 安装本脚本

1. 打开本仓库
2. 点击文件：chatgpt-copy-markdown-latex.user.js
3. 进入脚本文件页面后，点击 **Raw**
4. Tampermonkey 会自动弹出安装页面
5. 点击 **安装**

### 第三步：刷新 ChatGPT


打开或刷新：


```
https://chatgpt.com/
```


### 第四步：像平常一样复制


在 ChatGPT 中选中你想复制的内容，然后直接按：


- Windows / Linux：`Ctrl+C`
- macOS：`Cmd+C`


再粘贴到 Typora、Obsidian、VS Code、Jupyter Markdown、GitHub Markdown 或其他 Markdown 编辑器即可。


![安装流程](assets/04-install-pipeline.png)
---

## 示例

在 ChatGPT 中同时框选普通文字以及：

$$
z_t=E_\theta(o_t)
$$

和：

$$
\hat z_{t+H}=F_\omega(z_t,A_t)
$$

然后只需按 `Ctrl+C` / `Cmd+C`。

粘贴后的 Markdown 可以是：

```markdown
当前隐状态为 $z_t=E_\theta(o_t)$。

$$
\hat z_{t+H}=F_\omega(z_t,A_t)
$$
```

不需要再一个公式一个公式地单独复制。



---

## 兼容性

| 平台 | 浏览器 | 状态 |
|---|---|---|
| Windows 10/11 | Microsoft Edge | ✅ 主要测试平台 |
| Windows 10/11 | Chrome | 🧪 建议继续测试 |
| macOS | Chrome | 🧪 预计兼容，欢迎测试 |
| macOS | Edge | 🧪 预计兼容，欢迎测试 |
| macOS | Safari | ⚠️ 实验性 / 尚未验证 |
| Firefox | 任意系统 | ⚠️ 实验性 / 尚未验证 |
| iOS / iPadOS | Safari | ❌ 暂不正式支持 |

ChatGPT 随时可能调整页面结构，因此不同浏览器以及不同版本之间的 DOM 兼容性可能发生变化。

---

## 当前限制

- ChatGPT 修改 DOM 后，脚本可能需要同步更新。
- `v0.1.0-beta` 暂不转换跨多条回复的选择，这种情况会退回浏览器原生复制。
- 只有当 ChatGPT 页面暴露了可用的公式源码时，完整公式才能恢复原始 LaTeX。
- 部分公式是 best-effort 转换，复杂局部选择无法保证与原始 LaTeX 完全一致。
- 图片属于 best-effort 处理，链接可能是临时 URL。
- ChatGPT 引用组件可能需要额外做兼容处理。
- 其他会修改剪贴板的扩展或 userscript 可能产生冲突。
- Safari 和 Firefox 目前尚未完整验证。

如果转换过程中出现异常，脚本的设计目标是保留浏览器原生复制能力，而不是让复制功能直接失效。

---

## 测试

手动回归测试位于：

```text
tests/manual-test-matrix.md
```

已经准备好的 ChatGPT 测试提示词位于：

```text
tests/test-prompt.md
```

在把某个平台标记为正式支持之前，应确保该浏览器 / 平台组合通过所有 P0 测试。

---

## Bug 反馈

如果某些内容无法正确复制，请尽量提供：

- 操作系统
- 浏览器及版本
- userscript 管理器及版本
- 脚本版本
- 你实际框选的内容
- 预期得到的 Markdown
- 实际粘贴结果
- 截图
- 如果与公式有关，尽可能提供该公式的 `outerHTML`

建议使用 GitHub Issue 模板，以便问题能够被复现。

---

## 隐私

脚本只在本地处理你选中的 ChatGPT DOM，并把转换结果写入剪贴板。

它**不会**把你的对话上传到任何服务器。

---

## License

采用 MIT License，详见 [`LICENSE`](LICENSE)。

---

## 贡献

欢迎提交 Bug、DOM 样本、浏览器兼容性测试结果，以及目标明确的小型 Pull Request。

详见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
