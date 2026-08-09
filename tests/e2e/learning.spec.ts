import { expect, test } from "@playwright/test";

test("offers a multi-page learning path and remembers progress", async ({ page }) => {
  await page.goto("/zh/");
  await expect(page.getByRole("heading", { name: /把链上世界/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "网站里所有东西，只服务于这一条学习主线。" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主导航" }).locator("a")).toHaveCount(3);
  const tools = page.locator("summary", { hasText: "学习工具" });
  await tools.click();
  await expect(page.getByText("学完多个机制后，查看它们如何交接价值与风险。")).toBeVisible();
  await tools.click();
  await page.getByRole("link", { name: "找到我的学习起点 →" }).first().click();
  await expect(page.getByRole("heading", { name: /先选一个真正关心的问题/ })).toBeVisible();
  await page.getByRole("link", { name: "继续：预测市场 →" }).click();
  await expect(page.getByRole("heading", { name: "预测市场：观点如何变成价格" })).toBeVisible();
  await expect(page.getByText("新闻标题已经很清楚了，为什么还不能直接拿来下注？", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "先写一个能结算的问题" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "实验任务" })).toBeVisible();
  await expect(page.getByRole("button", { name: "带我去下方实验 ↓" })).toBeVisible();
  await page.getByRole("button", { name: "版本 3" }).click();
  await expect(page.getByText("3/3 条件明确")).toBeVisible();
  await expect(page.getByRole("button", { name: "已自动记录实验操作 ✓" })).toBeDisabled();
  await page.getByRole("button", { name: /截至 2028-12-31/ }).click();
  await expect(page.getByText(/答对了/)).toBeVisible();
  await page.getByRole("button", { name: "保存本章" }).click();
  await expect(page.getByRole("link", { name: /进入下一章/ })).toBeVisible();
  await page.reload();
  await expect(page.locator(".lesson-sidebar").getByText("✓")).toBeVisible();
});

test("turns curiosity hooks into an executable complement-price experiment", async ({ page }) => {
  await page.goto("/zh/");
  const predictionCard = page.getByRole("link", { name: /预测市场.*为什么会超过 100%/ });
  await expect(predictionCard).toBeVisible();
  await expect(predictionCard).toContainText("为什么可能套利");

  await page.goto("/zh/learn/prediction-markets/price-is-not-truth/");
  const curiosities = page.getByRole("region", { name: "你可能已经在想的问题" });
  await expect(curiosities.getByText(/为什么会超过 100%/)).toBeVisible();
  await curiosities.getByText(/为什么会超过 100%/).click();
  await expect(curiosities.getByText(/两个最近成交价或两个卖一价可以超过 100/)).toBeVisible();

  const lab = page.getByRole("region", { name: "互补价格与套利实验" });
  await expect(lab).toBeVisible();
  await expect(lab.getByText("先选一个动作，再看资金怎样闭环")).toBeVisible();
  await lab.getByRole("button", { name: "同时买入 YES＋NO" }).click();
  await expect(lab.getByText("不到 100，就买齐了所有未来")).toBeVisible();
  await lab.getByRole("button", { name: "可买价合计 107" }).click();
  await lab.getByRole("button", { name: "暂时不交易" }).click();
  await expect(lab.getByText("买齐两边，反而锁定亏损")).toBeVisible();
  await lab.getByRole("button", { name: "可卖价合计 107" }).click();
  await lab.getByRole("button", { name: "抵押 100 拆一套，再同时卖出" }).click();
  await expect(lab.getByText("拆出一套，再把两边同时卖掉")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("lets a learner place and cancel an order in the lab", async ({ page }) => {
  await page.goto("/zh/labs/prediction-markets/");
  await expect(page.getByRole("heading", { name: "预测市场自由实验室" })).toBeVisible();
  await page.getByRole("slider", { name: "Alice 主观判断" }).fill("84");
  await expect(page.getByText("先调信念，再看订单")).toBeVisible();
  await page.getByRole("button", { name: "低流动性" }).click();
  await page.getByRole("button", { name: "提交限价订单" }).click();
  await expect(page.getByText(/你 提交/)).toBeVisible();
  await expect(page.getByRole("region", { name: "实验时间轴" })).toBeVisible();
  await page.getByRole("button", { name: "记录这次实验" }).click();
  await expect(page.getByText("已保存到研究记录", { exact: true })).toBeVisible();
  await page.getByRole("slider", { name: "实验回退步骤" }).fill("0");
  await expect(page.getByText("1 个状态快照")).toBeVisible();
  await expect(page.getByText(/你 提交/)).toHaveCount(0);
  await page.getByRole("link", { name: "查看研究记录 →" }).click();
  await expect(page).toHaveURL(/\/zh\/journal/);
  await expect(page.getByRole("heading", { name: /把实验留下来/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "预测市场自由实验" })).toBeVisible();
});

test("compares saved experiment states in the research journal", async ({ page }) => {
  await page.goto("/zh/labs/prediction-markets/");
  await page.getByRole("button", { name: "低流动性" }).click();
  await page.getByRole("button", { name: "记录这次实验" }).click();
  await page.getByRole("button", { name: "正常市场" }).click();
  await page.getByRole("button", { name: "记录这次实验" }).click();
  await page.getByRole("link", { name: "查看研究记录 →" }).click();
  const compareInputs = page.getByRole("checkbox", { name: /对照/ });
  await expect(compareInputs).toHaveCount(2);
  await compareInputs.nth(0).check();
  await compareInputs.nth(1).check();
  await expect(page.getByRole("region", { name: "实验对照台" })).toBeVisible();
  await expect(page.getByText("到底是哪一条规则改变了结果？")).toBeVisible();
  const reflection = page.getByRole("textbox", { name: /对实验的复盘/ }).first();
  await reflection.fill("我先比较深度，再解释价格为什么移动。");
  await reflection.press("Tab");
  await expect(page.getByRole("region", { name: "实验对照台" }).getByText("我先比较深度，再解释价格为什么移动。", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: /对实验的复盘/ }).first()).toHaveValue("我先比较深度，再解释价格为什么移动。");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("turns the glossary into a searchable learning map", async ({ page }) => {
  await page.goto("/zh/glossary/");
  await expect(page.getByRole("heading", { name: /先用自己的话理解/ })).toBeVisible();
  await page.getByRole("searchbox", { name: "搜索术语或解释" }).fill("数据源质量");
  await expect(page.getByText("找到 1 个术语，匹配“数据源质量”")).toBeVisible();
  await expect(page.getByRole("link", { name: "回到相关章节 →" })).toHaveAttribute("href", /source-quality-and-reporting/);
});

test("keeps glossary links useful after stablecoin translation", async ({ page }) => {
  await page.goto("/en/glossary/");
  await page.getByRole("searchbox", { name: "Search a term or definition" }).fill("stablecoin");
  await expect(page.getByText(/\d+ terms found matching/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open related lesson →" }).first()).toHaveAttribute("href", /\/en\/learn\/stablecoins\/peg-and-redemption/);
});

test("keeps locale switching on translated stablecoin lessons", async ({ page }) => {
  await page.goto("/zh/learn/stablecoins/");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/learn\/stablecoins\/?$/);
  await expect(page.getByRole("heading", { name: "How Can a Stablecoin Stay Near One Dollar?" })).toBeVisible();
});

test("shows the next lesson after saving a chapter", async ({ page }) => {
  await page.goto("/zh/learn/prediction-markets/");
  await expect(page.getByRole("link", { name: /从第一章开始/ })).toBeVisible();
  await page.getByRole("link", { name: /开始第一章/ }).click();
  await page.getByRole("button", { name: "版本 3" }).click();
  await page.getByRole("button", { name: /截至 2028-12-31/ }).click();
  await page.getByRole("button", { name: "保存本章" }).click();
  await page.getByRole("link", { name: "← 课程概览" }).click();
  await expect(page.getByRole("link", { name: /继续上次学习/ })).toBeVisible();
  await expect(page.getByText("01 · 先写一个能结算的问题")).toHaveCount(0);
});

test("respects reduced motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/zh/");
  await expect(page.getByRole("heading", { name: /把链上世界/ })).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
});

test("opens the lending module from the mechanism atlas", async ({ page }) => {
  await page.goto("/zh/");
  await page.getByRole("link", { name: /借贷与清算/ }).first().click();
  await expect(page.getByRole("heading", { name: "抵押品什么时候会被清算？" })).toBeVisible();
  await expect(page.getByText("健康度", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "直接进入沙盒 ↗" })).toBeVisible();
});

test("opens the stablecoin course and explores peg and redemption", async ({ page }) => {
  await page.goto("/zh/learn/stablecoins/");
  await expect(page.getByRole("heading", { name: "稳定币如何尽量保持 1 美元" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "谁保证它值 1 美元？" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "实验任务" })).toBeVisible();
  await page.goto("/zh/labs/stablecoins/");
  await expect(page.getByRole("region", { name: "稳定币机制实验室" })).toBeVisible();
  await page.getByRole("button", { name: "存入抵押品 →" }).click();
  await page.getByRole("button", { name: "发行稳定币 →" }).click();
  await page.getByLabel("外部市场价格").fill("94");
  await page.getByRole("button", { name: "移动市场价格" }).click();
  await expect(page.getByText("市场脱锚", { exact: true })).toBeVisible();
  await page.getByLabel("赎回稳定币数量").fill("10");
  await page.getByRole("button", { name: "销毁并赎回 →" }).click();
  await expect(page.getByText(/销毁 10 USD-LAB/)).toBeVisible();
});

test("uses the dependency map to inspect what a mechanism needs", async ({ page }) => {
  await page.goto("/zh/progress/");
  const graph = page.getByRole("region", { name: "课程关系图" });
  await expect(graph).toBeVisible();
  await graph.locator("button.dependency-graph__node", { hasText: "预言机" }).click();
  await expect(graph.getByRole("heading", { name: "链如何知道现实发生了什么" })).toBeVisible();
  await expect(graph.getByText("结果交接", { exact: true })).toBeVisible();
  await expect(graph.getByText("建议先学", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("shows a draggable course map on the homepage", async ({ page }) => {
  await page.goto("/zh/");
  const graph = page.getByRole("region", { name: "课程关系图" });
  const node = graph.getByRole("button", { name: /移动课程节点：预测市场/ });
  await expect(graph.getByRole("heading", { name: "先看全貌：十门课程怎样连在一起" })).toBeVisible();
  await expect(node).toBeVisible();
  await node.scrollIntoViewIfNeeded();

  const before = await node.boundingBox();
  if (!before) throw new Error("Prediction market node is not measurable");
  const relatedLine = graph.locator("line.is-related").first();
  const initialLineX = await relatedLine.getAttribute("x1");
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 - 70, before.y + before.height / 2 + 35, { steps: 6 });
  await page.mouse.up();
  const after = await node.boundingBox();
  expect(after?.x).toBeLessThan(before.x - 40);
  await expect(relatedLine).not.toHaveAttribute("x1", initialLineX ?? "");

  await graph.getByRole("button", { name: "重置布局" }).click();
  await expect(relatedLine).toHaveAttribute("x1", initialLineX ?? "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("traces a unit of value across ten mechanism boundaries", async ({ page }) => {
  await page.goto("/zh/flows/");
  await expect(page.getByRole("heading", { name: "一单位价值，怎样" })).toBeVisible();
  await expect(page.getByRole("region", { name: "价值路径探索器" })).toBeVisible();
  await page.getByRole("button", { name: /验证承诺后面有多少储备/ }).click();
  await expect(page.getByRole("heading", { name: "验证承诺后面有多少储备" })).toBeVisible();
  await page.getByRole("button", { name: "风险边界" }).click();
  await expect(page.getByText("脱锚、储备挤兑、预言机滞后。", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "打开章节 →" })).toHaveAttribute("href", /\/zh\/learn\/stablecoins\/reserves-and-run-risk/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("keeps the value path useful in English with translated stablecoin lesson", async ({ page }) => {
  await page.goto("/en/flows/");
  await expect(page.getByRole("heading", { name: "How does one unit of value" })).toBeVisible();
  await page.getByRole("button", { name: /Verify the reserves behind the promise/ }).click();
  await expect(page.getByRole("heading", { name: "Verify the reserves behind the promise" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open lesson →" })).toHaveAttribute("href", /\/en\/learn\/stablecoins\/reserves-and-run-risk/);
});

test("connects modules with selectable learning paths", async ({ page }) => {
  await page.goto("/zh/paths/");
  await expect(page.getByRole("heading", { name: /先选一个真正关心的问题/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "市场机制路线" })).toBeVisible();
  await expect(page.getByRole("link", { name: /AMM：/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /预测市场：/ })).toBeVisible();
  await page.locator("summary", { hasText: "其他路线有什么不同？" }).click();
  await page.getByRole("button", { name: /结算审计路线/ }).click();
  await expect(page.getByRole("heading", { name: "结算审计路线" })).toBeVisible();
  await expect(page.getByRole("link", { name: /链如何知道现实发生了什么/ })).toBeVisible();
});

test("finds a starting route through the boundary diagnostic", async ({ page }) => {
  await page.goto("/zh/paths/#diagnostic");
  await expect(page.getByRole("region", { name: "学习起点诊断" })).toBeVisible();
  await page.getByRole("button", { name: /看懂市场与价格/ }).click();
  await page.getByRole("option", { name: /签名本身已经等于转账/ }).click();
  await page.getByRole("button", { name: "下一题 →" }).click();
  await page.getByRole("option", { name: /AMM 用曲线报价/ }).click();
  await page.getByRole("button", { name: "下一题 →" }).click();
  await page.getByRole("option", { name: /风险会暂时被低估/ }).click();
  await page.getByRole("button", { name: "查看我的路线 →" }).click();
  await expect(page.getByRole("region", { name: "学习起点诊断" }).getByRole("heading", { name: "市场机制路线" })).toBeVisible();
  await page.getByRole("link", { name: "进入这条路线 →" }).click();
  await expect(page).toHaveURL(/\/zh\/paths\/?\?path=market-maker/);
  await expect(page.getByRole("region", { name: "跨模块学习路径" }).getByRole("heading", { name: "市场机制路线" })).toBeVisible();
});

test("resumes an unfinished diagnostic from local progress", async ({ page }) => {
  await page.goto("/zh/paths/#diagnostic");
  await page.getByRole("button", { name: /发现风险与失败边界/ }).click();
  await page.getByRole("option", { name: /签名本身已经等于转账/ }).click();
  await page.reload();
  await expect(page.getByText("第 2 / 3 题", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AMM 和订单簿最大的差别是什么？" })).toBeVisible();
});

test("opens the AMM course and moves a constant-product pool", async ({ page }) => {
  await page.goto("/zh/learn/amm/");
  await expect(page.getByRole("heading", { name: "AMM：没有对手盘，谁来报价？" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "没有对手盘，池子就是对手方" })).toBeVisible();
  await page.getByRole("slider", { name: "交换数量" }).fill("12000");
  await page.getByRole("button", { name: "执行交换" }).click();
  await expect(page.getByText(/用 12000 积分/)).toBeVisible();
});

test("walks through collateral, health, and liquidation in the lending lab", async ({ page }) => {
  await page.goto("/zh/learn/lending/");
  await expect(page.getByRole("heading", { name: "抵押品什么时候会被清算？" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "为什么抵押 100 TOKEN 不能借出全部价值？" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "实验任务" })).toBeVisible();
  await page.goto("/zh/labs/lending/");
  await expect(page.getByRole("region", { name: "借贷与清算机制实验室" })).toBeVisible();
  await page.getByRole("button", { name: "存入抵押品 →" }).click();
  await page.getByRole("button", { name: "借出积分 →" }).click();
  await page.getByLabel("外部市场价格").fill("72");
  await page.getByRole("button", { name: "移动市场价格" }).click();
  await page.getByRole("button", { name: "更新预言机为 72" }).click();
  await expect(page.locator(".lending-health-badge").getByText("可被清算", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "运行清算人 →" }).click();
  await expect(page.getByText(/清算人偿还/)).toBeVisible();
});

test("walks through AMM scale, LP inventory, and arbitrage lessons", async ({ page }) => {
  await page.goto("/zh/learn/amm/");
  await expect(page.getByRole("link", { name: /报价为什么会越换越差/ })).toBeVisible();
  await page.getByRole("link", { name: /报价为什么会越换越差/ }).click();
  await expect(page.getByRole("heading", { name: "报价为什么会越换越差？" })).toBeVisible();
  await page.getByRole("button", { name: /大单/ }).click();
  await page.getByRole("button", { name: "执行交换" }).click();
  await expect(page.getByText(/当前平均执行价/)).toBeVisible();

  await page.goto("/zh/learn/amm/lp-inventory-and-fees/");
  await expect(page.getByRole("heading", { name: "LP 赚到的手续费从哪里来？" })).toBeVisible();
  await page.getByRole("button", { name: "存入并获得 LP" }).click();
  await page.getByRole("button", { name: "执行交换" }).click();
  await expect(page.getByText("你的份额现在对应什么？")).toBeVisible();
  await expect(page.getByLabel("LP 持仓对照").getByText("池内持仓价值", { exact: true })).toBeVisible();

  await page.goto("/zh/learn/amm/arbitrage-and-impermanent-loss/");
  await expect(page.getByRole("heading", { name: "外部价格变化时，谁来搬砖？" })).toBeVisible();
  await page.getByRole("slider", { name: "外部价格" }).fill("150");
  await page.getByRole("button", { name: "运行套利者" }).click();
  await expect(page.getByText(/套利者把池内价格/)).toBeVisible();
  await expect(page.getByText("套利者积分")).toBeVisible();
});

test("lets a learner become an LP in the AMM lab", async ({ page }) => {
  await page.goto("/zh/labs/amm/");
  await expect(page.getByRole("heading", { name: "AMM 自由实验室" })).toBeVisible();
  await page.getByRole("button", { name: "执行交换" }).click();
  await expect(page.getByText(/用 12000 积分/)).toBeVisible();
  await page.getByRole("button", { name: "存入并获得 LP" }).click();
  await expect(page.getByText(/你的 LP 份额/)).toBeVisible();
  await page.getByRole("button", { name: "取回一半流动性" }).click();
  await expect(page.getByText("资产守恒，池子状态有效")).toBeVisible();
});

test("opens the complete English AMM course and lab", async ({ page }) => {
  await page.goto("/en/learn/amm/");
  await expect(page.getByRole("heading", { name: "AMM: Who Quotes Without a Counterparty?" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Without an Order Book, the Pool Is the Counterparty" })).toBeVisible();
  await page.getByRole("slider", { name: "Swap amount" }).fill("12000");
  await page.getByRole("button", { name: "Execute swap" }).click();
  await expect(page.getByText(/You used 12000 credits/)).toBeVisible();
  await page.goto("/en/learn/amm/price-impact-and-slippage/");
  await page.getByRole("button", { name: /Large/ }).click();
  await expect(page.getByText("Current average execution price")).toBeVisible();
  await page.goto("/en/labs/amm/");
  await expect(page.getByRole("heading", { name: "AMM Free Lab" })).toBeVisible();
  await page.getByRole("button", { name: "Deposit and mint LP" }).click();
  await expect(page.getByText(/Your LP shares/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Constant-product AMM lab" })).toBeVisible();
});

test("lets a learner inspect supply authority and vesting", async ({ page }) => {
  await page.goto("/zh/learn/token-launch/");
  await expect(page.getByRole("heading", { name: "代币如何被发行" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "供应不是数字，而是一组权力" })).toBeVisible();
  await page.getByRole("button", { name: /增发 100,000 LAB/ }).click();
  await expect(page.getByText(/创建者增发 100,000 LAB/)).toBeVisible();
  await page.getByRole("button", { name: "撤销增发权限" }).click();
  await expect(page.getByText("REVOKED", { exact: true })).toBeVisible();
  await expect(page.getByText("供应守恒，权限与余额状态有效")).toBeVisible();
});

test("walks through token vesting, dilution, and multisig authority", async ({ page }) => {
  await page.goto("/zh/learn/token-launch/");
  await page.getByRole("link", { name: /承诺给未来的代币/ }).click();
  await expect(page.getByRole("heading", { name: "承诺给未来的代币，什么时候算流通？" })).toBeVisible();
  await page.locator(".token-focus-panel").getByRole("button", { name: "推进到下一期" }).click();
  await page.locator(".token-focus-panel").getByRole("button", { name: "领取创建者锁仓" }).click();
  await expect(page.locator(".token-focus-panel__stats").getByText(/锁仓占比/)).toBeVisible();

  await page.goto("/zh/learn/token-launch/dilution-and-distribution/");
  await expect(page.getByRole("heading", { name: "谁被稀释，谁拿到了选择权？" })).toBeVisible();
  await page.locator(".token-focus-panel").getByRole("button", { name: "国库分配 50,000 LAB" }).click();
  await page.locator(".token-focus-panel").getByRole("button", { name: "执行销毁" }).click();
  await expect(page.getByText(/总供应减少/)).toBeVisible();

  await page.goto("/zh/learn/token-launch/permissions-and-governance/");
  await expect(page.getByRole("heading", { name: "谁有资格改变供应规则？" })).toBeVisible();
  await page.getByRole("button", { name: "移交给 2/3 多签" }).click();
  await page.getByRole("button", { name: "多签增发 50,000 LAB" }).click();
  await expect(page.getByText("2/3 多签增发 50,000 LAB")).toBeVisible();
  await expect(page.getByText("2/3 多签", { exact: true }).first()).toBeVisible();
});

test("lets a learner replay price-time priority and partial fills", async ({ page }) => {
  await page.goto("/zh/learn/matching-engine/");
  await expect(page.getByRole("heading", { name: "撮合引擎的一毫秒" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "谁应该先成交？" })).toBeVisible();
  await page.getByRole("button", { name: /提交并运行撮合/ }).click();
  await expect(page.getByText(/成交 2 LAB @ 102 分/)).toBeVisible();
  await expect(page.getByText(/成交 3 LAB @ 102 分/)).toBeVisible();
  await expect(page.locator(".engine-account-console").getByText(/买 1 LAB @ 104/)).toBeVisible();
  await page.getByRole("button", { name: "撤单" }).click();
  await expect(page.getByText("订单簿无交叉，现金与 LAB 守恒")).toBeVisible();
});

test("opens the complete English matching-engine course and lab", async ({ page }) => {
  await page.goto("/en/learn/matching-engine/");
  await expect(page.getByRole("heading", { name: "The Millisecond That Matches an Order" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Who Should Fill First?" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Matching engine lab" })).toBeVisible();
  await page.getByRole("slider", { name: "Limit price" }).fill("104");
  await page.getByRole("slider", { name: "Order quantity" }).fill("6");
  await page.getByRole("button", { name: "Submit and match" }).click();
  await expect(page.getByText(/You and Maker A/)).toBeVisible();
  await page.goto("/en/learn/matching-engine/market-orders-and-depth/");
  await page.getByRole("button", { name: "Market buy 12 LAB" }).click();
  await expect(page.getByText("Cancelled remainder")).toBeVisible();
  await page.goto("/en/labs/matching-engine/");
  await expect(page.getByRole("heading", { name: "Matching Engine Free Lab" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Matching engine lab" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Limit order book" })).toBeVisible();
});

test("opens the complete English lending course and lab", async ({ page }) => {
  await page.goto("/en/learn/lending/");
  await expect(page.getByRole("heading", { name: "When Does Collateral Get Liquidated?" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Why Can’t 100 TOKEN Borrow Its Full Value?" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Lending and liquidation lab" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Deposit 100 TOKEN" })).toBeVisible();
  await page.getByRole("button", { name: "Deposit 100 TOKEN" }).click();
  await page.getByRole("button", { name: "Borrow 6,000 credits" }).click();
  await expect(page.getByText(/You deposited/)).toBeVisible();
  await page.goto("/en/labs/lending/");
  await expect(page.getByRole("heading", { name: "Lending & Liquidation Free Lab" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Lending and liquidation lab" })).toBeVisible();
  await page.getByRole("button", { name: "Price shock" }).click();
  await expect(page.getByText("Liquidation price")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("opens the complete English stablecoin course and lab", async ({ page }) => {
  await page.goto("/en/learn/stablecoins/");
  await expect(page.getByRole("heading", { name: "How Can a Stablecoin Stay Near One Dollar?" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Who Makes It Worth One Dollar?" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Stablecoin mechanism lab" })).toBeVisible();
  await page.getByRole("button", { name: "Deposit 100 collateral" }).click();
  await page.getByRole("button", { name: "Mint 60 USD-LAB" }).click();
  await expect(page.getByText(/You deposited/)).toBeVisible();
  await page.goto("/en/labs/stablecoins/");
  await expect(page.getByRole("heading", { name: "Stablecoin Free Lab" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Stablecoin mechanism lab" })).toBeVisible();
  await page.getByRole("button", { name: "Market depeg" }).click();
  await expect(page.getByText("Target price is not market price")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("opens the complete English token-launch course and lab", async ({ page }) => {
  await page.goto("/en/learn/token-launch/");
  await expect(page.getByRole("heading", { name: "Who Gets to Change a Token?" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Supply Is a Set of Powers, Not a Number" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Token launch mechanism lab" })).toBeVisible();
  await page.getByRole("button", { name: /Mint 100,000 LAB/ }).click();
  await expect(page.getByText(/Creator minted/)).toBeVisible();
  await page.getByRole("button", { name: "Revoke mint authority" }).click();
  await expect(page.getByText("REVOKED", { exact: true })).toBeVisible();
  await page.goto("/en/labs/token-launch/");
  await expect(page.getByRole("heading", { name: "Token Launch Free Lab" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Token launch mechanism lab" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("walks through matching-engine depth, spread, and risk controls", async ({ page }) => {
  await page.goto("/zh/learn/matching-engine/");
  await page.getByRole("link", { name: /市价单会吃掉什么/ }).click();
  await expect(page.getByRole("heading", { name: "市价单会吃掉什么？" })).toBeVisible();
  await page.getByRole("button", { name: "市价买入 12 LAB" }).click();
  await expect(page.getByText(/未成交并取消/)).toBeVisible();
  await expect(page.getByText(/市价单剩余/)).toBeVisible();

  await page.goto("/zh/learn/matching-engine/spread-and-liquidity/");
  await expect(page.getByRole("heading", { name: "价差是谁留下的？" })).toBeVisible();
  await page.getByRole("slider", { name: "深度探针数量" }).fill("8");
  await page.getByRole("button", { name: "用市价单扫过卖盘" }).click();
  await expect(page.getByText(/相对卖一冲击/)).toBeVisible();

  await page.goto("/zh/learn/matching-engine/risk-controls-and-replacement/");
  await expect(page.getByRole("heading", { name: "改价为什么要重新排队？" })).toBeVisible();
  await page.getByRole("button", { name: "先挂买单 100 × 2" }).click();
  await page.getByRole("button", { name: "撤改单并重新排队" }).click();
  await expect(page.getByText(/以 100 分重新提交买入单/)).toBeVisible();
  await expect(page.getByText("时间优先级重新开始")).toBeVisible();
});

test("lets a learner challenge a wrong oracle report", async ({ page }) => {
  await page.goto("/zh/learn/oracles/");
  await expect(page.getByRole("heading", { name: "链如何知道现实发生了什么" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "代码看不见窗外" })).toBeVisible();
  await page.getByRole("button", { name: "报告 NO" }).click();
  await expect(page.getByText("Primary Reporter 已报告")).toBeVisible();
  await page.getByRole("button", { name: /挑战并报告 YES/ }).click();
  await page.getByRole("button", { name: /推进一个挑战窗口/ }).click();
  await page.getByRole("button", { name: /推进一个挑战窗口/ }).click();
  await page.getByRole("button", { name: "交给仲裁者裁决" }).click();
  await expect(page.getByText("结果已准备好")).toBeVisible();
  await expect(page.getByText(/仲裁读取现实证据/)).toBeVisible();
  await expect(page.getByText("担保金守恒，阶段转换有效")).toBeVisible();
});

test("walks through oracle source quality, challenge economics, and settlement handoff", async ({ page }) => {
  await page.goto("/zh/learn/oracles/source-quality-and-reporting/");
  await expect(page.getByRole("heading", { name: "一条 API 结果为什么不够？" })).toBeVisible();
  await page.locator(".oracle-focus-actions").getByRole("button", { name: "来源模糊" }).click();
  await expect(page.getByText("来源模糊").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await page.goto("/zh/learn/oracles/challenge-windows-and-bonds/");
  await expect(page.getByRole("heading", { name: "为什么要给错误报告一个反驳窗口？" })).toBeVisible();
  await page.getByRole("button", { name: "报告 NO（锁定担保）" }).click();
  await page.getByRole("button", { name: "挑战并报告 YES", exact: true }).click();
  await page.locator(".oracle-focus-actions").getByRole("button", { name: "推进一个挑战窗口" }).click();
  await page.getByRole("button", { name: /推进一个挑战窗口（剩/ }).click();
  await page.getByRole("button", { name: "交给仲裁者裁决 →" }).click();
  await expect(page.getByText(/最终结果 YES 已发送给预测市场结算/)).toBeVisible();

  await page.goto("/zh/learn/oracles/settlement-handoff-and-failure/");
  await expect(page.getByRole("heading", { name: "最终结果如何安全交给市场？" })).toBeVisible();
  await page.getByRole("button", { name: "报告 NO" }).click();
  await page.getByRole("button", { name: /推进一个挑战窗口/ }).click();
  await page.getByRole("button", { name: /推进一个挑战窗口/ }).click();
  await page.getByRole("button", { name: "最终化初始报告" }).click();
  await page.locator(".oracle-handoff-button").click();
  await expect(page.getByText(/结算交接已经发生/)).toBeVisible();
  await expect(page.getByText("已交接", { exact: true })).toBeVisible();
});

test("lets a learner sign, tamper and mine a ledger transaction", async ({ page }) => {
  await page.goto("/zh/learn/ledger/");
  await expect(page.getByRole("heading", { name: "一张所有人都能验证的账本" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "谁授权了这笔转账？" })).toBeVisible();
  await page.getByRole("button", { name: "签名并广播" }).click();
  await expect(page.getByText(/tx-1 · 你 → Bob/)).toBeVisible();
  await page.getByRole("button", { name: "篡改金额后再挖矿" }).click();
  await page.getByRole("button", { name: /打包下一个区块/ }).click();
  await expect(page.getByText("签名与交易内容不匹配：交易在广播后被篡改或伪造。", { exact: true })).toBeVisible();
  await expect(page.getByText("余额守恒 · Nonce 连续")).toBeVisible();
});

test("walks through the ledger pool, replay, and finality labs", async ({ page }) => {
  await page.goto("/zh/learn/ledger/transaction-pool-and-replacement/");
  await expect(page.getByRole("heading", { name: "Pending 交易为什么会排队？" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "广播一笔 Pending 交易" }).click();
  await page.getByRole("button", { name: "同 Nonce 重新签名替换" }).click();
  await expect(page.getByText(/使用相同 Nonce 0 替换金额/)).toBeVisible();

  await page.goto("/zh/learn/ledger/block-order-and-state-root/");
  await expect(page.getByRole("heading", { name: "同一组交易，为什么必须同一个顺序？" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "签名并广播" }).click();
  await page.getByRole("button", { name: "打包并固定顺序" }).click();
  await page.getByRole("button", { name: "验证整条链" }).click();
  await expect(page.getByText(/从创世状态重放整条链：状态根、交易顺序和区块哈希一致/)).toBeVisible();

  await page.goto("/zh/learn/ledger/finality-and-confirmations/");
  await expect(page.getByRole("heading", { name: "确认数和最终性有什么区别？" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "生成下一个区块" }).click();
  await page.getByRole("button", { name: /推进最终性/ }).click();
  await expect(page.getByText(/区块 #1 达到教学模拟中的最终性/)).toBeVisible();
});

test("runs the cross-module systems audit and remembers completion", async ({ page }) => {
  await page.goto("/zh/challenges/");
  await expect(page.locator("h1", { hasText: "系统机制审计：一笔价值的十个边界" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "个性化审计建议" })).toBeVisible();
  await expect(page.getByText("建议从第 1 步开始", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: /你 → Bob，120 积分，Nonce 1/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /只有增发/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /检查快照投票权、法定人数/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /积分储备增加/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /先成交 5 LAB @102/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /公开意图与可选排序/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /清算人用自己的资产偿还债务/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /在挑战窗口内提交 YES/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /标记抵押不足/ }).click();
  await page.getByRole("button", { name: "下一关" }).click();
  await page.getByRole("button", { name: /每份获胜的 YES 头寸领取 100 积分/ }).click();
  await page.getByRole("button", { name: "完成系统审计" }).click();
  await expect(page.getByText("系统审计完成")).toBeVisible();
  await page.reload();
  await expect(page.getByText("系统审计完成")).toBeVisible();
});

test("lets an auditor jump between system boundaries", async ({ page }) => {
  await page.goto("/zh/challenges/");
  await page.getByRole("button", { name: "跳到第 9 步：稳定币" }).click();
  await expect(page.getByRole("heading", { name: "再检查 1 美元承诺背后的储备" })).toBeVisible();
  await page.getByRole("button", { name: "跳到第 1 步：最小账本" }).click();
  await expect(page.getByRole("heading", { name: "先确认这笔交易能不能进入状态" })).toBeVisible();
});

test("keeps the path and token lab within a narrow viewport", async ({ page }) => {
  await page.goto("/zh/paths/");
  await expect(page.getByRole("heading", { name: /先选一个真正关心的问题/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.goto("/zh/labs/token-launch/");
  await expect(page.getByRole("heading", { name: "代币发行自由实验室" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.goto("/zh/labs/matching-engine/");
  await expect(page.getByRole("heading", { name: "撮合引擎自由实验室" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.goto("/zh/labs/oracles/");
  await expect(page.getByRole("heading", { name: "预言机自由实验室" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.goto("/zh/labs/ledger/");
  await expect(page.getByRole("heading", { name: "最小账本自由实验室" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.goto("/zh/labs/lending/");
  await expect(page.getByRole("heading", { name: "借贷与清算自由实验室" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.goto("/zh/labs/stablecoins/");
  await expect(page.getByRole("heading", { name: "稳定币自由实验室" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.goto("/zh/challenges/");
  await expect(page.locator("h1", { hasText: "系统机制审计：一笔价值的十个边界" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("turns local learning history into a resumable progress cockpit", async ({ page }) => {
  await page.goto("/zh/progress/");
  await expect(page.getByRole("heading", { name: "你的机制地图，正在留下痕迹。" })).toBeVisible();
  await expect(page.getByText("MODULE MASTERY")).toBeVisible();
  await expect(page.getByText("实验任务", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "个人知识地图" })).toBeVisible();
  await expect(page.getByText("直觉还不稳的地方", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "个人复盘队列" })).toBeVisible();
  await expect(page.getByText("10 分钟复盘", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /已经会了/ }).first().click();
  await expect(page.getByRole("button", { name: /有点难/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /继续.*预测市场/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/progress/);
  await expect(page.getByRole("heading", { name: "Your mechanism map, in motion." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue.*Minimal Ledger/ })).toBeVisible();
});

test("opens the English ledger and oracle learning paths", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.getByRole("heading", { name: /Put onchain systems/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Find my starting point →" }).first()).toBeVisible();
  await page.getByRole("link", { name: "Find my starting point →" }).first().click();
  await page.getByRole("link", { name: "Continue: Minimal Ledger →" }).click();
  await expect(page.getByRole("heading", { name: "A Ledger Everyone Can Verify" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Who Authorized This Transfer?" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Investigation task" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Take me to the experiment ↓" })).toBeVisible();
  await expect(page.locator(".lesson-header").getByText("SIGNATURE · NONCE · STATE")).toBeVisible();
  await page.getByRole("link", { name: "中文" }).click();
  await expect(page).toHaveURL(/\/zh\/learn\/ledger\/transaction-and-state/);
  await page.goto("/en/learn/oracles/");
  await expect(page.getByRole("heading", { name: "How Does a Chain Know What Happened in Reality?" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Code Cannot See Outside the Window" })).toBeVisible();
  await expect(page).toHaveURL(/\/en\/learn\/oracles\/report-challenge-finalize/);
  await page.goto("/en/labs/ledger/");
  await expect(page.getByRole("region", { name: "Experiment timeline" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save this experiment" })).toBeVisible();
});

test("opens the complete English prediction-market course and sandbox", async ({ page }) => {
  await page.goto("/en/learn/prediction-markets/");
  await expect(page.getByRole("heading", { name: "Prediction Markets: How Views Become Prices" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Write a Question That Can Settle" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Settleable question lab" })).toBeVisible();
  await page.getByRole("button", { name: "Version 3" }).click();
  await expect(page.getByText("3/3 anchors defined", { exact: true })).toBeVisible();
  await page.goto("/en/labs/prediction-markets/");
  await expect(page.getByRole("heading", { name: "Prediction market sandbox" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Prediction market sandbox" })).toBeVisible();
  await page.getByRole("button", { name: "Thin liquidity" }).click();
  await page.getByRole("button", { name: "Submit limit order" }).click();
  await expect(page.getByText(/You submitted: BUY YES/)).toBeVisible();
});

test("opens the complete English MEV course and lab", async ({ page }) => {
  await page.goto("/en/learn/mev/");
  await expect(page.getByRole("heading", { name: "Who Gets to Choose the Order?" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Who Can See a Trade Before It Executes?" })).toBeVisible();
  await expect(page.getByRole("region", { name: "MEV and transaction ordering lab" })).toBeVisible();
  await page.getByRole("button", { name: "Submit to mempool →" }).click();
  await page.getByRole("button", { name: "Scan the mempool" }).click();
  await page.getByRole("button", { name: "Build block order" }).click();
  await page.getByRole("button", { name: "Execute block →" }).click();
  await expect(page.getByText("Conserved & replayable", { exact: true })).toBeVisible();
  await page.goto("/en/labs/mev/");
  await expect(page.getByRole("heading", { name: "MEV & Ordering Free Lab" })).toBeVisible();
  await page.getByRole("button", { name: "Sandwich", exact: true }).click();
  await page.getByRole("button", { name: "Submit to mempool →" }).click();
  await page.getByRole("button", { name: "Scan the mempool" }).click();
  await page.getByRole("button", { name: "Build block order" }).click();
  await page.getByRole("button", { name: "Execute block →" }).click();
  await expect(page.getByText("Searcher P/L", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("opens the Chinese MEV path and protection experiment", async ({ page }) => {
  await page.goto("/zh/learn/mev/");
  await expect(page.getByRole("heading", { name: "谁决定交易的顺序？" })).toBeVisible();
  await page.getByRole("link", { name: "开始第一章" }).click();
  await expect(page.getByRole("heading", { name: "交易提交后，谁能先看见它？" })).toBeVisible();
  await expect(page.getByRole("region", { name: "MEV 与交易排序实验室" })).toBeVisible();
  await page.goto("/zh/learn/mev/sandwich-and-slippage/");
  await expect(page.getByRole("heading", { name: "夹子交易赚走的是什么？" })).toBeVisible();
  await page.getByRole("button", { name: "严格保护 · 90 TOKEN" }).click();
  await page.getByRole("button", { name: "运行完整排序 →" }).click();
  await expect(page.getByText("守恒且可重放", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("keeps English challenges and glossary connected", async ({ page }) => {
  await page.goto("/en/challenges/");
  await expect(page.locator("h1", { hasText: "Systems audit: ten boundaries of value" })).toBeVisible();
  await expect(page.getByRole("button", { name: /You → Bob, 120 credits, nonce 1/ })).toBeVisible();
  await page.goto("/en/glossary/");
  await expect(page.getByRole("heading", { name: /Understand it in your own words/ })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search a term or definition" }).fill("nonce");
  await expect(page.getByText(/terms found matching “nonce”/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open related lesson →" }).first()).toHaveAttribute("href", /\/en\/learn\/ledger/);
  await page.getByRole("searchbox", { name: "Search a term or definition" }).fill("MEV");
  await expect(page.getByRole("link", { name: /Module · MEV & Ordering/ }).first()).toHaveAttribute("href", /\/en\/learn\/mev/);
  await page.getByRole("searchbox", { name: "Search a term or definition" }).fill("not-a-real-mechanism");
  await expect(page.getByText("No matching term.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText(/terms found$/)).toBeVisible();
});

test("opens the governance course and replays a full timelock path", async ({ page }) => {
  await page.goto("/en/learn/governance/");
  await expect(page.getByRole("heading", { name: "Who Gets to Change the Protocol?" })).toBeVisible();
  await page.getByRole("link", { name: "Start lesson one", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A Proposal Is a Pending State Change" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Governance and treasury lab" })).toBeVisible();
  await page.getByRole("button", { name: "Run guided path →" }).click();
  await expect(page.getByText("Executed", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Conserved & replayable", { exact: true })).toBeVisible();
});

test("compares governance delegation and treasury cancellation scenarios", async ({ page }) => {
  await page.goto("/zh/labs/governance/");
  await expect(page.getByRole("heading", { name: "治理与金库自由实验室" })).toBeVisible();
  await expect(page.getByRole("region", { name: "治理与金库实验室" })).toBeVisible();
  await page.getByRole("button", { name: "投票委托" }).click();
  await page.getByRole("button", { name: "运行引导路径 →" }).click();
  await expect(page.getByText("已执行", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "金库拨款" }).click();
  await page.getByRole("button", { name: "创建提案" }).click();
  await page.getByRole("button", { name: "赞成" }).nth(0).click();
  await page.getByRole("button", { name: "赞成" }).nth(1).click();
  await page.getByRole("button", { name: "结束投票 · +3 天" }).click();
  await page.getByRole("button", { name: "进入时间锁" }).click();
  await page.getByRole("button", { name: "Guardian 紧急取消" }).click();
  await expect(page.getByText("已取消", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("indexes a governance experiment in the journal and filters it by mechanism", async ({ page }) => {
  await page.goto("/zh/labs/governance/");
  await page.getByRole("button", { name: "金库拨款" }).click();
  await page.getByRole("button", { name: "运行引导路径 →" }).click();
  await page.getByRole("button", { name: "记录这次实验" }).click();
  await page.getByRole("link", { name: "查看研究记录 →" }).click();
  await expect(page.getByText("治理与金库", { exact: true }).first()).toBeVisible();
  await page.getByRole("searchbox", { name: "搜索记录" }).fill("金库");
  await expect(page.getByText(/1 \/ 1 条显示/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "治理与金库自由实验" })).toBeVisible();
});
