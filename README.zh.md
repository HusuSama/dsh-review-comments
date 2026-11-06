# dsh-review-comments

[English](README.md) | 中文

DeepSeek Harness Web UI 的**文件评审评论**插件。它常驻右侧栏：浏览与模糊搜索工作区、带语法高亮和
Git 变更标记地阅读文件、对某一行或一个行区间写评论，然后用一个快捷键把所有评论以紧凑的
`路径#行号` 有序列表发给模型。

> 在 Harness 界面中的入口是右侧栏指南页里的 **文件评审** 卡片（英文：File Review）。

```
┌───────────────┬─────────────────────────────────────────┐
│  文件          │  src/utils/changesItems.tsx        M     │
│  ─────────    │  1  import { parse } from './parse'     │
│  src/         │  2  export function changesItems(...)   │
│   utils/  ●   │  3    const items = list.map(toItem)    │
│   app.tsx M   │  4    return items.filter(Boolean)      │
│  README.md    │  ┌───────────────────────────────────┐  │
│               │  │ L2-L4  评论：这里要处理空数组        │  │
│               │  └───────────────────────────────────┘  │
└───────────────┴─────────────────────────────────────────┘
```

## 定位

这个插件聚焦在**评论**：阅读完整文件内容，把评论锚定到某一行或行区间，再把收集到的评论交给模型。
Git 变更只作为上下文标记展示，浏览变更与写评论互不干扰。

## 功能

- **右侧栏入口** —— Harness 右侧栏指南页中的一张卡片；没有独立窗口或自绘面板外壳，tab 体系、
  主题 token 与多语言都复用 Harness 自身。
- **递归模糊搜索** —— 输入名字的任意片段即可：`changesitems` 能找到 `changes_items.tsx`，
  分隔符与跳字都不影响匹配；结果按匹配度排序并按目录分组。自动跳过
  `.git`/`.svn`/`.hg`/`node_modules`。
- **语法高亮** —— JS/TS/JSX、JSON、CSS/SCSS/Less、HTML/XML/SVG/Vue、Markdown、
  Python/Shell/YAML/TOML/INI/Dockerfile/Makefile、SQL、diff/patch；其他后缀回退纯文本。
  超过 5000 行的长文件不做高亮以保证响应。
- **Git 状态** —— 新增/未跟踪为绿色、修改/重命名为蓝色、删除为红色、冲突为橙色；文件树里带
  A/M/D/R/U 字母标记，文件内容里用行左侧竖线标记（新增绿/修改蓝/删除位置短红条）。
  「仅看变更」开关只列出当前项目未提交的变更文件。
- **按行评论** —— 双击某一行，或按住拖动选中一个行区间，在选区下方弹出的输入框里写评论。
  `Enter` 变成行内评论卡片；`Shift+Enter` 换行；`Esc` 取消。
- **一键发送给模型** —— `Ctrl/Cmd+Enter`（或发送按钮）把格式化后的评论列表写进对话输入框并提交，
  与在输入框里按 Enter 完全同一条链路；输入框里已有的草稿会保留。
- **明暗主题 + 中英文** —— 颜色全部来自 `--dsw-alias-*` 主题 token；内置简体中文与英文词条。

## 环境要求

- 一个 Web UI 带右侧栏的 DeepSeek Harness profile（`@deepseek-ai/dsh-client-ui-sidebar-right`，
  默认 web bundle 自带）。已在 macOS + DeepSeek Harness `0.2.1-rc.5` 上验证；其他桌面/Web
  平台理论上通用。
- 仅从源码构建时需要 Node.js ≥ 20。
- 可选：`PATH` 里有 `git`。没有 git 时插件照常工作，只是不显示 Git 状态。

## 安装

### 通过插件管理页（推荐）

1. 打开 **设置 → 插件**。
2. 安装 `dsh-review-comments`（填包名，或选择本地 checkout 目录）。
3. bundle 会自动启用，浏览器半侧热加载进当前页面。

### 通过命令行

```bash
dsh plugin --profile web add dsh-review-comments
# 用本地 checkout 而不是 registry：
dsh plugin --profile web add link:/absolute/path/to/dsh-review-comments
```

然后在 **设置 → 插件** 里启用 **File Comments** bundle。无需重启应用：浏览器半侧热替换，
Host 半侧随 bundle 一起启动。

### 从源码安装

```bash
git clone https://github.com/HusuSama/dsh-review-comments.git
cd dsh-review-comments
node build.mjs                 # 由 src/ 重新生成 client.js
node --test tests/core.test.mjs
dsh plugin --profile web add link:"$PWD"
```

## 使用

打开右侧栏（会话标题栏右侧的展开按钮）→ 指南页 → **文件评审** 卡片。点卡片（或点 tab 栏的
新增按钮选这张卡片）即可打开文件管理。若右侧栏已经展开，先关掉别的 tab 再走指南页。

| 操作 | 位置 | 效果 |
| --- | --- | --- |
| 点击目录 | 文件列表 | 展开/收起（按层懒加载） |
| 在搜索框输入 | 文件列表顶部 | **递归模糊搜索**整个工作区，按匹配度排序、按目录分组；清空回到文件树 |
| 打开「仅看变更」 | 文件列表头部 | 只列出当前会话项目未提交的 git 变更文件 |
| 点击文件 | 文件列表 / 搜索结果 | 打开文件：行号、语法高亮、Git 变更标记 |
| 双击某一行 | 文件内容 | 在该行下方弹出评论输入框 |
| 按住拖动跨行 | 文件内容 | 选中行区间，在区间下方弹出输入框；输入期间选区高亮保持可见 |
| `Enter` | 评论输入框 | 在该处生成评论卡片 |
| `Shift+Enter` | 评论输入框 | 评论内换行 |
| `Ctrl/Cmd+Enter` | 评论输入框 / 顶部发送按钮 | 把所有评论发送给模型 |
| `Esc` | 评论输入框 | 取消 |
| 卡片上的删除按钮 | 评论卡片 | 删除该条评论 |

评论按侧栏 tab 缓存在内存里，切走再切回不会丢；发送或删除即可清理。

### 模型收到什么

一条用户消息：一行说明 + 每条评论一个有序列表项——绝对路径加 `#起始行`（或
`#起始行:结束行`），后面跟评论正文。**不附带代码摘录**，模型可以按行号自己读取。

```markdown
我在文件中留了 3 条评审评论，请按文件与行号逐条处理。

1. `/Users/me/proj/README.md#5` 标题需要说明用途
2. `/Users/me/proj/src/client/index.ts#12` 这里没有处理 null 情况
3. `/Users/me/proj/src/client/index.ts#20:24` 这段逻辑可以提取为函数
```

文案跟随当前界面语言；条目按路径与起始行排序，多行评论正文保持列表缩进。

### Git 状态

Host 半侧每 2.5 秒扫描一次会话工作目录，把结果写成包内 `.status/` 目录下的每会话 JSON；
浏览器半侧通过 Harness 普通的文件 Remote 读取它。

- 文件树：新增/未跟踪绿色、修改/重命名蓝色、删除红色（删除线）、冲突橙色；含变更的目录有提示；
  行尾有 `A/M/D/R/U` 字母标记。
- 文件内容：代码左侧 3px 竖线标记新增（绿）/修改（蓝）行；删除位置在锚定行上沿显示短红条；
  文件头部显示该文件的状态。
- 「仅看变更」按目录分组列出变更文件；删除的文件显示提示而不打开。
- 每会话上限：2000 个文件、8000 个行区间、JSON 约 1.5 MB，超出后会标记为截断。

### 搜索

搜索框是递归 + 模糊的：

- `changesitems` → `src/utils/changes_items.tsx`（忽略分隔符）
- 匹配度从高到低：文件名完全相同 > 文件名前缀 > 文件名包含 > 路径包含 > 去分隔符后包含 >
  字符按顺序出现的模糊匹配
- 跳过目录：`.git`、`.svn`、`.hg`、`node_modules`
- 有上限：400 个目录、4000 个文件、300 条结果、4 秒；被截断会提示「结果过多」；清空搜索框
  原样恢复文件树（展开状态不变）。

## 实现方式

- `index.js` —— Host 半侧：用 Harness 的 `sessions` + `workingDirectory` 服务找到每个活跃会话的
  项目目录，通过 `child_process` 调用 `git rev-parse/status/diff`，把结果原子写入
  `.status/<sessionId>.json`（内容不变不重写）。
- `client.js`（由 `build.mjs` 生成）—— 浏览器半侧：注册右侧栏 tab 类型
  （`ctx.sidebarRightTabs.register`）与 `sidebar.right.pane.tab` 槽位组件，通过
  `remote.workspaceFiles` 读取工作区文件并轮询上面的状态文件。
- 发送复用输入框自己的 `inputActions.setDraft()/submit()`，也就是聊天框按 Enter 的同一条路径；
  插件本身不往会话日志里写任何东西。
- 所有视觉都使用 `--dsw-alias-*` 主题 token（`link`、`bg-document-selection`、
  `interactive-bg-hover-accent`、`elevation-panel` 等），因此明暗主题与皮肤自动适配。

## 项目结构

| 路径 | 作用 |
| --- | --- |
| `index.js` | Host 半侧：git 状态轮询与状态文件写入 |
| `src/client.core.js` | 纯逻辑：路径、消息格式化、词法高亮、git/搜索工具（有单测） |
| `src/client.ui.js` | React UI（无 JSX）：文件树、搜索、文件视图、评论输入框/卡片、CSS |
| `src/client.apply.js` | 注册：语言词条、tab 类型、槽位组件、样式表 |
| `build.mjs` | 把三个源文件拼成 `client.js`（不要手改 `client.js`） |
| `tests/core.test.mjs` | Node 内置测试运行器，152 条用例 |
| `locale/*.json`、`icon.svg` | 插件展示元数据 |

### 开发

```bash
node build.mjs                # 重新生成 client.js
node --test tests/core.test.mjs   # 152 条单测
node --check client.js        # 语法检查
```

`client.js` 改动后约半秒会自动热替换进打开的页面（Harness 的 `client-hmr` 监听）。Host 半侧随
bundle 加载：改完 `index.js` 后在 **设置 → 插件** 里禁用再启用一次 bundle（或重启 Harness）即可。

## 已知限制

- 仅支持文本文件；二进制/无法解码的文件会提示「不是文本文件」，不提供图片、PDF、Office 预览。
- Git 状态只覆盖活跃会话的工作目录；非 git 仓库时该功能禁用。
- 评论锚定在写入时显示的行号上；文件被编辑或刷新成另一版本后，已有卡片不会自动迁移。
- 文件分页读取上限 20,000 行；超过 5,000 行不做语法高亮。
- 搜索与 Git 数据有上文所述的上限。

## 许可证

[MIT](LICENSE)
