"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootPage() {
  const destination = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/zh/`;

  useEffect(() => {
    window.location.replace(destination);
  }, [destination]);

  return (
    <main className="not-found">
      <span>LOADING · 载入中</span>
      <h1>正在打开链上机制实验室。</h1>
      <p>如果页面没有自动跳转，可以直接进入机制地图。</p>
      <Link className="primary-button" href="/zh">进入机制地图 →</Link>
    </main>
  );
}
