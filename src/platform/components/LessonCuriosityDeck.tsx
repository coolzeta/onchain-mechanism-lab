"use client";

import { useState } from "react";
import { getLessonCuriosities } from "@/platform/content/curiosities";
import { useProgressStore } from "@/platform/progress/store";

type CuriosityReaction = "confirmed" | "surprised";

export function LessonCuriosityDeck({ moduleId, lessonId, locale }: { moduleId: string; lessonId: string; locale: string }) {
  const english = locale === "en";
  const curiosities = getLessonCuriosities(moduleId, lessonId, locale);
  const [reactions, setReactions] = useState<Record<string, CuriosityReaction>>({});
  const reviewLesson = useProgressStore((state) => state.reviewLesson);
  if (!curiosities.length) return null;

  const react = (curiosityId: string, reaction: CuriosityReaction) => {
    setReactions((current) => ({ ...current, [curiosityId]: reaction }));
    if (reaction === "surprised") reviewLesson(`${moduleId}:${lessonId}`, "again");
  };

  return <section className="curiosity-deck" aria-label={english ? "Questions before the lesson" : "课前问题"}>
    <header><div><span className="eyebrow">{english ? "BEFORE YOU READ" : "阅读前"}</span><h2>{english ? "Think about these questions first." : "先想一想这几个问题"}</h2></div><p>{english ? "Choose an answer before opening the explanation. You can add anything unexpected to your review list." : "展开答案前，可以先在心里做个判断。与预期不同的内容可以加入复习列表。"}</p></header>
    <div>{curiosities.map((item, index) => {
      const reaction = reactions[item.id];
      return <details key={item.id} name={`${moduleId}-${lessonId}-curiosity`}><summary><span>Q{String(index + 1).padStart(2, "0")}</span><strong>{item.question}</strong><b aria-hidden="true">＋</b></summary><div><span>{english ? "SHORT ANSWER" : "简要回答"}</span><p>{item.answer}</p><div className="curiosity-deck__reaction" aria-label={english ? "Compare the answer with your prediction" : "比较答案和原先判断"}>{reaction ? <p role="status">{reaction === "surprised" ? (english ? "Added to your review list." : "已加入复习列表。") : (english ? "Your prediction matched the explanation." : "你的判断与解释一致。")}</p> : <><small>{english ? "Compared with your prediction:" : "和原先判断相比："}</small><button type="button" onClick={() => react(item.id, "confirmed")}>{english ? "That matches" : "基本一致"}</button><button type="button" onClick={() => react(item.id, "surprised")}>{english ? "That surprised me · review again" : "不太一样 · 加入复习"}</button></>}</div></div></details>;
    })}</div>
  </section>;
}
