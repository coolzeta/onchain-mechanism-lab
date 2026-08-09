import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><span>404 · UNKNOWN STATE</span><h1>这条机制路径还没有开放。</h1><p>返回实验室地图，选择一个已经可以运行的模块。</p><Link className="primary-button" href="/zh">返回机制地图</Link></main>;
}
