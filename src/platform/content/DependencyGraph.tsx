"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  buildDependencyGraph,
  getDependencyEdgeLabel,
  type DependencyLayout,
  type DependencyNode,
  type DependencyPosition,
} from "./dependency-graph-model";
import { getLocalizedModule, isModuleAvailableForLocale } from "./localization";
import { modules } from "./registry";
import { buildKnowledgeMap, type KnowledgeStatus } from "@/platform/progress/knowledge";
import { useProgressStore } from "@/platform/progress/store";

const statusLabels: Record<KnowledgeStatus, { zh: string; en: string }> = {
  unstarted: { zh: "未开始", en: "Not started" },
  investigating: { zh: "学习中", en: "In progress" },
  "needs-review": { zh: "建议复习", en: "Needs review" },
  verified: { zh: "已完成", en: "Complete" },
};

type PositionMap = Record<string, DependencyPosition>;

interface DragState {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPosition: DependencyPosition;
}

function hrefForModule(locale: string, module: (typeof modules)[number]) {
  return module.status === "available" ? `/${locale}/learn/${module.id}` : `/${locale}/modules/${module.id}`;
}

function positionsFromNodes(nodes: readonly DependencyNode[]): PositionMap {
  return Object.fromEntries(nodes.map((node) => [node.id, { ...node.position }]));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function DependencyGraph({ locale }: { locale: string }) {
  const english = locale === "en";
  const language = english ? "en" : "zh";
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const arrowId = useId().replaceAll(":", "");
  const relatedArrowId = `${arrowId}-related`;
  const [compact, setCompact] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [positionsByLayout, setPositionsByLayout] = useState<Record<DependencyLayout, PositionMap>>({ wide: {}, compact: {} });
  const completedLessons = useProgressStore((state) => state.completedLessons);
  const checkpointAnswers = useProgressStore((state) => state.checkpointAnswers);
  const checkpointAttempts = useProgressStore((state) => state.checkpointAttempts);
  const completedTasks = useProgressStore((state) => state.completedTasks);
  const activeModules = useMemo(
    () => modules.filter((module) => isModuleAvailableForLocale(module, locale)).map((module) => getLocalizedModule(module, locale)),
    [locale],
  );
  const layout: DependencyLayout = compact ? "compact" : "wide";
  const graph = useMemo(() => buildDependencyGraph(activeModules, layout), [activeModules, layout]);
  const map = useMemo(
    () => buildKnowledgeMap(activeModules, { completedLessons, checkpointAnswers, checkpointAttempts, completedTasks }, language),
    [activeModules, checkpointAnswers, checkpointAttempts, completedLessons, completedTasks, language],
  );
  const defaultId = activeModules.find((module) => module.id === "prediction-markets")?.id ?? activeModules[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultId);
  const selected = activeModules.find((module) => module.id === selectedId) ?? activeModules[0];
  const selectedKnowledge = selected ? map.modules.find((module) => module.moduleId === selected.id) : undefined;
  const incoming = selected ? graph.edges.filter((edge) => edge.to === selected.id) : [];
  const outgoing = selected ? graph.edges.filter((edge) => edge.from === selected.id) : [];

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 760px)");
    const updateLayout = () => setCompact(query.matches);
    updateLayout();
    query.addEventListener("change", updateLayout);
    return () => query.removeEventListener("change", updateLayout);
  }, []);

  if (!selected) return null;

  function label(status: KnowledgeStatus) {
    return statusLabels[status][language];
  }

  function moduleById(id: string) {
    return activeModules.find((module) => module.id === id);
  }

  function positionFor(node: DependencyNode) {
    return positionsByLayout[layout][node.id] ?? node.position;
  }

  function bounds() {
    return compact ? { minX: 18, maxX: 82, minY: 7, maxY: 93 } : { minX: 8, maxX: 92, minY: 10, maxY: 90 };
  }

  function updatePosition(id: string, position: DependencyPosition) {
    const { minX, maxX, minY, maxY } = bounds();
    setPositionsByLayout((current) => ({
      ...current,
      [layout]: {
        ...current[layout],
        [id]: {
          x: clamp(position.x, minX, maxX),
          y: clamp(position.y, minY, maxY),
        },
      },
    }));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, node: DependencyNode) {
    if (event.button !== 0) return;
    const position = positionFor(node);
    dragRef.current = {
      id: node.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosition: position,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(node.id);
    setDraggingId(node.id);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    updatePosition(drag.id, {
      x: drag.startPosition.x + ((event.clientX - drag.startClientX) / rect.width) * 100,
      y: drag.startPosition.y + ((event.clientY - drag.startClientY) / rect.height) * 100,
    });
  }

  function finishDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDraggingId(null);
  }

  function handleNodeKeyDown(event: KeyboardEvent<HTMLButtonElement>, node: DependencyNode) {
    const deltas: Partial<Record<string, DependencyPosition>> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    const step = event.shiftKey ? 5 : 2;
    const current = positionFor(node);
    updatePosition(node.id, { x: current.x + delta.x * step, y: current.y + delta.y * step });
    setSelectedId(node.id);
  }

  function resetLayout() {
    setPositionsByLayout((current) => ({ ...current, [layout]: positionsFromNodes(graph.nodes) }));
  }

  return (
    <section className="dependency-graph page-width" id="course-map" aria-label={english ? "Course dependency map" : "课程关系图"}>
      <header className="dependency-graph__header">
        <div>
          <span className="eyebrow">{english ? "COURSE MAP" : "课程图谱"}</span>
          <h2>{english ? `See how ${graph.nodes.length} onchain systems connect` : `先看全貌：${graph.nodes.length} 门课程怎样连在一起`}</h2>
          <p id="dependency-graph-help">{english ? "Drag a course to rearrange the map. Select it to see prerequisites, related courses, and your learning progress. Arrow keys also move a focused node." : "拖动课程可以调整图谱布局；点选课程后，可以查看建议先学的内容、相关课程和当前进度。聚焦节点后也可以用方向键移动。"}</p>
        </div>
        <div className="dependency-graph__controls">
          <span className="dependency-graph__legend"><i className="is-verified" />{english ? "complete" : "已完成"}<i className="is-open" />{english ? "in progress" : "学习中"}</span>
          <button type="button" onClick={resetLayout}>{english ? "Reset layout" : "重置布局"}</button>
        </div>
      </header>
      <div className="dependency-graph__canvas" data-testid="dependency-graph-canvas" onPointerCancel={finishDrag} onPointerMove={handlePointerMove} onPointerUp={finishDrag} ref={canvasRef}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id={arrowId} markerWidth="2.4" markerHeight="2.4" refX="8" refY="5" viewBox="0 0 10 10" orient="auto" markerUnits="userSpaceOnUse"><path className="dependency-graph__arrow" d="M 0 0 L 10 5 L 0 10 z" /></marker>
            <marker id={relatedArrowId} markerWidth="2.8" markerHeight="2.8" refX="8" refY="5" viewBox="0 0 10 10" orient="auto" markerUnits="userSpaceOnUse"><path className="dependency-graph__arrow is-related" d="M 0 0 L 10 5 L 0 10 z" /></marker>
          </defs>
          {graph.edges.map((edge) => {
            const fromNode = graph.nodes.find((node) => node.id === edge.from);
            const toNode = graph.nodes.find((node) => node.id === edge.to);
            if (!fromNode || !toNode) return null;
            const from = positionFor(fromNode);
            const to = positionFor(toNode);
            const related = edge.from === selected.id || edge.to === selected.id;
            return <line className={related ? "is-related" : ""} key={`${edge.from}-${edge.to}`} markerEnd={`url(#${related ? relatedArrowId : arrowId})`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
          })}
        </svg>
        {graph.nodes.map((node) => {
          const item = moduleById(node.id);
          const knowledge = map.modules.find((entry) => entry.moduleId === node.id);
          if (!item || !knowledge) return null;
          const selectedNode = node.id === selected.id;
          const position = positionFor(node);
          const moving = node.id === draggingId;
          const moveLabel = english ? `Move course node: ${item.shortTitle}. Use arrow keys to adjust its position.` : `移动课程节点：${item.shortTitle}。可以用方向键微调位置。`;
          return (
            <button
              aria-describedby="dependency-graph-help"
              aria-label={moveLabel}
              aria-pressed={selectedNode}
              className={`dependency-graph__node is-${knowledge.status} ${selectedNode ? "is-selected" : ""} ${moving ? "is-dragging" : ""}`}
              key={node.id}
              onClick={() => setSelectedId(node.id)}
              onKeyDown={(event) => handleNodeKeyDown(event, node)}
              onPointerDown={(event) => handlePointerDown(event, node)}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              type="button"
            >
              <span className="dependency-graph__node-dot" aria-hidden="true" />
              <strong>{item.id === "rwa" ? "RWA" : item.shortTitle}</strong>
              <small>{knowledge.score}/100 · {label(knowledge.status)}</small>
              <span className="dependency-graph__node-grip" aria-hidden="true">⠿</span>
            </button>
          );
        })}
      </div>
      <div className="dependency-graph__detail">
        <div className="dependency-graph__detail-main">
          <div className="dependency-graph__detail-title"><span className="eyebrow">{selected.id}</span><span className={`dependency-graph__status is-${selectedKnowledge?.status ?? "unstarted"}`}>{label(selectedKnowledge?.status ?? "unstarted")}</span></div>
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
          <Link className="primary-button" href={hrefForModule(locale, selected)}>{selected.status === "available" ? (english ? "View course →" : "查看课程 →") : (english ? "View planned course →" : "查看课程介绍 →")}</Link>
        </div>
        <div className="dependency-graph__relations">
          <div><span className="eyebrow">{english ? "SUGGESTED FIRST" : "建议先学"}</span>{incoming.length ? <ul>{incoming.map((edge) => { const item = moduleById(edge.from); return item ? <li key={edge.from}><button type="button" onClick={() => setSelectedId(edge.from)}><strong>{item.shortTitle}</strong><small>{getDependencyEdgeLabel(edge, language)}</small></button></li> : null; })}</ul> : <p>{english ? "No prerequisite course." : "没有建议的前置课程。"}</p>}</div>
          <div><span className="eyebrow">{english ? "RELATED COURSES" : "后续相关课程"}</span>{outgoing.length ? <ul>{outgoing.map((edge) => { const item = moduleById(edge.to); return item ? <li key={edge.to}><button type="button" onClick={() => setSelectedId(edge.to)}><strong>{item.shortTitle}</strong><small>{getDependencyEdgeLabel(edge, language)}</small></button></li> : null; })}</ul> : <p>{english ? "No later course yet." : "目前没有后续课程。"}</p>}</div>
        </div>
      </div>
    </section>
  );
}
