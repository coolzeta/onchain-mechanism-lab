import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComplementArbitrageLab } from "./ComplementArbitrageLab";

describe("ComplementArbitrageLab", () => {
  it("distinguishes cheap asks from expensive asks and rich bids", () => {
    render(<ComplementArbitrageLab />);
    expect(screen.getByText("先选一个动作，再看资金怎样闭环")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "同时买入 YES＋NO" }));
    expect(screen.getByText("✓ 判断正确。")).toBeInTheDocument();
    expect(screen.getByText("不到 100，就买齐了所有未来")).toBeInTheDocument();
    expect(screen.getByText(/毛差 7/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "可买价合计 107" }));
    fireEvent.click(screen.getByRole("button", { name: "暂时不交易" }));
    expect(screen.getByText("买齐两边，反而锁定亏损")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "可卖价合计 107" }));
    fireEvent.click(screen.getByRole("button", { name: "抵押 100 拆一套，再同时卖出" }));
    expect(screen.getByText("拆出一套，再把两边同时卖掉")).toBeInTheDocument();
    expect(screen.getByText(/扣除估算成本后净差 5/)).toBeInTheDocument();
  });

  it("shows when execution costs consume the apparent edge", () => {
    const view = render(<ComplementArbitrageLab />);
    fireEvent.change(view.getAllByRole("slider", { name: "费用与执行摩擦" }).at(-1)!, { target: { value: "9" } });
    fireEvent.click(view.getAllByRole("button", { name: "暂时不交易" }).at(-1)!);
    expect(view.getAllByText("看见毛差了，但成本把它吃光了").at(-1)).toBeInTheDocument();
  });
});
