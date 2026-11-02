import type { ModuleManifest } from "@/platform/types/learning";

export const rwaManifest: ModuleManifest = {
  id: "rwa",
  categoryId: "assets",
  title: "现实世界资产如何连接到链上",
  shortTitle: "现实世界资产 · RWA",
  summary: "追踪代币背后的法律权利、托管、估值和退出边界。",
  description: "通过一个虚构的资产代币化案例，区分链上记录与链下权利，并检查发行、转让、赎回及违约时的关键依赖。",
  status: "available",
  estimatedMinutes: 72,
  locales: ["zh", "en"],
  prerequisites: ["ledger", "token-launch"],
  lessons: [
    {
      id: "rights-and-structure", number: 1, title: "代币到底代表什么权利？", eyebrow: "ASSET · CLAIM · LEGAL STRUCTURE",
      summary: "从底层资产、发行主体和持有人权利出发，区分链上余额与可执行的法律权利。", estimatedMinutes: 12,
      checkpointId: "rwa-rights-structure", objectives: ["区分资产本身、代币记录与对发行主体的请求权", "说明法律文件和适用法律为什么影响持有人权利"],
      concepts: ["现实世界资产", "请求权", "发行主体", "法律结构"], blocks: ["narrative", "simulation", "checkpoint", "recap", "sources"],
      task: { id: "rwa-rights-investigation", title: "把资产和权利分开", misconception: "持有一枚资产代币，就一定直接拥有底层资产。", action: "查看 RWA 实验的资产和代币信息，写下链上能记录什么，以及必须通过什么文件核实持有人权利。", evidence: "代币可以记录份额，但持有人对谁享有什么权利需要看具体安排、文件和适用法律。" },
    },
    {
      id: "issuance-and-custody", number: 2, title: "资产在链下，发行如何核对？", eyebrow: "ISSUANCE · CUSTODY · RECONCILIATION",
      summary: "追踪资产保管、发行记录和定期核对，识别链上供应不能证明的事情。", estimatedMinutes: 12,
      checkpointId: "rwa-issuance-custody", objectives: ["区分链上代币供应与链下资产保管记录", "解释对账、独立核验和信息时点的作用与局限"],
      concepts: ["托管", "发行", "对账", "核验"], blocks: ["narrative", "simulation", "checkpoint", "recap", "sources"],
      task: { id: "rwa-custody-investigation", title: "核对两本账", misconception: "链上显示 100 份代币，就证明链下资产始终足额存在。", action: "在 RWA 实验中调整资产估值并推进报告周期，比较当前估值假设与上次报告的资产估值及报告时点。", evidence: "链上供应只能证明链上记录；资产存在、归属、负担和价值需要链下证据及持续核对。" },
    },
    {
      id: "valuation-and-transfer", number: 3, title: "显示的价格就是卖出的价格吗？", eyebrow: "VALUATION · TRANSFER · LIQUIDITY",
      summary: "比较资产估值、每份参考价值和实际交易价格，并检查转让资格及流动性。", estimatedMinutes: 12,
      checkpointId: "rwa-valuation-transfer", objectives: ["区分参考估值和实际成交价格", "解释转让限制、买卖盘和估值时点如何影响退出"],
      concepts: ["估值", "转让限制", "流动性", "市场价格"], blocks: ["narrative", "simulation", "checkpoint", "recap", "sources"],
      task: { id: "rwa-valuation-investigation", title: "检查价格和转让条件", misconception: "参考估值为 100，就一定能立即以 100 卖出。", action: "在 RWA 实验中调整资产估值与代币数量并比较每份估值；推进报告周期，观察旧报告不随假设自动更新。", evidence: "参考价值取决于输入和时点；真实成交还依赖买家、价格、转让规则及市场流动性。" },
    },
    {
      id: "redemption-and-default", number: 4, title: "赎回受阻或违约时，谁来承担损失？", eyebrow: "REDEMPTION · DEFAULT · RECOVERY",
      summary: "跟随赎回条件、可用流动性和违约处置过程，区分账面承诺与实际回收。", estimatedMinutes: 12,
      checkpointId: "rwa-redemption-default", objectives: ["识别赎回资格、期限和可用资金等退出约束", "解释违约后的权利顺位和实际回收取决于具体法律安排"],
      concepts: ["赎回", "流动性", "违约", "回收"], blocks: ["narrative", "simulation", "checkpoint", "recap", "sources"],
      task: { id: "rwa-redemption-investigation", title: "追踪退出与损失", misconception: "只要代币还能转账，持有人就能随时按面值赎回。", action: "调整现金和申请赎回份额，比较估计请求金额与现金缺口；再列出违约时仍需核实的事项。", evidence: "赎回和回收取决于具体条款、资产与流动性，链上转账能力不能保证按面值退出。" },
    },
    {
      id: "cashflow-and-nav", number: 5, title: "收益、费用和净值如何进入每份价值？", eyebrow: "CASH FLOW · FEES · NAV",
      summary: "用一张假设资产负债表追踪利息、费用、负债和每份净值，并区分净值与成交价。", estimatedMinutes: 12,
      checkpointId: "rwa-cashflow-nav", objectives: ["计算资产减负债后的净值及每份净值", "区分利息、费用、分配、市场价格和现金余额"],
      concepts: ["现金流", "净资产价值", "费用", "每份净值"], blocks: ["narrative", "simulation", "checkpoint", "recap", "sources"],
      task: { id: "rwa-nav-investigation", title: "把收益和费用记到同一张账", misconception: "底层资产有收益，代币持有人就一定按同一比例获得现金。", action: "调整实验的资产总值和份额，先记录每份资产估值；再用正文中的负债、收益和费用案例计算每份净值。", evidence: "总资产除以份额不等于净值；还要扣除负债，现金分配与费用规则也决定实际结果。" },
    },
    {
      id: "due-diligence-and-failure", number: 6, title: "遇到问题时，如何检查证据与回收路径？", eyebrow: "EVIDENCE · FAILURE · RECOVERY",
      summary: "用发行文件、托管证据、估值、权利顺位和退出条件检查一个假设产品。", estimatedMinutes: 12,
      checkpointId: "rwa-due-diligence", objectives: ["提出可验证的发行、托管、估值和退出问题", "区分信息披露、审计范围、即时现金缺口及最终回收"],
      concepts: ["尽职调查", "破产隔离", "追索顺位", "证据时点"], blocks: ["narrative", "simulation", "checkpoint", "recap", "sources"],
      task: { id: "rwa-diligence-investigation", title: "调查一份看似安全的产品", misconception: "只要有托管报告并显示资产充足，就已经证明可以及时全额退出。", action: "把实验中的可用现金调低，观察估算缺口；结合正文逐项核查报告范围、权利主体、费用和退出条件。", evidence: "一份报告不能覆盖所有法律与操作风险；流动性缺口是即时约束，最终回收需要进一步证据。" },
    },
  ],
};
