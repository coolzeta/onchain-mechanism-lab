import type { Metadata } from "next";
import { ledgerManifest as module } from "@/modules/ledger/manifest";
import { CourseOverview } from "@/platform/components/CourseOverview";
import { courseMetadata } from "@/platform/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return courseMetadata(module, locale);
}

export default async function LedgerOverview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = locale === "en" ? {
    question: "What makes everyone accept one transfer?",
    questionDescription: "We split signatures, nonces, balances, transactions, and blocks into visible state transitions to see why nodes can reject tampering and replay.",
    roles: [
      { avatar: "YOU", label: "Sender: authorize a state change with a key" },
      { avatar: "TO", label: "Receiver: wait for the state to be written" },
      { avatar: "NODE", label: "Node: verify signature, nonce, and balance" },
      { avatar: "BLK", label: "Block: fix transaction order and state root" },
    ],
    outcomes: [
      "What does a signature prove, and why can it not prove a sufficient balance?",
      "How does a nonce stop the same transaction from executing twice?",
      "How do balances and the state root change after a transaction enters a block?",
      "Why are broadcasting, verification, packing, and finality different steps?",
    ],
  } : {
    question: "一笔转账，凭什么被所有人接受？",
    questionDescription: "我们把签名、Nonce、余额、交易和区块拆成连续状态，观察节点为什么能拒绝篡改和重放。",
    roles: [
      { avatar: "你", label: "发送者：用密钥授权状态变化" },
      { avatar: "收", label: "接收者：等待状态被写入" },
      { avatar: "节", label: "节点：验证签名、Nonce 与余额" },
      { avatar: "块", label: "区块：固定交易顺序与状态根" },
    ],
    outcomes: [
      "签名究竟证明了什么，为什么不能证明余额充足？",
      "Nonce 如何阻止同一笔交易被重复执行？",
      "交易进入区块后，余额和状态根如何变化？",
      "为什么广播、验证、打包和最终确认是不同步骤？",
    ],
  };
  return <CourseOverview module={module} locale={locale} content={content} />;
}
