# 项目工作标准

## 数学与物理习题

如果用户询问数学或物理习题，必须遵守以下输出格式：

0. 使用 LaTeX 书写物理、数学符号和公式。
1. 先完整抄写题目。
2. 再逐步解答。
3. 如果有多个小题，先写“题目汇总”，再逐小题解答。
4. 每个小题开始解答前，都要重新抄写该小题。
5. 最后给出清晰的结论。

语言风格要求步步详实、有依据，把用户当成悟性较好的孩子来教。每次教学可以包含较高的知识密度，并说明解法背后的原理及有帮助的拓展内容。不得臆造题目中缺失的条件、图形数据或物理量；如信息不足，应明确指出缺失信息及其影响。

## 题库存储与构建

- 存储系统采用文件系统中的 JSONL；构建产物采用 SQLite；不引入数据库服务。
- 题库按导入批次分片，每个文件保存约 `100~500` 题。不要采用“每题一个文件”，也不要把全部题目合并为单个超大文件。
- 题目文字与图片通过路径引用联动，使用 `figures: [...]` 数组记录图片路径；绝不将图片以 Base64 内嵌到 JSONL 或其他题库记录中。
- 题库内部以链接为主。ZIP 或 SQLite 仅作为分发、构建产物或交付步骤，不得反过来定义原始存储格式。

## 题库架构与实现规范

### 总原则

题库是九年级数学、物理的静态内容，预计规模为 `3000~10000` 题，存储分为三层：

1. 创作层（唯一事实源）：文件系统中的 JSONL 文件，按导入批次分片。
2. 服务层（查询索引）：`data/question-bank/bank.db`，SQLite 单文件，是构建产物，不入 Git。
3. 图片层：配图独立存放，JSON 中使用仓库根目录相对路径引用，禁止 Base64 内嵌。

### 目录结构

仓库根目录下使用 `data/question-bank/`：

```text
data/question-bank/
├── staging/            # AI 导入产物，待审核，按批次分片
│   ├── zip_001_q01_q10.jsonl
│   └── zip_001_q11_q15.jsonl
├── reviewed/           # 审核通过的正式题库
├── assets/             # 配图，按批次建子目录
│   └── <batch>/<question_id>_fig<n>.<png|webp|jpg>
├── bank.db             # 构建产物，SQLite，必须加入 .gitignore
└── _check.mjs          # 校验脚本
```

目录约定：

- 一个来源 ZIP 对应一个导入批次，文件名为 `<batch>_q<起始序号>_q<结束序号>.jsonl`，单文件保存 `100~500` 题。
- `staging/` 与 `reviewed/` 中的行格式完全一致。审核通过时，将文件从 `staging/` 移到 `reviewed/`，并更新其中的 `review_status` 字段，不做其他内容改动。
- 同一批次允许追加写入：AI 分批产出后可 append 到已存在的同批次文件，行格式必须保持一致。
- `data/question-bank/staging/` 中已有 JSONL 的内容禁止修改。

### 题目 JSON 格式

每行一条完整 JSON，使用 UTF-8 编码。字段约定如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `string` | 全局唯一，格式 `<subject><grade>-<batch>-q<序号>`，例如 `math9-zip001-q01` |
| `parent_id` | `string \| null` | 大题含小题时，小题填写父题 `id` |
| `subject` | `string` | `math` 或 `physics` |
| `grade` | `number` | `9` |
| `chapter` | `string` | 章节名；无法判断时填 `待确认` |
| `knowledge_points` | `string[]` | 一个或多个知识点 |
| `question_type` | `string` | 选择题/填空题/计算题/证明题/实验题/综合题 |
| `content_type` | `string` | `exam_question` / `concept_check` / `example` / `knowledge_note` / `待确认` |
| `practice_eligible` | `boolean` | 是否可进入正式针对性练习 |
| `difficulty` | `string` | 基础/中等/较难/竞赛超纲/待确认 |
| `question_text` | `string` | 完整题干；数学公式使用 LaTeX，行内 `$...$`，独立 `$$...$$` |
| `options` | `string[]` | 选择题选项，含 `A. ` 前缀；非选择题为空数组 |
| `answer` | `string \| null` | 标准答案；无资料依据时填 `null` |
| `answer_status` | `string` | `provided` / `未提供` |
| `solution` | `string \| null` | 完整解析；无资料依据时填 `null` |
| `solution_method` | `string` | 主要解法或物理规律；无可靠解析时填 `待确认` |
| `has_diagram` | `boolean` | 是否依赖图形、表格或实验装置 |
| `figures` | `string[]` | 渲染用配图；填写仓库根目录相对路径，按题干中“如图”的出现顺序对应；无图为空数组 |
| `source` | `object` | `{ "file": string, "page": number \| null, "image": string \| null }`；`file` 为原始文件名，`image` 指向 `rawmaterial/_extracted/` 下的原始截图，仅用于溯源 |
| `ocr_confidence` | `string` | `high` / `medium` / `low` |
| `review_status` | `string` | 待审核 / 已复核 / 不纳入题库 / 首轮已核对，待入库审核 |
| `uncertainties` | `string[]` | 待人工确认事项 |
| `duplicate_group` | `string \| null` | 疑似重复分组标识 |
| `solution_conflict` | `boolean` | 解析与题目是否冲突 |
| `notes` | `string` | 备注 |

### `_check.mjs` 校验规则

校验脚本必须检查：

- 每行都可被 `JSON.parse` 解析，且字段类型符合上述约定。
- `id` 全局唯一，并符合 `<subject><grade>-<batch>-q<序号>` 格式。
- 数学字段（`question_text`、`options`、`answer`、`solution`）的 LaTeX 合法性：不含 `\\text{}`，不含连续双反斜杠，中文不得进入公式。
- `figures` 数组引用的每个文件都真实存在于 `assets/` 对应路径。
- `source.page` 必须是数字或 `null`。

### `build:bank` 构建脚本

根目录 `package.json` 必须提供 `build:bank` 脚本。使用 Node 内置 `node:sqlite`（Node 22+，零外部依赖），不得安装或使用 `better-sqlite3`。

构建流程必须：

1. 遍历 `data/question-bank/reviewed/*.jsonl`，逐行解析并复用 `_check.mjs` 的校验逻辑；校验失败立即中止，并报告具体文件与行号。
2. 生成 `data/question-bank/bank.db`：建立 `questions` 表，列对应上述字段；为 `subject`、`chapter`、`knowledge_points`、`question_type`、`difficulty`、`review_status` 建立索引；为 `question_text` 建立 FTS5 全文索引。
3. 输出各文件题数、总题数、按章节/题型/难度统计，并核对统计总数与实际解析记录数一致。

### 明确边界

- 禁止修改 `data/question-bank/staging/` 中已有 JSONL 的内容。
- 不引入数据库服务，不使用 Postgres、MongoDB 等；`bank.db` 是唯一查询入口。
- 变式题、生成题不在本次范围内，不设计相关数据表。
- `data/local-learning-data.json` 是用户学习记录，不属于本题库方案，禁止改动。

## 每次工作

开始处理项目任务前，先阅读本文件，并将其中的要求作为本项目后续工作的默认标准。
