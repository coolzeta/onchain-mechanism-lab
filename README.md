# 链上机制实验室

面向普通互联网用户的链上机制互动教育网站。当前包含预测市场、AMM、代币发行、治理与金库、撮合引擎、预言机、最小账本、借贷清算、稳定币与 MEV 十个可学习、可操作的机制模块。

```bash
npm install
npm run dev
```

访问 `http://localhost:3000/zh/`。

线上版本：<https://lab.zeta.lol/zh/>

## GitHub Pages

推送到 `main` 后，`.github/workflows/pages.yml` 会运行完整检查、构建静态站点并部署到 GitHub Pages。Pages 构建会读取 GitHub 返回的 `base_path`：默认项目站使用仓库名，自定义域名则使用根路径。普通 Docker 构建不设置该前缀，因此不会影响 `lab.zeta.lol`。

如需在本地检查 Pages 版本：

```bash
GITHUB_PAGES=true GITHUB_REPOSITORY=coolzeta/onchain-mechanism-lab npm run build
```

构建结果位于 `out/`。GitHub Pages 镜像计划使用 `https://chainlab.zeta.lol/`，原有主站仍为 `https://lab.zeta.lol/`。

## 分层

- `src/platform`：站点、内容协议、进度与通用模拟器能力；课程章节共享“误解 → 操作 → 证据”的实验任务卡，十个实验室共享状态快照与实验时间轴，可回退并从任意状态继续分支。首页和进度页还提供可交互的机制依赖地图：每个节点显示证据状态，点击后可沿“它依赖 / 它解锁”继续调查。学习路径页提供本地持久化的起点诊断：先选目标，再用三道边界题把推荐路线解释清楚。
- `src/modules`：彼此隔离的教学领域模块。
- `content/<locale>`：与模拟逻辑分离的课程正文。

新增模块时，实现 `ModuleManifest`，按需提供 `SimulationSpec`，并在模块注册表增加一项即可。
课程适配器遵循 `LessonDefinition` / `ModuleContentRegistry` 契约；`content-contract.test.ts` 会检查每个 locale 的 MDX、checkpoint、来源链接、英文副本和跨模块路由是否完整。

## 当前学习路径

- `/zh/learn/prediction-markets`：六章预测市场课程，覆盖合同、抵押、订单、撮合、价格与预言机。
- `/zh/learn/amm`：四章 AMM 学习路径，覆盖储备、`x·y=k`、价格冲击、滑点、LP 库存、手续费、套利与无常损失。
- `/zh/learn/token-launch`：四章代币发行路径，覆盖总供应、流通、分配、锁仓、稀释、销毁与多签权限。
- `/zh/learn/matching-engine`：四章撮合引擎路径，覆盖价格/时间优先、部分成交、市价单扫深度、价差、撤改单与自成交保护。
- `/zh/learn/oracles`：四章预言机路径，覆盖数据源质量、报告、挑战窗口、经济担保、仲裁与结算交接。
- `/zh/learn/ledger`：最小账本四章路径，覆盖签名/Nonce、交易池替换、区块重放/状态根和确认数/最终性。
- `/zh/learn/lending`：四章借贷与清算路径，覆盖抵押品、LTV、健康度、利息、清算、预言机滞后与坏账。
- `/zh/learn/stablecoins`：四章稳定币路径，覆盖锚定、抵押发行、赎回套利、储备风险与挤兑。
- `/zh/learn/mev`：四章 MEV 与交易排序路径，覆盖交易池、夹子交易、滑点保护、回跑套利、构建者与私有订单流。
- `/zh/learn/governance`：四章治理与金库路径，覆盖提案状态、投票权快照、委托、法定人数、时间锁、金库执行与紧急取消。
- `/zh/challenges`：跨模块系统审计，串起账本、代币、治理、AMM、撮合引擎、MEV、借贷、预言机、稳定币与最终结算十个边界。
- `/zh/paths`：先做“学习起点诊断”（目标 + 三道边界题），再在跨模块学习路径中把底层、资产、市场和风险串成可选择的学习顺序；推荐结果通过 `?path=` 直接打开对应路线。
- `/zh/flows`：价值路径探索器，把账本、资产、治理、流动性、成交、排序、杠杆、预言机、储备和结算串成十个可审计边界；可切换资金流、风险边界和审计问题，并直达对应课程与实验室。
- `/zh/glossary`：可搜索术语表，术语可以回链到对应课程章节。
- `/zh/progress`：跨模块学习进度中心，支持依赖地图、继续学习、复习沙盒、个人知识地图、10 分钟复盘队列和清空本地进度。
- `/zh/journal`：本地研究记录，保存实验状态快照、操作序列、事件轨迹、关键指标和学习者复盘，支持回到实验室、两到三条记录并排对照或导出 JSON。
- `/zh/modules/*`：尚未开放模块的学习路线预览。

英文内容目前开放预测市场、AMM、撮合引擎、MEV、治理与金库、借贷与清算、稳定币、代币发行、最小账本与预言机十条完整路径：

- `/en/learn/prediction-markets`：问题合同、抵押、订单簿、撮合、隐含概率与预言机结算；互动组件与自由沙盒均支持英文。
- `/en/learn/amm`：储备曲线、价格冲击、滑点、LP 库存、手续费、套利与无常损失；课程实验与自由沙盒均支持英文。
- `/en/learn/matching-engine`：价格/时间优先、市价单深度、价差、部分成交、撤改单与自成交保护；课程实验与自由沙盒均支持英文。
- `/en/learn/lending`：抵押品、LTV、健康度、利息、清算、预言机滞后与坏账；课程实验与自由沙盒均支持英文。
- `/en/learn/stablecoins`：锚定、抵押发行、赎回套利、储备损失与挤兑风险；课程实验与自由沙盒均支持英文。
- `/en/learn/token-launch`：供应、分配、锁仓、稀释、销毁与多签权限；课程实验与自由沙盒均支持英文。
- `/en/learn/ledger`：签名/Nonce、交易池替换、区块重放/状态根和确认数/最终性。
- `/en/learn/oracles`：数据源质量、报告、挑战窗口、经济担保、仲裁与结算交接。
- `/en/learn/mev`：交易池可见性、夹子交易、滑点保护、回跑套利、构建者与私有订单流；课程实验与自由沙盒均支持英文。
- `/en/learn/governance`：提案、投票权、委托、法定人数、时间锁、金库与紧急取消；课程实验与自由沙盒均支持英文。
- `/en/progress`：英文模块的进度与复习入口。
- `/en/paths`：英文版学习起点诊断与学习路径；推荐结果会优先落在已经完成英文翻译的账本、AMM、借贷、稳定币、撮合引擎、MEV、治理、预言机与预测市场章节。
- `/en/flows`：English value-path explorer linking the full set of available bilingual courses.

所有当前开放的核心模块均提供中文和英文课程正文、实验室与来源链接。
