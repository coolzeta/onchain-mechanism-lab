export interface LocalizedCuriosityCopy {
  zh: string;
  en: string;
}

export interface CuriosityPrompt {
  id: string;
  question: LocalizedCuriosityCopy;
  answer: LocalizedCuriosityCopy;
}

const prompt = (id: string, zhQuestion: string, zhAnswer: string, enQuestion: string, enAnswer: string): CuriosityPrompt => ({
  id,
  question: { zh: zhQuestion, en: enQuestion },
  answer: { zh: zhAnswer, en: enAnswer },
});

/**
 * Curiosity is a content layer, not simulator state. Each lesson owns at least
 * one falsifiable question that can be answered by its existing experiment.
 */
export const lessonCuriosities: Record<string, readonly CuriosityPrompt[]> = {
  "prediction-markets:a-question-that-can-settle": [
    prompt("prediction-headline-contract", "新闻标题已经很清楚了，为什么还不能直接拿来下注？", "交易的是一份可执行合同，不是一句大家‘大概懂了’的话。截止时间、判定事件和结果来源少一个，输家就可能在结算时重新解释问题。", "If a headline is clear, why can’t we trade it as-is?", "A market trades an executable contract, not a sentence people roughly understand. Without a deadline, observable event, and named source, the losing side can reinterpret the question at settlement."),
    prompt("prediction-deadline-surprise", "事件提前发生了，市场能不能立刻结算？", "不一定。合同可能要求等到截止时间，确认事件没有被撤销、修正或落入无效条件。‘我们已经知道答案’和‘合同允许结算’是两个状态。", "If the event happens early, can the market settle immediately?", "Not necessarily. The contract may require waiting for the deadline to rule out reversals, corrections, or invalid conditions. Knowing the likely answer and being allowed to settle are different states."),
    prompt("prediction-rule-upgrade", "交易开始后发现来源不够权威，换成更好的来源不行吗？", "换来源等于改写资产的兑付条件。即使新来源更权威，也会把已经按旧规则定价的 YES/NO 变成另一份合同；真正的问题是修改权属于谁、能否退出，以及变更是否在交易前就被允许。", "Why not replace a weak resolution source after trading starts?", "Changing the source rewrites the payout condition. Even a better source turns positions priced under the old rules into a different contract; the key questions are who can change it, whether holders can exit, and whether that power was disclosed before trading."),
  ],
  "prediction-markets:one-dollar-two-futures": [
    prompt("prediction-two-tokens", "为什么锁进 100 积分，会同时造出一份 YES 和一份 NO？", "它们不是凭空多出的两份钱，而是一张 100 积分领取权被拆成两个互斥钥匙。最终只有一把钥匙能打开抵押池；把两份重新合并，也只能取回 100。", "Why does locking 100 credits create both YES and NO?", "They are not two new piles of money. One 100-credit claim is split into two mutually exclusive keys. Only one key opens the collateral at settlement, and merging both returns only 100."),
    prompt("prediction-complete-set-value", "结果还没发生，YES＋NO 为什么已经值 100？", "因为完整份额不需要猜结果：无论未来是哪一边获胜，它都覆盖那把获胜钥匙。前提是合约允许合并、抵押足额，而且不存在无效市场或结算故障。", "Why is YES + NO worth 100 before the outcome is known?", "A complete set does not need to predict the winner: it always contains the winning key. That depends on mergeability, full collateral, and no invalid-market or settlement failure."),
    prompt("prediction-who-funds-winner", "我花 70 买 YES，最后却拿到 100，多出来的 30 是谁付的？", "不是协议临时补贴。成交或拆分完整份额时，YES 和互补的 NO 共同对应一份已经锁好的 100 抵押；YES 获胜后拿走整份，是因为 NO 的领取权同时归零。", "I pay 70 for YES and later receive 100. Who funds the extra 30?", "It is not a last-minute subsidy. When a complete set is split or matched, YES and complementary NO point to collateral already locked at 100; if YES wins, it takes the full claim while NO becomes worth zero."),
  ],
  "prediction-markets:beliefs-enter-the-book": [
    prompt("prediction-belief-limit", "Alice 认为有 80% 概率，为什么不一定愿意在 80 买？", "80 是她的估值，不是必须支付的价格。她还要给判断错误、资金占用和模型不确定性留出余地，所以可能只愿在 68 买，并且只买有限数量。", "If Alice believes 80%, why might she refuse to buy at 80?", "Eighty is her valuation, not a required payment. She may demand room for model error, capital lockup, and uncertainty, so she might bid only 68 and limit the size."),
    prompt("prediction-opinion-no-order", "一千个人都点了 YES，为什么市场价格可能完全不动？", "观点不会自动进入订单簿。只有愿意锁定资金、写出价格和数量的订单才改变可成交条件；点赞、投票和口头预测都不产生对手方。", "Why can a thousand YES votes leave the market price unchanged?", "Opinions do not enter the book automatically. Only funded orders with a price and quantity change executable conditions; votes and forecasts create no counterparty."),
    prompt("prediction-wrong-but-profit", "最后结果是 NO，买过 YES 的人为什么仍可能赚到钱？", "如果他在结算前以 40 买入、又在市场升到 60 时卖出，就已经实现了 20 的交易利润。预测市场头寸既可以持有到结算，也可以在信息变化时转手；交易赚钱不等于最终判断正确。", "The event resolves NO. How could someone who bought YES still profit?", "They may have bought at 40 and sold at 60 before resolution, realizing a 20-point trading gain. A position can be held to settlement or transferred as information changes; profitable trading is not the same as a correct final forecast."),
  ],
  "prediction-markets:how-matching-makes-a-price": [
    prompt("prediction-resting-price", "买方愿付 72、卖方只要 68，为什么成交价通常是 68？", "很多订单簿采用静止订单价格：先挂出的 68 卖单已经向市场承诺条件，后来进入的 72 买单只是接受它。这样既奖励等待的流动性，也让撮合结果可重放。", "A buyer accepts 72 and a seller accepts 68. Why can the trade print at 68?", "Many books execute at the resting order’s price. The earlier 68 ask already promised terms; the incoming 72 bid accepts them. This rewards posted liquidity and makes matching replayable."),
    prompt("prediction-last-price", "只成交一份，为什么整个市场都显示了一个新价格？", "最近成交价记录的是最后一次边际相遇，不是所有持仓被重新买卖。界面会用它重估市场，但你必须再看成交量、价差和深度，判断这个价格有多可靠。", "Why can one tiny fill change the displayed price for the whole market?", "The last price records the latest marginal meeting, not a resale of every position. Interfaces revalue the market from it, so size, spread, and depth are needed to judge reliability."),
  ],
  "prediction-markets:price-is-not-truth": [
    prompt("prediction-sum-over-100", "YES 62＋NO 45＝107：市场的概率为什么会超过 100%？", "先检查你加的是不是同一时刻、同一数量可成交的价格。两个最近成交价或两个卖一价可以超过 100；前者不同步，后者包含两次买入价差，都不等于一组可执行概率。", "YES 62 + NO 45 = 107. How can market probability exceed 100%?", "First check whether both numbers are simultaneous executable quotes for the same size. Two last trades or two asks can exceed 100: the former are asynchronous and the latter include paying two spreads, so neither is one probability distribution."),
    prompt("prediction-sum-under-100", "YES 和 NO 的可买价加起来小于 100，为什么可能套利？", "若能同时各买一份、手续费小于价差，而且完整份额保证最终兑付 100，那么你花不到 100 就买齐了所有未来。无论谁赢都拿回 100，毛利是 100 减去总成本。", "Why can executable YES and NO asks below 100 create arbitrage?", "If both can be bought simultaneously, fees are smaller than the gap, and a complete set reliably pays 100, you buy every future for less than 100. Gross edge is 100 minus total cost."),
    prompt("prediction-sell-over-100", "超过 100 就一定能反向套利吗？", "只有当 62 和 45 是你真的能卖出的买一价，并且你能用 100 抵押拆出 YES＋NO 时才成立：拆一套、两边卖出 107，毛利 7。若它们是买入价，买齐反而锁定亏损。", "Does a sum above 100 always create reverse arbitrage?", "Only if both are bids you can actually sell into and you can split 100 collateral into YES + NO: sell the pair for 107 and keep a gross 7. If the numbers are asks, buying both locks in a loss instead."),
    prompt("prediction-cross-venue-gap", "同一个事件，两个平台一个 64、一个 72，为什么价差可以一直存在？", "两边可能使用不同结算来源、截止时间、费用、参与限制和抵押资产。即使合同完全相同，跨平台搬运资金和同时成交也有延迟与失败风险；屏幕上的八点差不自动等于可锁定利润。", "The same event trades at 64 on one venue and 72 on another. Why can the gap persist?", "The venues may differ in sources, deadlines, fees, access, and collateral. Even identical contracts involve funding transfers and leg risk, so an eight-point screen gap is not automatically locked profit."),
    prompt("prediction-arbitrage-waits", "套利机会已经出现，价格为什么不会瞬间回到合理位置？", "套利者也受资金、盘口深度、Gas、授权和两条腿成交速度约束。第一份可能能赚 7，第一百份却会吃穿盘口；若第二条腿失败，所谓无风险交易立刻变成方向性头寸。", "If arbitrage appears, why doesn’t price snap back instantly?", "Arbitrageurs face capital, depth, gas, approvals, and execution latency. The first unit may earn seven while the hundredth walks through the book; if the second leg fails, a supposedly riskless trade becomes directional exposure."),
  ],
  "prediction-markets:oracle-and-resolution": [
    prompt("prediction-market-vs-oracle", "市场有 99% 的人买 YES，预言机还能报告 NO 吗？", "能。市场负责发现价格，预言机负责把合同指定的现实结果带回来。交易者再自信也不能投票决定事实；若预言机最终错误，市场会按照错误结果合法赔付。", "If 99% of the market buys YES, can the oracle still report NO?", "Yes. The market discovers prices; the oracle imports the contract’s real-world result. Confidence cannot vote reality into existence, and a finalized oracle error can produce a procedurally valid but wrong payout."),
    prompt("prediction-wrong-settlement", "错误结算后，再把预言机改正确不就行了吗？", "赔付可能已经被领取、资产已经转走，状态机也禁止重复结算。可靠系统更依赖结算前的挑战窗口、暂停和明确最终性，而不是事后随意改历史。", "Why not just fix the oracle after a wrong settlement?", "Payouts may already be claimed and assets moved, while the state machine blocks double settlement. Robust systems rely on challenge windows, pauses, and explicit finality before payout—not casual history edits afterward."),
  ],

  "amm:pool-as-counterparty": [
    prompt("amm-infinite-counterparty", "池子没有挂单人，为什么还能一直和我交易？", "LP 预先放入两种资产，曲线把库存变成连续报价。它不是无限流动性：你买得越多，池中目标资产越少，下一单位就越贵。", "With no posted seller, why can a pool keep trading with me?", "LPs pre-deposit both assets and a curve turns inventory into continuous quotes. Liquidity is not infinite: as you remove one asset, each next unit becomes more expensive."),
  ],
  "amm:price-impact-and-slippage": [
    prompt("amm-zero-fee-impact", "如果手续费降到 0，大额交易就不会滑点了吗？", "仍然会。手续费是额外扣除，价格冲击来自你沿曲线改变了储备比例。只要池子深度有限，大单的平均执行价就会偏离交易前现货价。", "If fees fall to zero, does a large trade stop slipping?", "No. Fees are an extra deduction; price impact comes from moving the reserve ratio along the curve. With finite depth, a large order still gets an average price away from the pre-trade spot."),
  ],
  "amm:lp-inventory-and-fees": [
    prompt("amm-lp-guarantee", "LP 每笔都收手续费，为什么最后还可能比单纯持币更少？", "交易会持续改变 LP 持有的两种资产比例。手续费在增加池值，但价格变化时，池子往往自动卖出上涨资产、买入下跌资产；必须和‘不提供流动性’的反事实比较。", "LPs earn every trade fee. How can they still underperform holding?", "Trades continuously change the LP’s asset mix. Fees add value, but the pool tends to sell the rising asset and buy the falling one; performance must be compared with the counterfactual of simply holding."),
  ],
  "amm:arbitrage-and-impermanent-loss": [
    prompt("amm-arbitrage-payer", "套利者赚的钱究竟是谁付的？", "不是协议发奖金。池内旧价格与外部价格不一致时，套利者用交易搬动库存；价差最终体现在交易者获得的价格、LP 的库存重平衡和套利者利润之间。", "Who actually pays an AMM arbitrageur’s profit?", "The protocol does not mint a reward. When pool and external prices diverge, arbitrage trades move inventory; the gap is distributed through trader execution, LP rebalancing, and arbitrage profit."),
  ],

  "governance:proposal-as-state": [
    prompt("governance-yes-no-change", "提案 99% 赞成，为什么协议仍然可能完全不变？", "它可能没达到法定人数、还没排队、时间锁未结束，或执行调用失败。投票结果只是状态机中的一次授权，不是目标合约已经改变的证明。", "A proposal gets 99% YES. Why might the protocol remain unchanged?", "It may miss quorum, remain unqueued, still be timelocked, or fail during execution. A vote is one authorization state—not proof that the target contract changed."),
  ],
  "governance:voting-power-and-delegation": [
    prompt("governance-flash-vote", "投票开始后借来一大笔代币，能立刻取得控制权吗？", "设计良好的治理通常读取提案开始前的投票权快照，后来借入的代币不会改变这次票数。但快照时间、委托和借贷市场仍可能形成别的攻击面。", "Can borrowed tokens seize a vote after it starts?", "Well-designed governance usually reads voting power from a snapshot before the proposal begins, so later borrowing does not change that vote. Snapshot timing, delegation, and lending can still create other attack surfaces."),
  ],
  "governance:timelock-and-execution": [
    prompt("governance-timelock-safety", "有两天时间锁，就能保证恶意提案伤不到协议吗？", "时间锁只把危险公开两天，不会自动识别危险。安全仍依赖监控者发现问题、取消者有合适权限，以及用户真的来得及退出。", "Does a two-day timelock guarantee a malicious proposal cannot hurt the protocol?", "A timelock exposes danger for two days; it does not identify danger. Safety still depends on monitoring, appropriately scoped cancellation power, and users having a real chance to exit."),
  ],
  "governance:treasury-and-emergency": [
    prompt("governance-emergency-power", "紧急多签能救协议，为什么它本身也是风险？", "同一把紧急钥匙既能暂停攻击，也可能审查用户或转走资产。关键不是有没有管理员，而是权限范围、签名门槛、时间限制和每次动作是否可审计。", "An emergency multisig can save a protocol. Why is it also a risk?", "The same key that pauses an attack may censor users or move assets. The real questions are scope, threshold, expiry, and whether every action is auditable."),
  ],

  "ledger:transaction-and-state": [
    prompt("ledger-valid-signature-fail", "签名完全正确，交易为什么还是可能失败？", "签名只证明某个地址授权了这段内容。Nonce、余额、Gas、合约条件和当前状态仍要在执行时验证；授权有效不代表状态转换有效。", "Why can a perfectly valid signature still produce a failed transaction?", "A signature only proves an address authorized these bytes. Nonce, balance, gas, contract conditions, and current state are checked during execution; valid authorization is not a valid state transition."),
  ],
  "ledger:transaction-pool-and-replacement": [
    prompt("ledger-replacement-double-pay", "钱包显示两笔相同 Nonce 的 Pending，会不会真的支付两次？", "同一账户同一 Nonce 最终只能按顺序执行一次。节点可能暂时看到多个候选，但一笔被纳入状态后，其他同 Nonce 交易就失效。", "Two pending transactions share a nonce. Can both pay?", "A single account nonce can execute only once in sequence. Nodes may temporarily see multiple candidates, but once one enters state, the others with that nonce become invalid."),
  ],
  "ledger:block-order-and-state-root": [
    prompt("ledger-same-txs-different-state", "完全相同的一组交易，只换顺序，余额为什么会不同？", "交易读取并修改前一笔留下的状态。先花钱还是先收钱、先批准还是先调用，都会改变后续交易能否成功，因此共识必须同时确定内容和顺序。", "How can the same transaction set produce different balances when reordered?", "Each transaction reads and changes the state left by earlier ones. Spending before receiving or calling before approval changes later validity, so consensus must fix both contents and order."),
  ],
  "ledger:finality-and-confirmations": [
    prompt("ledger-many-confirmations", "确认数已经很多，为什么还要区分最终性？", "确认数通常表示重组越来越困难；最终性表示协议已经给出不可轻易撤回的承诺。两者的安全假设不同，应用等待的也不只是一个区块计数。", "Why distinguish finality after many confirmations?", "Confirmations usually mean a reorganization is becoming harder; finality is a protocol commitment that is not easily revoked. Their assumptions differ, so applications wait for more than a block counter."),
  ],

  "lending:collateral-and-borrowing": [
    prompt("lending-overcollateral-bad-debt", "明明是超额抵押，为什么协议仍可能出现坏账？", "超额只是一个时点的缓冲。价格跳跌、流动性不足、预言机延迟或清算拥堵，都可能让抵押价值在资产卖出前跌到债务以下。", "How can an overcollateralized loan still create bad debt?", "Overcollateralization is a buffer at one moment. Price gaps, thin liquidity, oracle delay, or liquidation congestion can push collateral below debt before it is sold."),
  ],
  "lending:interest-and-health": [
    prompt("lending-do-nothing-liquidation", "价格完全没变，什么都不做也会被清算吗？", "可能。利息让债务分母持续变大，健康度会缓慢下降。接近边界的仓位即使抵押价格横盘，也可能被时间推过清算线。", "Can a loan be liquidated while price stays flat and the user does nothing?", "Yes. Interest grows the debt denominator and slowly lowers health. A position near the boundary can cross the liquidation line through time alone."),
  ],
  "lending:price-shock-and-liquidation": [
    prompt("lending-liquidator-help", "清算人抢走抵押品，为什么协议还要奖励他？", "清算人替借款人偿还债务，把即将不足的抵押转换成可兑现资产。奖励补偿 Gas、价格波动和卖出风险；没有人愿意清算时，坏账会留给整个协议。", "Why reward a liquidator who takes someone’s collateral?", "The liquidator repays debt and converts risky collateral into realizable assets. The bonus pays for gas, volatility, and exit risk; without willing liquidators, bad debt remains with the protocol."),
  ],
  "lending:oracle-and-bad-debt": [
    prompt("lending-cheap-market-safe-oracle", "市场已经暴跌，但预言机没更新，账户为什么看起来还很安全？", "合约只能读取链上已写入的价格，不能自动看见交易所屏幕。旧价格会暂时高估抵押，直到更新时风险集中暴露。", "The market crashed, but the oracle has not updated. Why does the account still look safe?", "The contract reads the recorded onchain price, not an exchange screen. A stale value temporarily overstates collateral until the update reveals accumulated risk."),
  ],

  "matching-engine:priority-and-partial-fills": [
    prompt("engine-first-click", "我最先下单，为什么别人还是先成交？", "时间优先只在同一价格档位内生效。别人若给出更好的价格，会先越过你；即使同价，大单也可能先只成交一部分，剩余继续排队。", "I submitted first. Why can someone else fill first?", "Time priority applies only within one price level. A better-priced order jumps ahead, and a large order may fill only partially while the remainder keeps its place."),
  ],
  "matching-engine:market-orders-and-depth": [
    prompt("engine-market-no-price", "市价单没有写价格，难道是在说‘多少钱都买’？", "从风险角度几乎是。真实系统常把它实现为带保护上限的 IOC：立即吃掉允许范围内的档位，剩余取消，避免空盘口或极端价格无限吞噬资金。", "Does a market order really mean ‘buy at any price’?", "From a risk perspective, nearly. Real systems often implement it as a protected IOC: consume allowed levels immediately and cancel the rest before an empty or extreme book consumes unlimited funds."),
  ],
  "matching-engine:spread-and-liquidity": [
    prompt("engine-tight-shallow", "买卖价差只有 1，为什么大单仍然可能很贵？", "价差只描述最前面一小档。若卖一只有 1 份，后面价格迅速抬高，大单会跨档成交；交易成本取决于整条深度，不只看门口。", "The spread is only 1. Why can a large order still be expensive?", "The spread describes only the first tiny level. If the best ask has one unit and higher levels rise quickly, a large order walks the book; cost depends on the depth behind the doorway."),
  ],
  "matching-engine:risk-controls-and-replacement": [
    prompt("engine-replace-queue", "只是把价格改好一点，为什么订单要重新排队？", "改价会改变你向市场承诺的条件，相当于一张新订单。若保留旧时间优先级，交易者可以用反复修改占住队首，对后来者不公平。", "Why lose queue priority when improving an order’s price?", "Changing price changes the promise to the market and creates a new order. Keeping the old timestamp would let traders repeatedly edit while camping at the front of the queue."),
  ],

  "mev:mempool-and-ordering": [
    prompt("mev-visible-intent", "交易还没上链，别人为什么已经能利用它？", "公开交易池传播的是待执行意图。搜索者能先模拟这笔交易会怎样改变状态，再提交围绕它的交易，并竞争把这些交易排进同一区块。", "How can others use a transaction before it is onchain?", "The public mempool broadcasts pending intent. Searchers simulate how it will change state, submit surrounding transactions, and compete to place them in the same block."),
  ],
  "mev:sandwich-and-slippage": [
    prompt("mev-successful-harm", "用户交易明明成功了，为什么仍可能被夹子伤害？", "成功只表示没有触发回滚，不表示成交公平。攻击者先改变池价，用户在仍可接受的最差价格成交，再由攻击者反向交易；损失藏在更差输出里。", "If the user transaction succeeds, how can a sandwich still harm it?", "Success only means no revert, not fair execution. The attacker moves the pool first, the user fills near the allowed worst price, and the attacker reverses; the loss is hidden in poorer output."),
  ],
  "mev:backrun-and-arbitrage": [
    prompt("mev-helpful-extraction", "回跑套利把价格修好了，为什么还会被说成价值提取？", "它既可能改善后续价格，也把用户交易制造的短暂价差收入分给搜索者和提议者。‘系统有用’与‘收益分配公平’是两个问题。", "A backrun repairs price. Why call it value extraction?", "It can improve the next price while allocating the temporary gap created by the user to searchers and proposers. System usefulness and fair distribution are separate questions."),
  ],
  "mev:builders-and-private-orderflow": [
    prompt("mev-private-trust", "交易不进公开池，就自动没有 MEV 了吗？", "它减少公开搜索者观察意图的机会，却把排序、审查和是否回退的权力交给私有构建者或中继。MEV 没有消失，只是信任边界换了位置。", "Does keeping an order out of the public mempool eliminate MEV?", "It reduces observation by public searchers but hands ordering, censorship, and fallback power to private builders or relays. MEV does not disappear; the trust boundary moves."),
  ],

  "oracles:report-challenge-finalize": [
    prompt("oracle-honest-wrong", "报告者很诚实，预言机为什么仍可能错？", "诚实只说明他没有故意撒谎。他可能读取错误来源、误解规则或遇到数据中断；预言机需要的是可纠错流程，而不是假设某个人永不犯错。", "Why can an honest oracle reporter still be wrong?", "Honesty means no deliberate lie, not perfect information. A reporter can read a bad source, misread rules, or face an outage; the oracle needs a correction process, not an infallible person."),
  ],
  "oracles:source-quality-and-reporting": [
    prompt("oracle-many-same-source", "接入十个 API，为什么不一定比一个更去中心化？", "十个 API 可能都转售同一个上游数据，故障和偏差仍然高度相关。真正的来源多样性要看数据从哪里产生，而不是只数接口数量。", "Why aren’t ten APIs necessarily more decentralized than one?", "Ten APIs may resell the same upstream feed, leaving failures highly correlated. Source diversity is about where observations originate, not the number of endpoints."),
  ],
  "oracles:challenge-windows-and-bonds": [
    prompt("oracle-bond-too-large", "担保越大越安全吗？", "太小不足以阻止撒谎，太大又会让诚实但资金较少的挑战者无法纠错。好的担保要覆盖攻击收益，同时保留真实争议能够进入流程的可能。", "Is a larger oracle bond always safer?", "Too small fails to deter lies; too large prevents honest but less-capitalized challengers from correcting errors. A good bond covers attack profit while keeping real disputes accessible."),
  ],
  "oracles:settlement-handoff-and-failure": [
    prompt("oracle-final-wrong", "状态写着 FINAL，为什么还不能理解成‘绝对真实’？", "FINAL 表示协议内的争议流程已经结束，不是宇宙给出的真理证明。无人挑战的错误也可能合法最终化，下游必须知道自己依赖了什么来源和假设。", "Why doesn’t FINAL mean absolutely true?", "FINAL means the protocol’s dispute process ended, not that reality issued a proof. An unchallenged error can finalize legally, so downstream systems must know the source and assumptions they depend on."),
  ],

  "stablecoins:peg-and-redemption": [
    prompt("stablecoin-peg-verb", "稳定币价格显示 1 美元，就代表锚定机制健康吗？", "一个短暂成交价可能正好是 1，但若没人能按规则赎回、储备不可用，锚就没有恢复力。锚定更像一条可执行的退出路径，而不是屏幕上的静态数字。", "If a stablecoin trades at $1, is its peg mechanism healthy?", "A temporary print can equal $1 while redemption is broken or reserves are unusable. A peg is better understood as an executable exit path, not a static number on screen."),
  ],
  "stablecoins:collateral-and-minting": [
    prompt("stablecoin-150-not-safe", "150% 抵押听起来很多，为什么仍可能不够？", "抵押价格可能跳跌，卖出时还会产生滑点和清算成本。150% 是在特定波动、流动性和预言机假设下的缓冲，不是永远安全的常数。", "Why can 150% collateral still be insufficient?", "Collateral can gap down, and selling incurs slippage and liquidation cost. One hundred fifty percent is a buffer under volatility, liquidity, and oracle assumptions—not a permanent guarantee."),
  ],
  "stablecoins:depeg-and-arbitrage": [
    prompt("stablecoin-cheap-no-arb", "稳定币跌到 0.90，为什么套利者不一定把它立刻买回 1？", "只有能以接近 1 的价值赎回、路径没暂停、费用和时间风险足够低时，买入才有确定出口。没有可信赎回，0.90 可能是风险价格而不是免费十美分。", "A stablecoin falls to $0.90. Why might arbitrage not restore $1 immediately?", "Buying has a reliable exit only if redemption near $1 works, is not paused, and fees and delay risk are small. Without credible redemption, $0.90 may price risk rather than offer a free ten cents."),
  ],
  "stablecoins:reserves-and-run-risk": [
    prompt("stablecoin-first-exit", "储备不足时，为什么越早赎回的人越占便宜？", "若系统仍按 1 美元先到先得地支付，前面的用户拿走完整价值，亏空留给剩余持有人。这种顺序优势会反过来刺激所有人更早挤兑。", "Why do early redeemers benefit when reserves are short?", "If the system pays $1 first-come-first-served, early users take full value and leave the shortfall to remaining holders. That ordering advantage encourages everyone to run sooner."),
  ],

  "token-launch:supply-and-authority": [
    prompt("token-supply-not-sellable", "总供应十亿，为什么市场上可能只有一千万真的能卖？", "总供应还包括锁仓、金库和尚未分发的余额。价格能立即遇到的是流通与盘口深度；把总供应当成可出售数量，会高估眼前供给。", "Total supply is one billion. Why might only ten million be sellable?", "Total supply includes vesting contracts, treasuries, and undistributed balances. Price meets circulating inventory and order-book depth, so total supply can overstate immediate supply."),
  ],
  "token-launch:allocation-and-vesting": [
    prompt("token-unlocked-not-market", "代币已经解锁，为什么还不算真正进入市场？", "解锁只是获得领取资格。持有人还要领取、转账或卖出，余额分布和市场供给才改变；‘可领取’和‘已流通’是两个状态。", "Tokens unlocked. Why aren’t they necessarily in the market?", "Unlocking only grants claimability. Distribution and market supply change after claiming, transferring, or selling; claimable and circulating are different states."),
  ],
  "token-launch:dilution-and-distribution": [
    prompt("token-same-balance-diluted", "我的余额一枚没少，为什么还是被稀释了？", "增发提高了总供应，你持有的网络比例下降。稀释改变的是相对权利和未来收益份额，不要求钱包里的绝对数字减少。", "My token balance did not fall. How was I diluted?", "New issuance raises total supply and lowers your share of the network. Dilution changes relative rights and future claims without reducing the absolute wallet number."),
  ],
  "token-launch:permissions-and-governance": [
    prompt("token-renounce-safe", "项目方宣布放弃所有权，就代表再也没人能改供应吗？", "不一定。增发者、代理升级、暂停者和多签可能是独立权限。判断安全要枚举每条能改变状态的调用路径，而不是只看一个 owner 标签。", "Does renouncing ownership prove nobody can change supply?", "Not necessarily. Mint roles, proxy upgrades, pausers, and multisigs may be separate powers. Security requires enumerating every state-changing path, not reading one owner label."),
  ],
};

const moduleTeaserPromptIds: Record<string, readonly string[]> = {
  "prediction-markets": ["prediction-sum-over-100", "prediction-sum-under-100"],
  amm: ["amm-infinite-counterparty", "amm-lp-guarantee"],
  governance: ["governance-yes-no-change", "governance-timelock-safety"],
  ledger: ["ledger-valid-signature-fail", "ledger-same-txs-different-state"],
  lending: ["lending-overcollateral-bad-debt", "lending-do-nothing-liquidation"],
  "matching-engine": ["engine-market-no-price", "engine-tight-shallow"],
  mev: ["mev-visible-intent", "mev-helpful-extraction"],
  oracles: ["oracle-honest-wrong", "oracle-many-same-source"],
  stablecoins: ["stablecoin-peg-verb", "stablecoin-cheap-no-arb"],
  "token-launch": ["token-supply-not-sellable", "token-same-balance-diluted"],
};

function localize(promptItem: CuriosityPrompt, locale: string) {
  const language = locale === "en" ? "en" : "zh";
  return { id: promptItem.id, question: promptItem.question[language], answer: promptItem.answer[language] };
}

export function getLessonCuriosities(moduleId: string, lessonId: string, locale: string) {
  return (lessonCuriosities[`${moduleId}:${lessonId}`] ?? []).map((item) => localize(item, locale));
}

export function getModuleCuriosityTeasers(moduleId: string, locale: string) {
  const ids = new Set(moduleTeaserPromptIds[moduleId] ?? []);
  return Object.values(lessonCuriosities).flat().filter((item) => ids.has(item.id)).map((item) => localize(item, locale));
}

export function getModuleTeaserIds(moduleId: string) {
  return moduleTeaserPromptIds[moduleId] ?? [];
}
