import React, { useCallback, useMemo, useRef, useState } from "react";

const GRID = 20;
const PORT_R = 4;
const BOARD_W = 1200;
const BOARD_H = 700;

const snap = (v) => Math.round(v / GRID) * GRID;
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function manhattanLPath(a, b, prefer = "h") {
  return prefer === "h"
    ? [a.x, a.y, b.x, a.y, b.x, b.y]
    : [a.x, a.y, a.x, b.y, b.x, b.y];
}
function bestOrthogonal(a, b) {
  const pH = manhattanLPath(a, b, "h");
  const pV = manhattanLPath(a, b, "v");
  const len = (p) => Math.abs(p[2] - p[0]) + Math.abs(p[5] - p[1]);
  return len(pH) <= len(pV) ? pH : pV;
}

/** --- 부품 라이브러리 --- */
const LIB = {
  resistor: {
    w: 100,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 0 },
      { id: "B", x: 100, y: 0 },
    ],
    draw: ({ x, y, rot }) => (
      <g transform={`rotate(${rot},${x + 50},${y + 20})`}>
        <line
          x1={x}
          y1={y}
          x2={x + 20}
          y2={y}
          strokeWidth={2}
          stroke="currentColor"
        />
        <polyline
          points={`${x + 20},${y} ${x + 32},${y - 14} ${x + 44},${y + 14} ${
            x + 56
          },${y - 14} ${x + 68},${y + 14} ${x + 80},${y - 14}`}
          fill="none"
          strokeWidth={2}
          stroke="currentColor"
        />
        <line
          x1={x + 80}
          y1={y}
          x2={x + 100}
          y2={y}
          strokeWidth={2}
          stroke="currentColor"
        />
      </g>
    ),
  },
  capacitor: {
    w: 80,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 0 },
      { id: "B", x: 80, y: 0 },
    ],
    draw: ({ x, y, rot }) => (
      <g transform={`rotate(${rot},${x + 40},${y + 20})`}>
        <line
          x1={x}
          y1={y}
          x2={x + 30}
          y2={y}
          strokeWidth={2}
          stroke="currentColor"
        />
        <line
          x1={x + 35}
          y1={y - 15}
          x2={x + 35}
          y2={y + 15}
          strokeWidth={2}
          stroke="currentColor"
        />
        <line
          x1={x + 45}
          y1={y - 15}
          x2={x + 45}
          y2={y + 15}
          strokeWidth={2}
          stroke="currentColor"
        />
        <line
          x1={x + 50}
          y1={y}
          x2={x + 80}
          y2={y}
          strokeWidth={2}
          stroke="currentColor"
        />
      </g>
    ),
  },
  inductor: {
    w: 100,
    h: 40,
    ports: [
      { id: "A", x: 0, y: 0 },
      { id: "B", x: 100, y: 0 },
    ],
    draw: ({ x, y, rot }) => (
      <g transform={`rotate(${rot},${x + 50},${y + 20})`}>
        <line
          x1={x}
          y1={y}
          x2={x + 10}
          y2={y}
          strokeWidth={2}
          stroke="currentColor"
        />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M ${x + 10 + i * 18} ${y} c 0 -10, 18 -10, 18 0 c 0 10, -18 10, -18 0`}
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
          />
        ))}
        <line
          x1={x + 82}
          y1={y}
          x2={x + 100}
          y2={y}
          strokeWidth={2}
          stroke="currentColor"
        />
      </g>
    ),
  },
  vsource: {
    w: 60,
    h: 80,
    ports: [
      { id: "+", x: 30, y: 0 },
      { id: "-", x: 30, y: 80 },
    ],
    draw: ({ x, y, rot }) => {
      const cx = x + 30;
      const cy = y + 40;
      return (
        <g transform={`rotate(${rot},${cx},${cy})`}>
          <line
            x1={cx}
            y1={cy - 40}
            x2={cx}
            y2={cy - 20}
            strokeWidth={2}
            stroke="currentColor"
          />
          <circle
            cx={cx}
            cy={cy}
            r={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          />
          <line
            x1={cx - 6}
            y1={cy}
            x2={cx + 6}
            y2={cy}
            strokeWidth={2}
            stroke="currentColor"
          />
          <line
            x1={cx}
            y1={cy - 6}
            x2={cx}
            y2={cy + 6}
            strokeWidth={2}
            stroke="currentColor"
          />
          <line
            x1={cx}
            y1={cy + 20}
            x2={cx}
            y2={cy + 40}
            strokeWidth={2}
            stroke="currentColor"
          />
        </g>
      );
    },
  },
  ground: {
    w: 40,
    h: 50,
    ports: [{ id: "GND", x: 20, y: 0 }],
    draw: ({ x, y, rot }) => (
      <g transform={`rotate(${rot},${x + 20},${y + 25})`}>
        <line
          x1={x + 20}
          y1={y}
          x2={x + 20}
          y2={y + 15}
          strokeWidth={2}
          stroke="currentColor"
        />
        <line
          x1={x + 8}
          y1={y + 15}
          x2={x + 32}
          y2={y + 15}
          strokeWidth={2}
          stroke="currentColor"
        />
        <line
          x1={x + 10}
          y1={y + 21}
          x2={x + 30}
          y2={y + 21}
          strokeWidth={2}
          stroke="currentColor"
        />
        <line
          x1={x + 12}
          y1={y + 27}
          x2={x + 28}
          y2={y + 27}
          strokeWidth={2}
          stroke="currentColor"
        />
      </g>
    ),
  },
};

function rotatePointAroundCenter(rel, def, rotDeg) {
  const rad = (rotDeg * Math.PI) / 180;
  const cx = def.w / 2,
    cy = def.h / 2;
  const dx = rel.x - cx,
    dy = rel.y - cy;
  return {
    x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
}

function alignOriginForPorts(type, rot, x, y) {
  const def = LIB[type];
  const first = def.ports[0];
  const pr = rotatePointAroundCenter({ x: first.x, y: first.y }, def, rot);
  const wantX = snap(x + pr.x);
  const wantY = snap(y + pr.y);
  const dx = wantX - (x + pr.x);
  const dy = wantY - (y + pr.y);
  return { x: x + dx, y: y + dy };
}

export default function App() {
  const [elements, setElements] = useState([
    { id: uid("R"), type: "resistor", x: 200, y: 160, rot: 0 },
    { id: uid("C"), type: "capacitor", x: 420, y: 160, rot: 0 },
    { id: uid("L"), type: "inductor", x: 640, y: 160, rot: 0 },
    { id: uid("V"), type: "vsource", ...alignOriginForPorts("vsource", 0, 200, 360), rot: 0 },
    { id: uid("G"), type: "ground", x: 640, y: 360, rot: 0 },
  ]);
  const [wires, setWires] = useState([]);
  const [drag, setDrag] = useState(null);
  const [connectFrom, setConnectFrom] = useState(null);
  const [selected, setSelected] = useState([]);
  const [mousePos, setMousePos] = useState(null);
  const [box, setBox] = useState(null);
  const svgRef = useRef(null);

  const onMouseDownPart = (e, el) => {
    e.stopPropagation();
    const pt = clientToSvg(e, svgRef.current);
    if (!selected.includes(el.id)) {
      if (e.shiftKey) {
        setSelected((prev) =>
          prev.includes(el.id) ? prev.filter((x) => x !== el.id) : [...prev, el.id]
        );
      } else setSelected([el.id]);
    }
    const moveIds = selected.includes(el.id) ? [...selected] : [el.id];
    const startPositions = moveIds.map((id) => {
      const found = elements.find((it) => it.id === id);
      return { id, x: found.x, y: found.y, rot: found.rot, type: found.type };
    });
    setDrag({ ids: moveIds, startMouse: pt, startPositions });
  };

  const onMouseDownBoard = (e) => {
    if (e.target !== svgRef.current) return;
    const pt = clientToSvg(e, svgRef.current);
    setBox({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
  };

  const onMouseMove = (e) => {
    const pt = clientToSvg(e, svgRef.current);
    if (connectFrom) setMousePos(pt);
    if (box) {
      setBox((b) => ({ ...b, x2: pt.x, y2: pt.y }));
      return;
    }
    if (!drag) return;
    const dx = snap(pt.x - drag.startMouse.x);
    const dy = snap(pt.y - drag.startMouse.y);
    setElements((els) =>
      els.map((it) => {
        const start = drag.startPositions.find((s) => s.id === it.id);
        if (!start) return it;
        const rawX = start.x + dx;
        const rawY = start.y + dy;
        const aligned = alignOriginForPorts(start.type, start.rot, rawX, rawY);
        return { ...it, x: aligned.x, y: aligned.y };
      })
    );
  };

  const onMouseUp = () => {
    if (box) {
      const x1 = Math.min(box.x1, box.x2);
      const y1 = Math.min(box.y1, box.y2);
      const x2 = Math.max(box.x1, box.x2);
      const y2 = Math.max(box.y1, box.y2);
      const ids = elements
        .filter((el) => el.x >= x1 && el.x <= x2 && el.y >= y1 && el.y <= y2)
        .map((el) => el.id);
      setSelected(ids);
      setBox(null);
      return;
    }
    setDrag(null);
  };

  const handleKey = (e) => {
    if (e.key === "Escape") {
      if (connectFrom) {
        setConnectFrom(null);
        setMousePos(null);
        return;
      }
      setWires((ws) =>
        ws.filter((w) => !selected.includes(w.a.el) && !selected.includes(w.b.el))
      );
      return;
    }
    if (e.key === "Delete") {
      setElements((els) => els.filter((it) => !selected.includes(it.id)));
      setWires((ws) =>
        ws.filter((w) => !selected.includes(w.a.el) && !selected.includes(w.b.el))
      );
      setSelected([]);
      return;
    }
    if (e.key === "r" || e.key === "R") {
      setElements((els) =>
        els.map((it) => {
          if (!selected.includes(it.id)) return it;
          const nextRot = (it.rot + 90) % 360;
          const aligned = alignOriginForPorts(it.type, nextRot, it.x, it.y);
          return { ...it, rot: nextRot, x: aligned.x, y: aligned.y };
        })
      );
    }
  };

  const getEl = useCallback((id) => elements.find((e) => e.id === id), [elements]);

  const handlePortMouseDown = (e, elId, portId) => {
    e.stopPropagation();
    setConnectFrom({ elId, portId });
  };

  const handlePortMouseUp = (e, elId, portId) => {
    e.stopPropagation();
    if (!connectFrom) return;
    if (connectFrom.elId === elId && connectFrom.portId === portId) {
      setConnectFrom(null);
      return;
    }
    setWires((ws) => [
      ...ws,
      {
        id: uid("W"),
        a: { el: connectFrom.elId, portId: connectFrom.portId },
        b: { el: elId, portId },
      },
    ]);
    setConnectFrom(null);
    setMousePos(null);
  };

  const startPosOf = (wireEnd) => {
    const el = getEl(wireEnd.el);
    if (!el) return { x: 0, y: 0 };
    const def = LIB[el.type];
    const p = def.ports.find((pp) => pp.id === wireEnd.portId);
    const rad = (el.rot * Math.PI) / 180;
    const cx = el.x + def.w / 2,
      cy = el.y + def.h / 2;
    const rx =
      cx + (p.x - def.w / 2) * Math.cos(rad) - (p.y - def.h / 2) * Math.sin(rad);
    const ry =
      cy + (p.x - def.w / 2) * Math.sin(rad) + (p.y - def.h / 2) * Math.cos(rad);
    return { x: snap(rx), y: snap(ry) };
  };

  const gridLines = useMemo(() => {
    const lines = [];
    for (let x = 0; x <= BOARD_W; x += GRID)
      lines.push(<line key={`vx${x}`} x1={x} y1={0} x2={x} y2={BOARD_H} stroke="#f0f0f0" />);
    for (let y = 0; y <= BOARD_H; y += GRID)
      lines.push(<line key={`hz${y}`} x1={0} y1={y} x2={BOARD_W} y2={y} stroke="#f0f0f0" />);
    return lines;
  }, []);

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKey}
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        outline: "none",
      }}
    >
      <aside style={{ padding: 12, borderRight: "1px solid #eee" }}>
        <h2>Toolbox</h2>
        <Palette
          onAdd={(type) =>
            setElements((els) => [
              ...els,
              { id: uid(type[0].toUpperCase()), type, x: 200, y: 200, rot: 0 },
            ])
          }
        />
        <p style={{ fontSize: 12, color: "#666" }}>
          Shift+클릭 다중선택<br />
          드래그 박스 선택<br />
          드래그: 선택된 소자 이동<br />
          R: 회전 / Delete: 삭제 / ESC: 연결 해제
        </p>
      </aside>

      <svg
        ref={svgRef}
        width="100%"
        height={BOARD_H}
        viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
        onMouseDown={onMouseDownBoard}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ background: "#fff" }}
      >
        <g>{gridLines}</g>

        {/* wires */}
        {wires.map((w) => {
          const a = startPosOf(w.a);
          const b = startPosOf(w.b);
          const pts = bestOrthogonal(a, b);
          const d = `M ${pts[0]} ${pts[1]} L ${pts[2]} ${pts[3]} L ${pts[4]} ${pts[5]}`;
          return (
            <path
              key={w.id}
              d={d}
              stroke="#111"
              strokeWidth={2}
              fill="none"
              onClick={(e) => {
                e.stopPropagation();
                setWires((ws) => ws.filter((it) => it.id !== w.id));
              }}
            />
          );
        })}

        {/* live wire preview */}
        {connectFrom && mousePos && (() => {
          const a = startPosOf({
            el: connectFrom.elId,
            portId: connectFrom.portId,
          });
          const b = { x: snap(mousePos.x), y: snap(mousePos.y) };
          const pts = bestOrthogonal(a, b);
          const d = `M ${pts[0]} ${pts[1]} L ${pts[2]} ${pts[3]} L ${pts[4]} ${pts[5]}`;
          return <path d={d} stroke="#2b8cff" strokeWidth={2} fill="none" strokeDasharray="6 6" />;
        })()}

        {/* components */}
        {elements.map((el) => (
          <g
            key={el.id}
            style={{
              color: selected.includes(el.id) ? "#2b8cff" : "#111",
              cursor: "grab",
            }}
          >
            {/* ✅ 클릭 편의용 투명 히트박스 */}
            <rect
              x={el.x - 10}
              y={el.y - 10}
              width={LIB[el.type].w + 20}
              height={LIB[el.type].h + 20}
              fill="transparent"
              pointerEvents="all"
              onMouseDown={(e) => onMouseDownPart(e, el)}
            />

            {/* 실제 부품 */}
            {LIB[el.type].draw(el)}

            {/* 포트 */}
            {LIB[el.type].ports.map((p) => {
              const rad = (el.rot * Math.PI) / 180;
              const cx = el.x + LIB[el.type].w / 2,
                cy = el.y + LIB[el.type].h / 2;
              const rx =
                cx +
                (p.x - LIB[el.type].w / 2) * Math.cos(rad) -
                (p.y - LIB[el.type].h / 2) * Math.sin(rad);
              const ry =
                cy +
                (p.x - LIB[el.type].w / 2) * Math.sin(rad) +
                (p.y - LIB[el.type].h / 2) * Math.cos(rad);
              return (
                <circle
                  key={p.id}
                  cx={snap(rx)}
                  cy={snap(ry)}
                  r={PORT_R}
                  fill={
                    connectFrom &&
                    connectFrom.elId === el.id &&
                    connectFrom.portId === p.id
                      ? "#2b8cff"
                      : "#fff"
                  }
                  stroke="#2b8cff"
                  strokeWidth={2}
                  onMouseDown={(e) => handlePortMouseDown(e, el.id, p.id)}
                  onMouseUp={(e) => handlePortMouseUp(e, el.id, p.id)}
                  style={{ cursor: "crosshair" }}
                />
              );
            })}
          </g>
        ))}

        {/* selection box */}
        {box && (
          <rect
            x={Math.min(box.x1, box.x2)}
            y={Math.min(box.y1, box.y2)}
            width={Math.abs(box.x2 - box.x1)}
            height={Math.abs(box.y2 - box.y1)}
            fill="rgba(43,140,255,0.1)"
            stroke="#2b8cff"
            strokeDasharray="4 2"
          />
        )}
      </svg>
    </div>
  );
}

function Palette({ onAdd }) {
  const items = [
    { key: "resistor", label: "Resistor (R)" },
    { key: "capacitor", label: "Capacitor (C)" },
    { key: "inductor", label: "Inductor (L)" },
    { key: "vsource", label: "V Source (DC)" },
    { key: "ground", label: "Ground" },
  ];
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onAdd(it.key)}
          style={{
            textAlign: "left",
            border: "1px solid #ddd",
            background: "#fafafa",
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function clientToSvg(evt, svgEl) {
  const pt = svgEl.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svgEl.getScreenCTM();
  const ipt = pt.matrixTransform(ctm.inverse());
  return { x: ipt.x, y: ipt.y };
}
