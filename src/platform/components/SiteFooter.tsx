export function SiteFooter({ locale }: { locale: string }) {
  const english = locale === "en";
  return (
    <footer className="site-footer">
      <div>
        <strong>{english ? "Onchain Mechanism Lab" : "链上机制实验室"}</strong>
        <p>{english ? "Interactive explanations of onchain systems. Educational simulation only; not financial advice." : "用互动示例解释链上系统。本站内容仅用于教育，不构成投资建议。"}</p>
      </div>
      <span>{english ? "11 COURSES · 11 LABS" : "11 门课程 · 11 个实验室"}</span>
    </footer>
  );
}
