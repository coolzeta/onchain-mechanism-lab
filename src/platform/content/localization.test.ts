import { describe, expect, it } from "vitest";
import { ledgerManifest } from "@/modules/ledger/manifest";
import { oracleManifest } from "@/modules/oracles/manifest";
import { predictionMarketManifest } from "@/modules/prediction-markets/manifest";
import { ammManifest } from "@/modules/amm/manifest";
import { matchingEngineManifest } from "@/modules/matching-engine/manifest";
import { lendingManifest } from "@/modules/lending/manifest";
import { stablecoinManifest } from "@/modules/stablecoins/manifest";
import { tokenLaunchManifest } from "@/modules/token-launch/manifest";
import { mevManifest } from "@/modules/mev/manifest";
import { governanceManifest } from "@/modules/governance/manifest";
import { getLocalizedModule, isModuleAvailableForLocale } from "./localization";

describe("module localization protocol", () => {
  it("exposes complete English copies for the foundational English modules", () => {
    expect(isModuleAvailableForLocale(ledgerManifest, "en")).toBe(true);
    expect(isModuleAvailableForLocale(oracleManifest, "en")).toBe(true);
    expect(getLocalizedModule(ledgerManifest, "en").title).toBe("A Ledger Everyone Can Verify");
    expect(getLocalizedModule(ledgerManifest, "en").lessons[0].title).toBe("Who Authorized This Transfer?");
    expect(getLocalizedModule(ledgerManifest, "en").lessons[0].task.misconception).toContain("private key");
    expect(getLocalizedModule(oracleManifest, "en").lessons[0].concepts).toContain("Oracle");
  });

  it("exposes the flagship prediction-market course in English", () => {
    expect(isModuleAvailableForLocale(predictionMarketManifest, "en")).toBe(true);
    expect(getLocalizedModule(predictionMarketManifest, "en").title).toBe("Prediction Markets: How Views Become Prices");
    expect(getLocalizedModule(predictionMarketManifest, "en").lessons[0].title).toBe("Write a Question That Can Settle");
  });

  it("exposes the AMM course and its four English lessons", () => {
    expect(isModuleAvailableForLocale(ammManifest, "en")).toBe(true);
    const localized = getLocalizedModule(ammManifest, "en");
    expect(localized.title).toBe("AMM: Who Quotes Without a Counterparty?");
    expect(localized.lessons).toHaveLength(4);
    expect(localized.lessons[2].task.evidence).toContain("Fees grow pool value");
  });

  it("exposes the matching-engine course and its four English lessons", () => {
    expect(isModuleAvailableForLocale(matchingEngineManifest, "en")).toBe(true);
    const localized = getLocalizedModule(matchingEngineManifest, "en");
    expect(localized.title).toBe("The Millisecond That Matches an Order");
    expect(localized.lessons[1].concepts).toContain("IOC");
    expect(localized.lessons[3].task.evidence).toContain("new sequence");
  });

  it("exposes the lending course and its four English lessons", () => {
    expect(isModuleAvailableForLocale(lendingManifest, "en")).toBe(true);
    const localized = getLocalizedModule(lendingManifest, "en");
    expect(localized.title).toBe("When Does Collateral Get Liquidated?");
    expect(localized.lessons).toHaveLength(4);
    expect(localized.lessons[0].objectives[0]).toContain("collateral value");
    expect(localized.lessons[3].task.evidence).toContain("stale");
  });

  it("exposes the stablecoin course and its four English lessons", () => {
    expect(isModuleAvailableForLocale(stablecoinManifest, "en")).toBe(true);
    const localized = getLocalizedModule(stablecoinManifest, "en");
    expect(localized.title).toBe("How Can a Stablecoin Stay Near One Dollar?");
    expect(localized.lessons).toHaveLength(4);
    expect(localized.lessons[1].concepts).toContain("Overcollateralization");
    expect(localized.lessons[3].task.evidence).toContain("usable reserves");
  });

  it("exposes the token-launch course and its four English lessons", () => {
    expect(isModuleAvailableForLocale(tokenLaunchManifest, "en")).toBe(true);
    const localized = getLocalizedModule(tokenLaunchManifest, "en");
    expect(localized.title).toBe("Who Gets to Change a Token?");
    expect(localized.lessons).toHaveLength(4);
    expect(localized.lessons[0].concepts).toContain("Mint authority");
    expect(localized.lessons[3].task.evidence).toContain("authority");
  });

  it("exposes the MEV course and its four English lessons", () => {
    expect(isModuleAvailableForLocale(mevManifest, "en")).toBe(true);
    const localized = getLocalizedModule(mevManifest, "en");
    expect(localized.title).toBe("Who Gets to Choose the Order?");
    expect(localized.lessons).toHaveLength(4);
    expect(localized.lessons[1].concepts).toContain("Sandwich attack");
    expect(localized.lessons[3].task.evidence).toContain("Private flow");
  });

  it("exposes the governance and treasury course and its four English lessons", () => {
    expect(isModuleAvailableForLocale(governanceManifest, "en")).toBe(true);
    const localized = getLocalizedModule(governanceManifest, "en");
    expect(localized.title).toBe("Who Gets to Change the Protocol?");
    expect(localized.lessons).toHaveLength(4);
    expect(localized.lessons[1].concepts).toContain("Delegation");
    expect(localized.lessons[3].task.evidence).toContain("execution");
  });
});
