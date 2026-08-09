import type { SimulationSpec } from "@/platform/simulation/types";
import type { MintAuthority, TokenHolderId, TokenLaunchAction, TokenLaunchMetrics, TokenLaunchState, VestingSchedule } from "./types";

const INITIAL_MAX_SUPPLY = 1_200_000;
const INITIAL_SUPPLY = 1_000_000;
const VESTING_PHASE_BPS = [0, 5_000, 10_000] as const;
const VESTING_LABELS = ["发行日", "第 1 期解锁", "全部解锁"] as const;
const HOLDER_LABELS: Record<TokenHolderId, string> = {
  creator: "创建者",
  community: "社区",
  treasury: "国库",
  user: "学习者",
};
const AUTHORITY_LABELS: Record<MintAuthority, string> = {
  creator: "创建者单签",
  multisig: "2/3 多签",
  revoked: "已撤销",
};

function cloneState(state: TokenLaunchState): TokenLaunchState {
  return {
    ...state,
    holders: Object.fromEntries(Object.entries(state.holders).map(([id, holder]) => [id, { ...holder }])) as TokenLaunchState["holders"],
    vesting: state.vesting.map((schedule) => ({ ...schedule })),
    events: state.events.map((event) => ({ ...event })),
  };
}

function appendEvent(state: TokenLaunchState, kind: string, message: string) {
  const index = state.events.length + 1;
  state.events.push({ id: `event-${index}`, index, kind, message });
}

function validateAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("数量必须是正整数。");
}

function holder(state: TokenLaunchState, id: TokenHolderId) {
  return state.holders[id];
}

function claimableForSchedule(schedule: VestingSchedule, phase: 0 | 1 | 2) {
  const unlocked = Math.floor((schedule.total * VESTING_PHASE_BPS[phase]) / 10_000);
  return Math.max(0, unlocked - schedule.claimed);
}

export function mint(state: TokenLaunchState, to: TokenHolderId, amount: number, actor: "creator" | "multisig" = "creator") {
  validateAmount(amount);
  const next = cloneState(state);
  if (next.mintAuthority !== actor) throw new Error(`当前增发权限属于${AUTHORITY_LABELS[next.mintAuthority]}，${actor === "creator" ? "创建者" : "多签执行者"}不能单独增发。`);
  if (next.totalSupply + amount > next.maxSupply) throw new Error(`超过供应上限，还剩 ${next.maxSupply - next.totalSupply} LAB 可以增发。`);
  holder(next, to).liquid += amount;
  next.totalSupply += amount;
  appendEvent(next, "MINT", `${actor === "multisig" ? "2/3 多签" : "创建者"}增发 ${amount.toLocaleString("zh-CN")} LAB，分配给${HOLDER_LABELS[to]}。`);
  return next;
}

export function revokeMintAuthority(state: TokenLaunchState) {
  return transferMintAuthority(state, "revoked");
}

export function transferMintAuthority(state: TokenLaunchState, target: Exclude<MintAuthority, "creator">) {
  const next = cloneState(state);
  if (next.mintAuthority === "revoked") throw new Error("增发权限已经撤销，不能再次移交。");
  if (next.mintAuthority === target) throw new Error(`当前权限已经属于${AUTHORITY_LABELS[target]}。`);
  next.mintAuthority = target;
  appendEvent(next, target === "revoked" ? "AUTHORITY_REVOKED" : "AUTHORITY_TRANSFERRED", target === "revoked" ? "创建者放弃增发权限：之后的供应只能来自已存在的余额和锁仓解锁。" : "增发权限移交给 2/3 多签：单个创建者不再能独自改变供应。 ");
  return next;
}

export function burn(state: TokenLaunchState, from: TokenHolderId, amount: number) {
  validateAmount(amount);
  const next = cloneState(state);
  if (holder(next, from).liquid < amount) throw new Error(`${HOLDER_LABELS[from]}的可用余额不足，不能销毁 ${amount.toLocaleString("zh-CN")} LAB。`);
  holder(next, from).liquid -= amount;
  next.totalSupply -= amount;
  appendEvent(next, "BURN", `${HOLDER_LABELS[from]}销毁 ${amount.toLocaleString("zh-CN")} LAB，总供应减少。`);
  return next;
}

export function advanceVesting(state: TokenLaunchState) {
  const next = cloneState(state);
  if (next.vestingPhase >= 2) throw new Error("所有锁仓都已经进入可解锁阶段。");
  next.vestingPhase = (next.vestingPhase + 1) as TokenLaunchState["vestingPhase"];
  appendEvent(next, "VESTING_ADVANCED", `时间推进到${VESTING_LABELS[next.vestingPhase]}。锁仓不会自动进入流通，持有人仍需主动领取。`);
  return next;
}

export function claimVesting(state: TokenLaunchState, target: TokenHolderId) {
  const next = cloneState(state);
  let claimed = 0;
  next.vesting = next.vesting.map((schedule) => {
    if (schedule.holder !== target) return schedule;
    const amount = claimableForSchedule(schedule, next.vestingPhase);
    claimed += amount;
    return { ...schedule, claimed: schedule.claimed + amount };
  });
  if (claimed <= 0) throw new Error("当前阶段没有新的 LAB 可以领取。");
  holder(next, target).liquid += claimed;
  appendEvent(next, "VESTING_CLAIMED", `${HOLDER_LABELS[target]}领取 ${claimed.toLocaleString("zh-CN")} LAB，锁仓转为流通余额。`);
  return next;
}

export function transfer(state: TokenLaunchState, from: TokenHolderId, to: TokenHolderId, amount: number) {
  validateAmount(amount);
  if (from === to) throw new Error("转出和转入必须是不同持有人。");
  const next = cloneState(state);
  if (holder(next, from).liquid < amount) throw new Error(`${HOLDER_LABELS[from]}的可用余额不足。`);
  holder(next, from).liquid -= amount;
  holder(next, to).liquid += amount;
  appendEvent(next, "TRANSFER", `${HOLDER_LABELS[from]}向${HOLDER_LABELS[to]}转移 ${amount.toLocaleString("zh-CN")} LAB。`);
  return next;
}

function baseState(seed: number): TokenLaunchState {
  const state: TokenLaunchState = {
    seed,
    tokenSymbol: "LAB",
    maxSupply: INITIAL_MAX_SUPPLY,
    totalSupply: INITIAL_SUPPLY,
    mintAuthority: "creator",
    vestingPhase: 0,
    holders: {
      creator: { id: "creator", label: HOLDER_LABELS.creator, liquid: 100_000 },
      community: { id: "community", label: HOLDER_LABELS.community, liquid: 300_000 },
      treasury: { id: "treasury", label: HOLDER_LABELS.treasury, liquid: 200_000 },
      user: { id: "user", label: HOLDER_LABELS.user, liquid: 0 },
    },
    vesting: [
      { id: "creator-vesting", holder: "creator", label: "创建者 12 个月线性锁仓", total: 300_000, claimed: 0, unlockBps: 10_000 },
      { id: "community-vesting", holder: "community", label: "社区奖励 6 个月锁仓", total: 100_000, claimed: 0, unlockBps: 10_000 },
    ],
    events: [],
    nextSequence: 1,
  };
  appendEvent(state, "TOKEN_CREATED", "LAB 创建：总供应 1,000,000，供应上限 1,200,000，创建者保留增发权限。");
  appendEvent(state, "DISTRIBUTION_SET", "初始分配写入状态：创建者、社区、国库余额可用；另外 400,000 LAB 处于锁仓。");
  return state;
}

export function createTokenLaunchState(seed = 23) {
  return baseState(seed);
}

export function deriveTokenLaunchMetrics(state: TokenLaunchState): TokenLaunchMetrics {
  const liquidSupply = Object.values(state.holders).reduce((sum, item) => sum + item.liquid, 0);
  const lockedSupply = state.vesting.reduce((sum, schedule) => sum + schedule.total - schedule.claimed, 0);
  const claimableSupply = state.vesting.reduce((sum, schedule) => sum + claimableForSchedule(schedule, state.vestingPhase), 0);
  const treasuryShareBps = state.totalSupply === 0 ? 0 : Math.floor((state.holders.treasury.liquid * 10_000) / state.totalSupply);
  const liquidShare = (id: TokenHolderId) => state.totalSupply === 0 ? 0 : Math.floor((state.holders[id].liquid * 10_000) / state.totalSupply);
  const allocation = (id: TokenHolderId) => state.holders[id].liquid + state.vesting.filter((schedule) => schedule.holder === id).reduce((sum, schedule) => sum + schedule.total - schedule.claimed, 0);
  const topHolder = (Object.keys(state.holders) as TokenHolderId[]).reduce((best, id) => allocation(id) > allocation(best) ? id : best, "creator" as TokenHolderId);
  const topHolderShareBps = state.totalSupply === 0 ? 0 : Math.floor((allocation(topHolder) * 10_000) / state.totalSupply);
  return {
    liquidSupply,
    lockedSupply,
    circulatingBps: state.totalSupply === 0 ? 0 : Math.floor((liquidSupply * 10_000) / state.totalSupply),
    mintableSupply: state.maxSupply - state.totalSupply,
    claimableSupply,
    treasuryShareBps,
    creatorShareBps: liquidShare("creator"),
    communityShareBps: liquidShare("community"),
    userShareBps: liquidShare("user"),
    topHolder,
    topHolderShareBps,
    unlockOverhangBps: state.totalSupply === 0 ? 0 : Math.floor((lockedSupply * 10_000) / state.totalSupply),
    authorityActive: state.mintAuthority !== "revoked",
    authorityLabel: AUTHORITY_LABELS[state.mintAuthority],
    vestingLabel: VESTING_LABELS[state.vestingPhase],
  };
}

export function validateTokenLaunchState(state: TokenLaunchState) {
  const violations: string[] = [];
  const liquidSupply = Object.values(state.holders).reduce((sum, item) => sum + item.liquid, 0);
  const lockedSupply = state.vesting.reduce((sum, schedule) => sum + schedule.total - schedule.claimed, 0);
  if (state.totalSupply < 0 || state.totalSupply > state.maxSupply || !Number.isInteger(state.totalSupply)) violations.push("总供应必须是供应上限以内的非负整数。");
  if (state.maxSupply <= 0 || !Number.isInteger(state.maxSupply)) violations.push("供应上限必须是正整数。");
  if (Object.values(state.holders).some((item) => item.liquid < 0 || !Number.isInteger(item.liquid))) violations.push("余额不能为负数，且必须使用整数单位。");
  if (state.vesting.some((schedule) => schedule.claimed < 0 || schedule.claimed > schedule.total || !Number.isInteger(schedule.claimed))) violations.push("锁仓领取数量不合法。");
  if (liquidSupply + lockedSupply !== state.totalSupply) violations.push("流通余额与锁仓余额没有守恒到总供应。");
  if (state.vestingPhase < 0 || state.vestingPhase > 2) violations.push("解锁阶段不合法。");
  if (!(state.mintAuthority in AUTHORITY_LABELS)) violations.push("增发权限状态不合法。");
  return { valid: violations.length === 0, violations };
}

export const tokenLaunchSpec: SimulationSpec<TokenLaunchState, TokenLaunchAction, TokenLaunchMetrics> = {
  id: "token-launch-v2",
  createInitialState: createTokenLaunchState,
  reduce: (state, action) => {
    switch (action.type) {
      case "MINT": return mint(state, action.to, action.amount, action.actor);
      case "REVOKE_MINT_AUTHORITY": return revokeMintAuthority(state);
      case "TRANSFER_MINT_AUTHORITY": return transferMintAuthority(state, action.to);
      case "BURN": return burn(state, action.from, action.amount);
      case "ADVANCE_VESTING": return advanceVesting(state);
      case "CLAIM_VESTING": return claimVesting(state, action.holder);
      case "TRANSFER": return transfer(state, action.from, action.to, action.amount);
    }
  },
  deriveMetrics: deriveTokenLaunchMetrics,
  validateInvariants: validateTokenLaunchState,
  serialize: (state) => JSON.stringify(state),
  deserialize: (serialized) => JSON.parse(serialized) as TokenLaunchState,
};
