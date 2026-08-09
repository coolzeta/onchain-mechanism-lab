export interface GlossaryEntry {
  term: string;
  definition: string;
  relatedLesson?: string;
  relatedModuleId?: string;
}

export interface GlossaryGroup {
  title: string;
  terms: GlossaryEntry[];
}

export const glossaryGroups: GlossaryGroup[] = [
  {
    title: "预测市场",
    terms: [
      { term: "二元市场", definition: "只有 YES 与 NO 两个互斥结果的事件市场。", relatedLesson: "a-question-that-can-settle" },
      { term: "结果份额", definition: "在指定结果发生时兑付固定金额的资产，例如一份 YES。", relatedLesson: "one-dollar-two-futures" },
      { term: "完整份额", definition: "一份 YES 与一份 NO 的组合；无论结果如何，总有一边兑付。", relatedLesson: "one-dollar-two-futures" },
      { term: "隐含概率", definition: "把结果份额价格按最大兑付归一化后的概率式读法，不等同于客观概率。", relatedLesson: "price-is-not-truth" },
    ],
  },
  {
    title: "交易与市场",
    terms: [
      { term: "限价单", definition: "只允许在指定价格或更有利价格成交的订单。", relatedLesson: "beliefs-enter-the-book" },
      { term: "买一 / 卖一", definition: "订单簿中最高买价与最低卖价。", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
      { term: "价差", definition: "卖一减去买一；常用于观察市场交易成本与流动性。", relatedLesson: "spread-and-liquidity", relatedModuleId: "matching-engine" },
      { term: "市场深度", definition: "不同价格档位上可立即成交的订单数量；它同时影响大单能成交多少和平均执行价会走多远。", relatedLesson: "market-orders-and-depth", relatedModuleId: "matching-engine" },
      { term: "价格时间优先", definition: "先比较价格；价格相同时，先进入订单簿的订单先成交。", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
      { term: "部分成交", definition: "订单只有一部分数量找到对手方，剩余数量继续等待。", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
      { term: "静止订单价格", definition: "撮合时采用先进入订单簿、等待成交的那张订单价格，而不是新进入订单的限价。", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
      { term: "撮合引擎", definition: "按明确排序和成交规则，把交叉买卖订单转换成成交记录与余额变化的状态机。", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
      { term: "市价单", definition: "优先立即成交、把价格交给当前盘口流动性的订单；它可能跨越多个价格档位。", relatedLesson: "market-orders-and-depth", relatedModuleId: "matching-engine" },
      { term: "平均执行价", definition: "整笔订单的成交金额除以成交数量，用来观察跨档位成交后的真实价格。", relatedLesson: "market-orders-and-depth", relatedModuleId: "matching-engine" },
      { term: "撤改单", definition: "结束旧订单并以新的价格或数量重新排队；新订单通常获得新的时间序号。", relatedLesson: "risk-controls-and-replacement", relatedModuleId: "matching-engine" },
      { term: "自成交保护", definition: "阻止同一账户的买卖订单互相成交，避免制造虚假的成交量和价格信号。", relatedLesson: "risk-controls-and-replacement", relatedModuleId: "matching-engine" },
    ],
  },
  {
    title: "AMM 与流动性",
    terms: [
      { term: "储备", definition: "资金池当前持有的两种资产数量，比例决定下一笔交换的边际报价。", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
      { term: "恒定乘积", definition: "用 x·y=k 约束两种储备变化的做市曲线；手续费会让 k 随时间增长。", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
      { term: "滑点", definition: "预期报价与实际成交价之间的差异，通常会随交易规模和池子深度变化。", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
      { term: "流动性提供者（LP）", definition: "把资产存入池子、按份额分享手续费，同时承担库存比例变化风险的人。", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
      { term: "套利", definition: "利用不同市场之间的价格差交易，使 AMM 的储备比例逐步靠近外部价格。", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
      { term: "价格冲击", definition: "一笔交易因改变储备比例而造成的执行价偏离；它与手续费是两种不同的成本。", relatedLesson: "price-impact-and-slippage", relatedModuleId: "amm" },
      { term: "执行价", definition: "整笔交换的输入除以输出得到的平均成交价格，不等于交易前的瞬时现货价。", relatedLesson: "price-impact-and-slippage", relatedModuleId: "amm" },
      { term: "无常损失", definition: "LP 当前资产组合相对单纯持有基准的价值差异，通常在退出时才变成已实现结果。", relatedLesson: "arbitrage-and-impermanent-loss", relatedModuleId: "amm" },
    ],
  },
  {
    title: "代币与供应",
    terms: [
      { term: "总供应", definition: "系统已经承认存在的全部代币数量，包括仍处于锁仓状态的份额。", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
      { term: "流通供应", definition: "当前可以转账、交易或使用的代币余额；它通常小于或等于总供应。", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
      { term: "增发权限", definition: "能够调用铸造逻辑、把新代币写进总供应的账户或治理角色。", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
      { term: "锁仓（Vesting）", definition: "代币已经分配给某个计划，但要等时间和领取动作才进入可用余额。", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
      { term: "稀释", definition: "总供应增加或持有比例下降后，单个代币代表的相对份额被摊薄。", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
      { term: "供应悬垂", definition: "已经计入总供应、未来可能进入流通的锁仓余额；它会影响对未来供给压力的判断。", relatedLesson: "allocation-and-vesting", relatedModuleId: "token-launch" },
      { term: "销毁", definition: "从持有人的可用余额中移除代币并同步减少总供应，不等同于把代币转给一个地址。", relatedLesson: "dilution-and-distribution", relatedModuleId: "token-launch" },
      { term: "多签", definition: "要求多个批准者达到阈值后才能执行权限动作的控制方式，用来降低单一密钥风险。", relatedLesson: "permissions-and-governance", relatedModuleId: "token-launch" },
      { term: "权限移交", definition: "把铸造等特权从一个批准者状态转换到另一个批准者；它不自动改变已经存在的供应。", relatedLesson: "permissions-and-governance", relatedModuleId: "token-launch" },
    ],
  },
  {
    title: "借贷与清算",
    terms: [
      { term: "抵押品价值", definition: "协议按预言机价格估算的已存入资产价值；它会随着价格输入变化。", relatedLesson: "collateral-and-borrowing", relatedModuleId: "lending" },
      { term: "借款率（LTV）", definition: "债务相对抵押品价值的比例上限，用来给价格波动和清算摩擦留下缓冲。", relatedLesson: "collateral-and-borrowing", relatedModuleId: "lending" },
      { term: "健康度", definition: "把抵押品价值、清算阈值和债务压缩成一个风险读数；低于 1.00 通常进入可清算状态。", relatedLesson: "interest-and-health", relatedModuleId: "lending" },
      { term: "清算价格", definition: "在其他参数不变时，让健康度刚好跌到清算线的抵押品价格，不是对未来价格的预测。", relatedLesson: "price-shock-and-liquidation", relatedModuleId: "lending" },
      { term: "清算人", definition: "在风险越过协议边界后，用自己的资产偿还债务并按规则接收抵押品奖励的参与者。", relatedLesson: "price-shock-and-liquidation", relatedModuleId: "lending" },
      { term: "坏账", definition: "所有可处置抵押品都不足以覆盖后仍然存在的债务缺口；需要储备、保险或其他机制承担。", relatedLesson: "oracle-and-bad-debt", relatedModuleId: "lending" },
    ],
  },
  {
    title: "治理与金库",
    terms: [
      { term: "提案", definition: "把目标、动作和参数编码成待投票、可排队、可执行的状态变化。", relatedLesson: "proposal-as-state", relatedModuleId: "governance" },
      { term: "投票权快照", definition: "在提案创建时冻结余额与委托关系，防止投票期间临时变动同一项权力。", relatedLesson: "voting-power-and-delegation", relatedModuleId: "governance" },
      { term: "委托", definition: "把自己的代表权交给另一名成员，不增加代币供应，也不能让同一份票被重复计算。", relatedLesson: "voting-power-and-delegation", relatedModuleId: "governance" },
      { term: "法定人数", definition: "一项提案获得继续资格前，必须达到的最低参与投票权；它和赞成多数是两个条件。", relatedLesson: "voting-power-and-delegation", relatedModuleId: "governance" },
      { term: "时间锁", definition: "把提案通过和执行之间拉开一段公开延迟，给观察、响应和取消留下窗口。", relatedLesson: "timelock-and-execution", relatedModuleId: "governance" },
      { term: "金库", definition: "由协议控制、可通过治理动作支出的资产余额；拨款只有执行后才会移动。", relatedLesson: "treasury-and-emergency", relatedModuleId: "governance" },
      { term: "紧急取消", definition: "在时间锁操作执行前阻止调用的安全路径；它停止资产移动，但不会抹掉投票历史。", relatedLesson: "treasury-and-emergency", relatedModuleId: "governance" },
    ],
  },
  {
    title: "稳定币与储备",
    terms: [
      { term: "稳定币", definition: "试图相对稳定某个参考单位的代币；稳定机制可能来自抵押、赎回、套利或储备，而不是名字本身。", relatedLesson: "peg-and-redemption", relatedModuleId: "stablecoins" },
      { term: "目标价格", definition: "协议希望稳定币围绕的参考值，例如 1 美元；它是设计目标，不是外部市场已经兑现的事实。", relatedLesson: "peg-and-redemption", relatedModuleId: "stablecoins" },
      { term: "市场价格", definition: "稳定币在外部市场中实际成交出来的价格；它可能偏离目标价格，也不会被协议文字自动改回。", relatedLesson: "depeg-and-arbitrage", relatedModuleId: "stablecoins" },
      { term: "赎回", definition: "持有人按协议规则销毁稳定币并取回抵押资产的退出动作；它受储备、费用、价格输入和额度限制。", relatedLesson: "peg-and-redemption", relatedModuleId: "stablecoins" },
      { term: "超额抵押", definition: "抵押品价值高于稳定币负债的发行方式，用额外缓冲吸收价格波动和执行摩擦。", relatedLesson: "collateral-and-minting", relatedModuleId: "stablecoins" },
      { term: "稳定币抵押率", definition: "抵押品价值除以稳定币供应或负债的比例；它衡量每份承诺背后的资产缓冲，不等同于市场价格。", relatedLesson: "collateral-and-minting", relatedModuleId: "stablecoins" },
      { term: "脱锚", definition: "稳定币市场价格持续偏离目标价格；赎回和套利可以创造修复激励，但不能替代真实流动性和储备。", relatedLesson: "depeg-and-arbitrage", relatedModuleId: "stablecoins" },
      { term: "储备覆盖", definition: "可处置储备相对于未结算稳定币供应的覆盖程度；储备减少时，账面供应不会自动消失。", relatedLesson: "reserves-and-run-risk", relatedModuleId: "stablecoins" },
      { term: "挤兑", definition: "大量持有人在相近时间请求退出，导致储备、流动性或赎回顺序成为系统边界。", relatedLesson: "reserves-and-run-risk", relatedModuleId: "stablecoins" },
    ],
  },
  {
    title: "交易排序与 MEV",
    terms: [
      { term: "MEV（可提取价值）", definition: "因为看见交易意图、控制交易顺序或改变执行组合，而能从系统参与者之间重新分配的价值；它不自动等同于非法攻击。", relatedLesson: "mempool-and-ordering", relatedModuleId: "mev" },
      { term: "公开交易池", definition: "交易执行前暂存待处理意图的共享观察面；可见性让搜索者能够准备竞争性排序。", relatedLesson: "mempool-and-ordering", relatedModuleId: "mev" },
      { term: "夹子交易", definition: "搜索者在用户交易前后分别执行一笔交易，利用用户交易造成的价格移动尝试提取差额。", relatedLesson: "sandwich-and-slippage", relatedModuleId: "mev" },
      { term: "最小得到数量", definition: "交换者愿意接受的最低输出；执行时若报价跌破它，交易应回滚而不是默默接受更差结果。", relatedLesson: "sandwich-and-slippage", relatedModuleId: "mev" },
      { term: "回跑套利", definition: "先让用户交易改变池子状态，再在后面对新的价格执行另一笔交易；利润仍然必须来自账本中的资产转移。", relatedLesson: "backrun-and-arbitrage", relatedModuleId: "mev" },
      { term: "私有订单流", definition: "在公开交易池之外传递交易意图的路径，减少公开搜索者的可见性，但不会消除构建者和提议者的信任边界。", relatedLesson: "builders-and-private-orderflow", relatedModuleId: "mev" },
    ],
  },
  {
    title: "账本与状态",
    terms: [
      { term: "签名", definition: "账户控制者对具体交易字段的密码学授权；它不等于余额验证或交易已经确认。", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
      { term: "Nonce", definition: "账户交易序列号，用来区分交易顺序并阻止同一笔授权被重复执行。", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
      { term: "状态转换", definition: "协议根据一笔有效交易，把旧余额、Nonce 等状态确定性地计算成新状态。", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
      { term: "状态根", definition: "对一组账户状态的摘要，帮助不同节点验证自己是否得到了相同的执行结果。", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
      { term: "交易池（Pending）", definition: "已经广播但还没有被区块执行的交易集合；它们可能因签名、Nonce 或余额问题被拒绝。", relatedLesson: "transaction-pool-and-replacement", relatedModuleId: "ledger" },
      { term: "替换交易", definition: "使用相同 Nonce 重新签名的新交易版本；它替换等待中的旧版本，不会让同一序号成功两次。", relatedLesson: "transaction-pool-and-replacement", relatedModuleId: "ledger" },
      { term: "区块哈希", definition: "承诺前序区块、交易指纹和状态根的摘要；其中任一输入变化都会使承诺失效。", relatedLesson: "block-order-and-state-root", relatedModuleId: "ledger" },
      { term: "确认数", definition: "某个区块之后继续产生的区块层数，用来衡量重组缓冲而不是统一的最终性保证。", relatedLesson: "finality-and-confirmations", relatedModuleId: "ledger" },
      { term: "最终性", definition: "在共识规则下一个状态可以被上层应用安全依赖的保证；它与区块已经被包含并不完全相同。", relatedLesson: "finality-and-confirmations", relatedModuleId: "ledger" },
    ],
  },
  {
    title: "结算与链上机制",
    terms: [
      { term: "抵押", definition: "提前锁定、用于保证未来义务能够履行的资产。", relatedLesson: "one-dollar-two-futures", relatedModuleId: "prediction-markets" },
      { term: "预言机", definition: "把链外事实按照约定规则写入链上系统的机制；它包含数据源、报告与争议流程。", relatedLesson: "report-challenge-finalize", relatedModuleId: "oracles" },
      { term: "挑战窗口", definition: "允许参与者对初始报告提出异议的一段时间，通常伴随担保和仲裁规则。", relatedLesson: "report-challenge-finalize", relatedModuleId: "oracles" },
      { term: "数据源质量", definition: "外部来源的一致性、及时性和可验证程度；它影响风险，但不会自动给出最终结果。", relatedLesson: "source-quality-and-reporting", relatedModuleId: "oracles" },
      { term: "报告者", definition: "把外部证据转换成带责任和担保的链上结果主张的参与者。", relatedLesson: "source-quality-and-reporting", relatedModuleId: "oracles" },
      { term: "经济担保", definition: "报告者或挑战者为自己的结果锁定的积分；它让错误主张承担可量化成本。", relatedLesson: "challenge-windows-and-bonds", relatedModuleId: "oracles" },
      { term: "结算交接", definition: "预言机最终化后，把结果明确交给预测市场等下游协议读取和结算的接口动作。", relatedLesson: "settlement-handoff-and-failure", relatedModuleId: "oracles" },
      { term: "不变量", definition: "系统在每次状态变化后都必须成立的条件，例如总资产守恒。", relatedLesson: "one-dollar-two-futures" },
      { term: "确定性重放", definition: "用相同初始状态和事件顺序，重复得到完全相同结果。", relatedLesson: "how-matching-makes-a-price" },
    ],
  },
];

export const glossaryEntries = glossaryGroups.flatMap((group) => group.terms.map((term) => ({ ...term, group: group.title })));

export const englishGlossaryGroups: GlossaryGroup[] = [
  { title: "Prediction markets", terms: [
    { term: "Binary market", definition: "A market with two mutually exclusive outcomes, such as YES and NO, whose settlement rule is defined before trading.", relatedLesson: "a-question-that-can-settle", relatedModuleId: "prediction-markets" },
    { term: "Outcome share", definition: "A position that pays a fixed amount when its named outcome occurs, such as one YES share.", relatedLesson: "one-dollar-two-futures", relatedModuleId: "prediction-markets" },
    { term: "Complete set", definition: "One YES share plus one NO share; one side pays at settlement regardless of which outcome wins.", relatedLesson: "one-dollar-two-futures", relatedModuleId: "prediction-markets" },
    { term: "Implied probability", definition: "A probability-like reading of an outcome-share price divided by its maximum payout; it is a market signal, not an objective fact.", relatedLesson: "price-is-not-truth", relatedModuleId: "prediction-markets" },
    { term: "Collateral", definition: "Assets locked before a future obligation so the winning side can be paid without creating value at settlement.", relatedLesson: "one-dollar-two-futures", relatedModuleId: "prediction-markets" },
    { term: "Settlement", definition: "The state transition that uses a finalized outcome to make winning positions claimable and losing positions unpayable.", relatedLesson: "oracle-and-resolution", relatedModuleId: "prediction-markets" },
  ] },
  { title: "Trading & markets", terms: [
    { term: "Limit order", definition: "An order that executes only at its stated price or a better one, leaving the trade conditional on available counterparties.", relatedLesson: "beliefs-enter-the-book", relatedModuleId: "prediction-markets" },
    { term: "Best bid / ask", definition: "The highest standing buy price and lowest standing sell price in an order book.", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
    { term: "Spread", definition: "The best ask minus the best bid; it is a visible cost of immediacy and a signal about liquidity.", relatedLesson: "spread-and-liquidity", relatedModuleId: "matching-engine" },
    { term: "Market depth", definition: "The quantity available at each price level; depth determines how far a large order moves its average execution price.", relatedLesson: "market-orders-and-depth", relatedModuleId: "matching-engine" },
    { term: "Price-time priority", definition: "The matching rule that compares price first and arrival time second when prices are equal.", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
    { term: "Partial fill", definition: "A state in which only part of an order finds a counterparty and the remainder stays open or is canceled by its policy.", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
    { term: "Resting-order price", definition: "The price of the order already waiting in the book, used as the execution price when a new order crosses it.", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
    { term: "Matching engine", definition: "A deterministic state machine that turns crossed orders into fills and balance changes under explicit priority rules.", relatedLesson: "priority-and-partial-fills", relatedModuleId: "matching-engine" },
    { term: "Market order", definition: "An order that prioritizes immediate execution and accepts the prices offered by current book liquidity.", relatedLesson: "market-orders-and-depth", relatedModuleId: "matching-engine" },
    { term: "Average execution price", definition: "Total execution value divided by executed quantity; it reveals the real price after an order consumes multiple levels.", relatedLesson: "market-orders-and-depth", relatedModuleId: "matching-engine" },
    { term: "Cancel-replace", definition: "Ending an old order and re-entering with a new price or size, usually receiving a new time priority.", relatedLesson: "risk-controls-and-replacement", relatedModuleId: "matching-engine" },
    { term: "Self-trade prevention", definition: "A rule that stops one account's own buy and sell orders from matching to create artificial volume or price signals.", relatedLesson: "risk-controls-and-replacement", relatedModuleId: "matching-engine" },
  ] },
  { title: "AMMs & liquidity", terms: [
    { term: "Reserve", definition: "The quantity of each asset held by a pool; the reserve ratio determines the next marginal quote.", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
    { term: "Constant product", definition: "An x·y=k curve that constrains reserve changes; fees can make the product grow over time.", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
    { term: "Slippage", definition: "The gap between an expected quote and the executed result, usually shaped by trade size and pool depth.", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
    { term: "Liquidity provider", definition: "A participant who deposits assets into a pool, earns a share of fees, and carries inventory-composition risk.", relatedLesson: "pool-as-counterparty", relatedModuleId: "amm" },
    { term: "Arbitrage", definition: "Trading across markets with different prices so pool reserves move toward an external reference price.", relatedLesson: "arbitrage-and-impermanent-loss", relatedModuleId: "amm" },
    { term: "Price impact", definition: "The execution-price movement caused by a trade changing pool reserves; it is distinct from the fee charged.", relatedLesson: "price-impact-and-slippage", relatedModuleId: "amm" },
    { term: "Execution price", definition: "The average input divided by output for a swap, rather than the instantaneous spot price before the trade.", relatedLesson: "price-impact-and-slippage", relatedModuleId: "amm" },
    { term: "Impermanent loss", definition: "The difference between an LP's current inventory value and a hold-only benchmark, often realized when liquidity is withdrawn.", relatedLesson: "arbitrage-and-impermanent-loss", relatedModuleId: "amm" },
  ] },
  { title: "Tokens & supply", terms: [
    { term: "Total supply", definition: "All token units the system recognizes as existing, including units that are still locked.", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
    { term: "Circulating supply", definition: "Units currently available to transfer, trade, or use; it is normally no greater than total supply.", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
    { term: "Mint authority", definition: "An account or role allowed to invoke minting logic and write new units into total supply.", relatedLesson: "supply-and-authority", relatedModuleId: "token-launch" },
    { term: "Vesting", definition: "Tokens already allocated to a schedule but released into usable balance only after time and a claim action.", relatedLesson: "allocation-and-vesting", relatedModuleId: "token-launch" },
    { term: "Dilution", definition: "A reduction in a holder's relative share when total supply grows or other holders receive additional units.", relatedLesson: "dilution-and-distribution", relatedModuleId: "token-launch" },
    { term: "Supply overhang", definition: "Locked balance already counted in total supply that may enter circulation later and create future sell pressure.", relatedLesson: "allocation-and-vesting", relatedModuleId: "token-launch" },
    { term: "Burn", definition: "Removing units from a holder balance while reducing total supply, rather than sending them to a dead address.", relatedLesson: "dilution-and-distribution", relatedModuleId: "token-launch" },
    { term: "Multisig", definition: "A control scheme that requires a threshold of authorized signers before a privileged action executes.", relatedLesson: "permissions-and-governance", relatedModuleId: "token-launch" },
    { term: "Authority handoff", definition: "A state transition that moves a privileged role such as minting from one controller to another.", relatedLesson: "permissions-and-governance", relatedModuleId: "token-launch" },
  ] },
  { title: "Governance & treasury", terms: [
    { term: "Proposal", definition: "An encoded target, action, and parameter that can be voted on, queued, and executed as a state change.", relatedLesson: "proposal-as-state", relatedModuleId: "governance" },
    { term: "Voting snapshot", definition: "Balances and delegation captured when a proposal is created, preventing temporary changes from rewriting an active vote.", relatedLesson: "voting-power-and-delegation", relatedModuleId: "governance" },
    { term: "Delegation", definition: "Assigning representation to another member without creating tokens or allowing the same power to be counted twice.", relatedLesson: "voting-power-and-delegation", relatedModuleId: "governance" },
    { term: "Quorum", definition: "The minimum participation required for a proposal to continue; it is separate from whether support beats opposition.", relatedLesson: "voting-power-and-delegation", relatedModuleId: "governance" },
    { term: "Timelock", definition: "An observable delay between approval and execution that creates a review and cancellation window.", relatedLesson: "timelock-and-execution", relatedModuleId: "governance" },
    { term: "Treasury", definition: "Protocol-controlled assets that move only when an authorized governance action executes.", relatedLesson: "treasury-and-emergency", relatedModuleId: "governance" },
    { term: "Emergency cancellation", definition: "A safety path that blocks a queued operation before execution without erasing its vote history.", relatedLesson: "treasury-and-emergency", relatedModuleId: "governance" },
  ] },
  { title: "Lending & liquidation", terms: [
    { term: "Collateral value", definition: "The protocol's price-based estimate of deposited assets; it changes as the oracle input changes.", relatedLesson: "collateral-and-borrowing", relatedModuleId: "lending" },
    { term: "Loan-to-value (LTV)", definition: "Debt divided by collateral value, usually constrained below a maximum to leave a buffer for price movement and execution friction.", relatedLesson: "collateral-and-borrowing", relatedModuleId: "lending" },
    { term: "Health factor", definition: "A compressed risk reading of collateral, debt, and the liquidation threshold; below 1.00 often means liquidation is allowed.", relatedLesson: "interest-and-health", relatedModuleId: "lending" },
    { term: "Liquidation price", definition: "The collateral price at which the health factor reaches the liquidation boundary, not a forecast of where price must go.", relatedLesson: "price-shock-and-liquidation", relatedModuleId: "lending" },
    { term: "Liquidator", definition: "A participant who repays debt with their own assets after a risk boundary is crossed and receives collateral under protocol rules.", relatedLesson: "price-shock-and-liquidation", relatedModuleId: "lending" },
    { term: "Bad debt", definition: "Debt that remains after all available collateral cannot cover it; reserves, insurance, or socialized loss rules must absorb the gap.", relatedLesson: "oracle-and-bad-debt", relatedModuleId: "lending" },
  ] },
  { title: "Ledger & state", terms: [
    { term: "Signature", definition: "Cryptographic authorization over specific transaction fields; it does not prove balance or finality.", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
    { term: "Nonce", definition: "An account sequence number that orders transactions and blocks replay of the same authorization.", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
    { term: "State transition", definition: "The deterministic computation that turns old balances and nonces into a new state after a valid transaction.", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
    { term: "State root", definition: "A digest of account state that helps nodes verify they reached the same execution result.", relatedLesson: "transaction-and-state", relatedModuleId: "ledger" },
    { term: "Transaction pool", definition: "A set of broadcast transactions waiting for block execution; pending does not mean confirmed.", relatedLesson: "transaction-pool-and-replacement", relatedModuleId: "ledger" },
    { term: "Replacement transaction", definition: "A newly signed version using the same nonce to replace a pending transaction before execution.", relatedLesson: "transaction-pool-and-replacement", relatedModuleId: "ledger" },
    { term: "Block hash", definition: "A digest committing to the parent block, transaction fingerprints, and resulting state root.", relatedLesson: "block-order-and-state-root", relatedModuleId: "ledger" },
    { term: "Confirmations", definition: "Later blocks built on top of a block, providing a reorganization buffer rather than a universal finality guarantee.", relatedLesson: "finality-and-confirmations", relatedModuleId: "ledger" },
    { term: "Finality", definition: "A consensus guarantee that a state is safe for downstream applications to depend on.", relatedLesson: "finality-and-confirmations", relatedModuleId: "ledger" },
  ] },
  { title: "Oracles & settlement", terms: [
    { term: "Oracle", definition: "A mechanism that writes an outside-world fact into an on-chain system through sources, reports, and dispute rules.", relatedLesson: "report-challenge-finalize", relatedModuleId: "oracles" },
    { term: "Challenge window", definition: "A period in which participants can dispute an initial report, usually with a bond and arbitration process.", relatedLesson: "challenge-windows-and-bonds", relatedModuleId: "oracles" },
    { term: "Source quality", definition: "The consistency, timeliness, and verifiability of outside evidence; it changes risk without deciding the final outcome automatically.", relatedLesson: "source-quality-and-reporting", relatedModuleId: "oracles" },
    { term: "Reporter", definition: "A participant who turns outside evidence into a bonded, accountable onchain claim.", relatedLesson: "source-quality-and-reporting", relatedModuleId: "oracles" },
    { term: "Bond", definition: "Assets locked up to make a future claim costly to fake and to fund the consequence of being wrong.", relatedLesson: "challenge-windows-and-bonds", relatedModuleId: "oracles" },
    { term: "Finalization", definition: "The state transition that makes a reported outcome authoritative for downstream settlement.", relatedLesson: "settlement-handoff-and-failure", relatedModuleId: "oracles" },
    { term: "Settlement handoff", definition: "An explicit interface action that lets a downstream market read a finalized oracle result and begin settlement once.", relatedLesson: "settlement-handoff-and-failure", relatedModuleId: "oracles" },
  ] },
  { title: "Stablecoins & reserves", terms: [
    { term: "Stablecoin", definition: "A token designed to stay near a reference unit through collateral, redemption, arbitrage, reserves, or another explicit mechanism—not through its name.", relatedLesson: "peg-and-redemption", relatedModuleId: "stablecoins" },
    { term: "Target price", definition: "The reference value a protocol aims to track, such as one dollar; a target is a design goal, not proof that the market has honored it.", relatedLesson: "peg-and-redemption", relatedModuleId: "stablecoins" },
    { term: "Market price", definition: "The price produced by external trading; it can diverge from a target and is not rewritten by protocol wording.", relatedLesson: "depeg-and-arbitrage", relatedModuleId: "stablecoins" },
    { term: "Redemption", definition: "Burning stablecoin units to withdraw collateral under explicit rules; capacity depends on reserves, fees, price inputs, and limits.", relatedLesson: "peg-and-redemption", relatedModuleId: "stablecoins" },
    { term: "Overcollateralization", definition: "Issuing fewer stablecoin liabilities than the collateral value, leaving a buffer for price movement and execution friction.", relatedLesson: "collateral-and-minting", relatedModuleId: "stablecoins" },
    { term: "Depeg", definition: "A sustained divergence between a stablecoin's market price and its target; arbitrage creates incentives without guaranteeing liquidity or reserves.", relatedLesson: "depeg-and-arbitrage", relatedModuleId: "stablecoins" },
    { term: "Reserve coverage", definition: "The amount of redeemable reserves relative to outstanding stablecoin supply; a loss does not automatically erase liabilities.", relatedLesson: "reserves-and-run-risk", relatedModuleId: "stablecoins" },
    { term: "Run", definition: "Many holders attempting to exit around the same time, turning reserves, liquidity, and redemption order into a system boundary.", relatedLesson: "reserves-and-run-risk", relatedModuleId: "stablecoins" },
  ] },
  { title: "Ordering & MEV", terms: [
    { term: "MEV", definition: "Value redistributed because someone can see intent, control transaction ordering, or compose execution differently; it is not automatically synonymous with an illegal attack.", relatedLesson: "mempool-and-ordering", relatedModuleId: "mev" },
    { term: "Public mempool", definition: "A shared observation surface for pending transaction intent before execution; visibility gives searchers time to prepare competing orders.", relatedLesson: "mempool-and-ordering", relatedModuleId: "mev" },
    { term: "Sandwich attack", definition: "A searcher trades before and after a user's swap to try to capture part of the price movement caused by that swap.", relatedLesson: "sandwich-and-slippage", relatedModuleId: "mev" },
    { term: "Minimum output", definition: "The least output a swapper will accept; if execution falls below it, the transaction reverts instead of silently accepting worse terms.", relatedLesson: "sandwich-and-slippage", relatedModuleId: "mev" },
    { term: "Back-run", definition: "A trade placed after a user's transaction changes the pool state, attempting to take the other side of the new price; profit still has to appear on the ledger.", relatedLesson: "backrun-and-arbitrage", relatedModuleId: "mev" },
    { term: "Private order flow", definition: "A path that keeps transaction intent out of the public mempool, reducing one visibility route without removing builder or proposer trust boundaries.", relatedLesson: "builders-and-private-orderflow", relatedModuleId: "mev" },
  ] },
];

export const englishGlossaryEntries = englishGlossaryGroups.flatMap((group) => group.terms.map((term) => ({ ...term, group: group.title })));
