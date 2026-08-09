"use client";

import { useMemo, useState } from "react";
import { useSimulation } from "@/platform/simulation/useSimulation";
import { SimulationTimeline } from "@/platform/simulation/SimulationTimeline";
import { createTokenLaunchState, tokenLaunchSpec } from "../core/engine";
import type { TokenHolderId, TokenLaunchState } from "../core/types";

export type TokenLaunchFocus = "core" | "vesting" | "distribution" | "governance";

const formatNumber = (value: number, locale = "zh") => value.toLocaleString(locale === "en" ? "en-US" : "zh-CN");
const holderOrder: TokenHolderId[] = ["creator", "community", "treasury", "user"];

function lockedForHolder(state: TokenLaunchState, holder: TokenHolderId) {
  return state.vesting.filter((schedule) => schedule.holder === holder).reduce((sum, schedule) => sum + schedule.total - schedule.claimed, 0);
}

function formatEvent(message: string, locale: string) {
  if (locale !== "en") return message;
  return message
    .replaceAll("LAB 创建", "LAB created")
    .replaceAll("初始分配写入状态", "Initial allocation recorded")
    .replaceAll("创建者、社区和国库余额可用", "creator, community, and treasury balances are liquid")
    .replaceAll("创建者、社区和国库余额处于锁仓", "creator, community, and treasury balances are locked")
    .replaceAll("创建者增发", "Creator minted")
    .replaceAll("2/3 多签增发", "2/3 multisig minted")
    .replaceAll("分配给", "to")
    .replaceAll("创建者放弃增发权限", "Creator revoked mint authority")
    .replaceAll("增发权限移交给 2/3 多签", "Mint authority moved to 2/3 multisig")
    .replaceAll("单个创建者不再能独自改变供应", "the creator can no longer change supply alone")
    .replaceAll("销毁", "burned")
    .replaceAll("总供应减少", "total supply fell")
    .replaceAll("时间推进到", "Time advanced to")
    .replaceAll("锁仓不会自动进入流通", "Vesting does not become liquid automatically")
    .replaceAll("领取", "claimed")
    .replaceAll("锁仓转为流通余额", "locked units became liquid")
    .replaceAll("向", " transferred to ")
    .replaceAll("，", ", ")
    .replaceAll("。", ".");
}

function TokenEventLog({ state, locale = "zh" }: { state: TokenLaunchState; locale?: string }) {
  const english = locale === "en";
  return <div className="token-event-log" aria-live="polite"><header><strong>{english ? "Supply events" : "供应事件"}</strong><span>{state.events.length} EVENTS</span></header><ol>{state.events.slice(-8).reverse().map((event) => <li key={event.id}><span>{String(event.index).padStart(2, "0")}</span><p>{formatEvent(event.message, locale)}</p></li>)}</ol></div>;
}

function localAuthorityLabel(label: string, locale: string) {
  if (locale !== "en") return label;
  return ({ "创建者单签": "Creator single signer", "2/3 多签": "2/3 multisig", "已撤销": "Revoked" } as Record<string, string>)[label] ?? label;
}

function localVestingLabel(label: string, locale: string) {
  if (locale !== "en") return label;
  return ({ "发行日": "Launch day", "第 1 期解锁": "Phase 1 unlocked", "全部解锁": "Fully unlocked" } as Record<string, string>)[label] ?? label;
}

export function TokenLaunchLab({ focus = "core", locale = "zh" }: { focus?: TokenLaunchFocus; locale?: string }) {
  const english = locale === "en";
  const simulation = useSimulation(tokenLaunchSpec, createTokenLaunchState(23));
  const [mintAmount, setMintAmount] = useState(100_000);
  const [transferAmount, setTransferAmount] = useState(50_000);
  const [burnAmount, setBurnAmount] = useState(25_000);
  const metrics = simulation.metrics;
  const safeMintAmount = Math.min(mintAmount, Math.max(1, metrics.mintableSupply));
  const treasuryBalance = simulation.state.holders.treasury.liquid;
  const safeTransferAmount = Math.min(transferAmount, Math.max(1, treasuryBalance));
  const safeBurnAmount = Math.min(burnAmount, Math.max(1, simulation.state.holders.community.liquid));
  const holderTotals = useMemo(() => Object.fromEntries(holderOrder.map((id) => [id, simulation.state.holders[id].liquid + lockedForHolder(simulation.state, id)])) as Record<TokenHolderId, number>, [simulation.state]);
  const authorityLabel = localAuthorityLabel(metrics.authorityLabel, locale);
  const vestingLabel = localVestingLabel(metrics.vestingLabel, locale);
  const coachMessage = useMemo(() => {
    const latest = simulation.state.events.at(-1);
    if (!latest || latest.kind === "DISTRIBUTION_SET") return english ? "Start with the supply map: liquid balances, locked balances, and the mint authority are separate state variables." : "先看总供应被拆成了哪些部分：可流通余额、锁仓余额，以及创建者仍然拥有的增发权限。";
    if (latest.kind === "MINT") return english ? "Minting does not take units from someone else's balance; it writes new units into total supply. The cap limits how much, authority decides who can press the button." : "增发没有从别人的余额里扣除，而是直接把新单位写入总供应。供应上限限制数量，权限决定谁能按下按钮。";
    if (latest.kind === "AUTHORITY_REVOKED") return english ? "Revoking authority is an irreversible social promise: code can no longer expand supply, but existing tokens remain." : "撤销权限是一条不可逆的社会承诺：代码不再允许任何角色扩大供应，但它不会抹掉已经存在的代币。";
    if (latest.kind === "AUTHORITY_TRANSFERRED") return english ? "Moving authority to a multisig does not change supply; it changes who can approve future supply changes." : "把权限交给多签不会自动改变总供应，但它改变了谁能批准未来的供应变化：单个创建者不能再独自按下 mint。";
    if (latest.kind === "VESTING_ADVANCED") return english ? "Time makes units claimable, not liquid. A holder still has to claim them." : "时间到了不等于代币自动进入市场。锁仓只是可领取额度，持有人还要执行领取动作。";
    if (latest.kind === "VESTING_CLAIMED") return english ? "Claiming increases liquid supply without increasing total supply; that is different from minting." : "解锁会增加流通供应，却不增加总供应；这和增发是两种完全不同的状态变化。";
    if (latest.kind === "BURN") return english ? "Burning reduces a holder's balance and total supply; it is not a transfer to an invisible address." : "销毁会减少持有人的余额，也减少总供应；它不是把代币转给一个看不见的地址。";
    return english ? "Transfers change distribution, not total supply. Keep that ledger separate from minting and vesting." : "转账只改变持有人之间的分配，不改变总供应。把这件事和增发、解锁分别记账，才不会混淆。";
  }, [english, simulation.state.events]);

  function advanceVesting() { simulation.dispatch({ type: "ADVANCE_VESTING" }); }
  function claim(holderId: "creator" | "community") { simulation.dispatch({ type: "CLAIM_VESTING", holder: holderId }); }
  function distributeToUser() { simulation.dispatch({ type: "TRANSFER", from: "treasury", to: "user", amount: 50_000 }); }
  function burnCommunity() { simulation.dispatch({ type: "BURN", from: "community", amount: safeBurnAmount }); }
  function handOffToMultisig() { simulation.dispatch({ type: "TRANSFER_MINT_AUTHORITY", to: "multisig" }); }
  function multisigMint() { simulation.dispatch({ type: "MINT", to: "treasury", amount: 50_000, actor: "multisig" }); }

  return <section className="token-launch-lab" aria-label={english ? "Token launch mechanism lab" : "代币发行机制实验室"}>
    <div className="token-launch-lab__toolbar"><span><i />SIMULATION ACTIVE</span><span>{english ? "Virtual asset · LAB" : "虚拟资产 · LAB"}</span><button onClick={() => simulation.reset(createTokenLaunchState(23))} type="button">{english ? "Reset lab" : "重置实验"}</button></div>
    <header className="token-launch-lab__header"><div><small>ASSET 001 · SUPPLY &amp; AUTHORITY</small><h3>LAB / {english ? "Virtual token" : "虚拟代币"}</h3><p>{english ? "Every action changes a public state table. Ask who can change supply, who can claim, and who absorbs dilution." : "每个动作只改变一张公开状态表；你可以逐步追问，谁能改变供应、谁能领取、谁承担稀释。"}</p></div><div className={`token-authority-badge ${metrics.authorityActive ? "is-active" : "is-revoked"}`}><span>{english ? "Mint authority" : "增发权限"}</span><strong>{metrics.authorityActive ? authorityLabel.toUpperCase() : "REVOKED"}</strong><small>{metrics.authorityLabel === "创建者单签" ? (english ? "Creator can mint" : "创建者仍可铸造") : metrics.authorityLabel === "2/3 多签" ? (english ? "Multisig approval required" : "需要多签执行") : (english ? "Supply only comes from existing balances" : "供应只能来自现有余额")}</small></div></header>

    <div className="token-launch-lab__metrics"><div><span>{english ? "Total supply" : "总供应"}</span><strong>{formatNumber(simulation.state.totalSupply, locale)}</strong><small>{english ? "Cap " : "上限 "}{formatNumber(simulation.state.maxSupply, locale)}</small></div><div><span>{english ? "Liquid supply" : "流通供应"}</span><strong>{formatNumber(metrics.liquidSupply, locale)}</strong><small>{(metrics.circulatingBps / 100).toFixed(1)}% {english ? "liquid" : "已流通"}</small></div><div><span>{english ? "Locked supply" : "锁仓供应"}</span><strong>{formatNumber(metrics.lockedSupply, locale)}</strong><small>{english ? "Claimable " : "可领取 "}{formatNumber(metrics.claimableSupply, locale)}</small></div><div><span>{english ? "Mintable" : "还能增发"}</span><strong>{formatNumber(metrics.mintableSupply, locale)}</strong><small>{english ? "room under cap" : "供应上限空间"}</small></div></div>

    {focus !== "core" && <section className="token-focus-panel" aria-label={english ? "Focus experiment" : "本章焦点实验"}>
      {focus === "vesting" && <><div><span className="token-focus-panel__eyebrow">VESTING · UNLOCK OVERHANG</span><h4>{english ? "Claimable does not mean circulating" : "可解锁不等于已经流通"}</h4><p>{english ? "Advancing time only changes claimable amounts; holders still have to claim. Keep locked, claimable, and liquid units separate." : "时间推进只改变领取额度；持有人还要主动领取。观察锁仓占比、可领取数量和流通供应如何分开变化。"}</p></div><div className="token-focus-panel__actions"><button disabled={simulation.state.vestingPhase >= 2} onClick={advanceVesting} type="button">{english ? "Advance to next phase" : "推进到下一期"}</button><button disabled={metrics.claimableSupply <= 0} onClick={() => claim("creator")} type="button">{english ? "Claim creator vesting" : "领取创建者锁仓"}</button><button disabled={metrics.claimableSupply <= 0} onClick={() => claim("community")} type="button">{english ? "Claim community vesting" : "领取社区锁仓"}</button></div><div className="token-focus-panel__stats"><span>{english ? "Phase" : "阶段"} <b>{vestingLabel}</b></span><span>{english ? "Unlock overhang" : "锁仓占比"} <b>{(metrics.unlockOverhangBps / 100).toFixed(1)}%</b></span><span>{english ? "Claimable now" : "当前可领取"} <b>{formatNumber(metrics.claimableSupply, locale)} LAB</b></span></div></>}
      {focus === "distribution" && <><div><span className="token-focus-panel__eyebrow">ALLOCATION · DILUTION · BURN</span><h4>{english ? "Ownership changes with supply and distribution" : "持有比例会随着供应和分配一起变化"}</h4><p>{english ? "Transfers change ownership, minting dilutes existing holders, and burning reduces total supply. Distribute from the treasury, then burn community units." : "转账改变所有权，增发稀释既有持有人，销毁则减少总供应。先做一次国库分配，再观察社区销毁如何改变占比。"}</p></div><div className="token-focus-panel__actions"><button onClick={distributeToUser} type="button">{english ? "Treasury transfer 50,000 LAB" : "国库分配 50,000 LAB"}</button><label><span>{english ? "Community burn" : "社区销毁"} <b>{formatNumber(safeBurnAmount, locale)} LAB</b></span><input aria-label={english ? "Community burn amount" : "社区销毁数量"} min="1" max={Math.max(1, Math.min(100_000, simulation.state.holders.community.liquid))} type="range" value={safeBurnAmount} onChange={(event) => setBurnAmount(Number(event.target.value))} /></label><button onClick={burnCommunity} type="button">{english ? "Execute burn" : "执行销毁"}</button></div><div className="token-focus-panel__stats"><span>{english ? "Creator liquid share" : "创建者流通占比"} <b>{(metrics.creatorShareBps / 100).toFixed(1)}%</b></span><span>{english ? "Community liquid share" : "社区流通占比"} <b>{(metrics.communityShareBps / 100).toFixed(1)}%</b></span><span>{english ? "Largest allocation" : "当前最大分配"} <b>{simulation.state.holders[metrics.topHolder].label} · {(metrics.topHolderShareBps / 100).toFixed(1)}%</b></span></div></>}
      {focus === "governance" && <><div><span className="token-focus-panel__eyebrow">AUTHORITY · MULTISIG · IRREVERSIBLE</span><h4>{english ? "The supply rule needs an approver, not just a cap" : "供应规则的关键不只是上限，还有批准者"}</h4><p>{english ? "Move mint authority from the creator to a 2/3 multisig. A lone creator can no longer mint; revocation is permanent." : "把增发权限从创建者单签移交给 2/3 多签后，单个创建者的 mint 会被拒绝；只有模拟的多签执行者才能继续改变供应。撤销则不可逆。"}</p></div><div className="token-focus-panel__actions"><button disabled={simulation.state.mintAuthority !== "creator"} onClick={handOffToMultisig} type="button">{english ? "Move to 2/3 multisig" : "移交给 2/3 多签"}</button><button disabled={simulation.state.mintAuthority !== "multisig"} onClick={multisigMint} type="button">{english ? "Multisig mint 50,000 LAB" : "多签增发 50,000 LAB"}</button><button disabled={simulation.state.mintAuthority === "revoked"} onClick={() => simulation.dispatch({ type: "REVOKE_MINT_AUTHORITY" })} type="button">{english ? "Revoke authority permanently" : "永久撤销权限"}</button></div><div className="token-focus-panel__stats"><span>{english ? "Current approver" : "当前批准者"} <b>{authorityLabel}</b></span><span>{english ? "Mintable room" : "增发空间"} <b>{formatNumber(metrics.mintableSupply, locale)} LAB</b></span><span>{english ? "Status" : "状态"} <b>{simulation.validation.valid ? (english ? "Conserved & replayable" : "守恒且可重放") : (english ? "Needs review" : "需要检查")}</b></span></div></>}
    </section>}

    <div className="token-launch-lab__middle"><section className="token-supply-map"><header><strong>{english ? "Allocation & vesting" : "分配与锁仓"}</strong><span>{vestingLabel}</span></header><div className="token-supply-map__bars">{holderOrder.map((id) => { const liquid = simulation.state.holders[id].liquid; const locked = lockedForHolder(simulation.state, id); const total = holderTotals[id]; const width = Math.max(4, Math.min(100, (total / simulation.state.totalSupply) * 100)); return <article key={id}><div className="token-holder-row"><span>{english ? ({ creator: "Creator", community: "Community", treasury: "Treasury", user: "Learner" } as Record<string, string>)[id] : simulation.state.holders[id].label}</span><b>{formatNumber(total, locale)} LAB</b></div><div className="token-balance-track" style={{ width: `${width}%` }}><i style={{ width: `${total ? (liquid / total) * 100 : 0}%` }} /><em style={{ width: `${total ? (locked / total) * 100 : 0}%` }} /></div><small>{english ? "Liquid" : "可用"} {formatNumber(liquid, locale)} · {english ? "Locked" : "锁仓"} {formatNumber(locked, locale)}</small></article>; })}</div><div className="token-supply-legend"><span><i className="is-liquid" />{english ? "Liquid" : "可流通"}</span><span><i className="is-locked" />{english ? "Locked" : "锁仓"}</span></div><p>{english ? "Locked units count toward total supply but cannot transfer yet. Color is secondary; numbers and labels are the state." : "锁仓仍计入总供应，但还不能转账。颜色只是辅助，数字和标签才是状态。"}</p></section>
      <aside className="token-control-console"><div className="token-control-block"><header><strong>{english ? "Change supply" : "改变供应"}</strong><span>{english ? "requires authority" : "需要权限"}</span></header><label><span>{english ? "Mint amount" : "增发数量"} <b>{formatNumber(safeMintAmount, locale)} LAB</b></span><input aria-label={english ? "Mint amount" : "增发数量"} disabled={!metrics.authorityActive || metrics.mintableSupply <= 0} max={Math.max(1, Math.min(200_000, metrics.mintableSupply))} min="1" onChange={(event) => setMintAmount(Number(event.target.value))} type="range" value={safeMintAmount} /></label><button className="token-action-button" disabled={!metrics.authorityActive || metrics.mintableSupply <= 0} onClick={() => simulation.dispatch({ type: "MINT", to: "treasury", amount: safeMintAmount })} type="button">{english ? `Mint ${formatNumber(safeMintAmount, locale)} LAB` : `增发 ${formatNumber(safeMintAmount)} LAB`}</button><button className="ghost-action" disabled={!metrics.authorityActive} onClick={() => simulation.dispatch({ type: "REVOKE_MINT_AUTHORITY" })} type="button">{english ? "Revoke mint authority" : "撤销增发权限"}</button></div><div className="token-control-block"><header><strong>{english ? "Advance time" : "推进时间"}</strong><span>{vestingLabel}</span></header><p>{english ? "Advance to the next phase, then claim creator or community vesting separately. Unlocking does not create new tokens." : "推进到下一期，再分别领取创建者或社区的锁仓。解锁不会凭空制造新代币。"}</p><button className="token-action-button" disabled={simulation.state.vestingPhase >= 2} onClick={() => simulation.dispatch({ type: "ADVANCE_VESTING" })} type="button">{english ? "Advance to next phase" : "推进到下一期"}</button><div className="token-claim-actions"><button disabled={metrics.claimableSupply <= 0} onClick={() => simulation.dispatch({ type: "CLAIM_VESTING", holder: "creator" })} type="button">{english ? "Claim creator vesting" : "领取创建者锁仓"}</button><button disabled={metrics.claimableSupply <= 0} onClick={() => simulation.dispatch({ type: "CLAIM_VESTING", holder: "community" })} type="button">{english ? "Claim community vesting" : "领取社区锁仓"}</button></div></div></aside></div>

    <div className="token-launch-lab__coach" role="status"><span>{english ? "Observation prompt" : "观察提示"}</span><p>{coachMessage}</p></div>

    <div className="token-launch-lab__lower"><TokenEventLog state={simulation.state} locale={locale} /><aside className="token-transfer-console"><header><strong>{english ? "Simulate a distribution" : "模拟一次分配"}</strong><span>{english ? "holder balances only" : "只改变持有人"}</span></header><p>{english ? "Send LAB from the treasury to the learner. Distribution changes balances, not total supply." : "把国库中的 LAB 分给学习者，观察分配改变了谁的余额，但不改变总供应。"}</p><label><span>{english ? "Transfer amount" : "分配数量"} <b>{formatNumber(safeTransferAmount, locale)} LAB</b></span><input aria-label={english ? "Transfer amount" : "分配数量"} max={Math.max(1, Math.min(100_000, treasuryBalance))} min="1" onChange={(event) => setTransferAmount(Number(event.target.value))} type="range" value={safeTransferAmount} /></label><button className="token-action-button" disabled={treasuryBalance <= 0} onClick={() => simulation.dispatch({ type: "TRANSFER", from: "treasury", to: "user", amount: safeTransferAmount })} type="button">{english ? "Distribute to learner →" : "分配给学习者 →"}</button><div className="token-invariant-status"><span>{simulation.validation.valid ? "✓" : "!"}</span><p><strong>{english ? "System check" : "系统检查"}</strong>{simulation.validation.valid ? (english ? "Supply conserved; authority and balances replay" : "供应守恒，权限与余额状态有效") : simulation.validation.violations.join(english ? "; " : "；")}</p></div>{simulation.error && <p className="form-error" role="alert">{simulation.error}</p>}{simulation.actions.length > 0 && <button className="undo-button" onClick={() => simulation.replayTo(simulation.actions.length - 1)} type="button">{english ? "Undo last action" : "撤回上一步"}</button>}</aside></div>
    <SimulationTimeline snapshots={simulation.snapshots} actionCount={simulation.actions.length} onRewind={simulation.replayTo} journal={{ moduleId: "token-launch", title: english ? "Token launch free lab" : "代币发行自由实验", scenario: authorityLabel, note: english ? `Supply ${simulation.state.totalSupply} LAB, liquid ${metrics.liquidSupply}, locked ${metrics.lockedSupply}.` : "记录供应、锁仓、分配和增发权限的当前状态。", labPath: "/labs/token-launch", stateSnapshot: tokenLaunchSpec.serialize(simulation.state), actions: simulation.actions.map((action) => JSON.stringify(action) ?? "{}"), events: simulation.state.events.slice(-8).map(({ kind, message }) => ({ kind, message: formatEvent(message, locale) })), metrics: [{ label: english ? "Total supply" : "总供应", value: formatNumber(simulation.state.totalSupply, locale) }, { label: english ? "Liquid supply" : "流通供应", value: formatNumber(metrics.liquidSupply, locale) }, { label: english ? "Locked supply" : "锁仓供应", value: formatNumber(metrics.lockedSupply, locale) }, { label: english ? "Mint authority" : "增发权限", value: authorityLabel }], insight: english ? "Transfers change distribution; minting changes total supply; authority decides who can change the table." : "转账改变分布，增发改变总供应；权限决定谁能改变这张表。" }} />
  </section>;
}
