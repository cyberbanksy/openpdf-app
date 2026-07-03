import { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import {
  Mic, AlignLeft, X,
  ChevronLeft, ChevronRight,
  Sun, Moon,
} from "lucide-react";

// ─── Palette (warm neutral — no AI blue) ─────────────────────────────────────
const C = {
  bg:        "#0d0c0a",
  surround:  "#131210",
  panel:     "rgba(15,14,12,0.97)",
  text:      "#ddd8d0",
  textMid:   "#68635d",
  textDim:   "#2c2a28",
  accent:    "#c8a870",          // warm amber
  accentDim: "rgba(200,168,112,0.13)",
  border:    "rgba(220,215,205,0.07)",
  borderMed: "rgba(220,215,205,0.12)",
};

// ─── Reading modes ────────────────────────────────────────────────────────────
type ReadMode = "normal" | "dark";

const MODES: Record<ReadMode, {
  bg: string; text: string; line: string;
  divider: string; heading: string; footerText: string;
}> = {
  normal: { bg:"#f7f4ef", text:"#1a1814", line:"#cbc6be", divider:"#e0dbd2", heading:"#111111", footerText:"#beb8b0" },
  dark:   { bg:"#1c1a18", text:"#c4beb4", line:"#363330", divider:"#2c2926", heading:"#d8d2c8", footerText:"#504c48" },
};

const MODE_ORDER: ReadMode[] = ["normal", "dark"];
const MODE_ICONS: Record<ReadMode, React.ReactNode> = {
  normal: <Sun  size={14} />,
  dark:   <Moon size={14} />,
};
const MODE_LABELS: Record<ReadMode, string> = {
  normal: "Normal",
  dark:   "Dark",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const TOTAL_PAGES = 12;
const DOC_TITLE   = "Spatial Computing Design Principles";
const DOC_AUTHOR  = "Vantage Research Institute · 2024";
const BASE_W      = 680;
const A4          = 297 / 210;
const TOOLBAR_H   = 52;
const PAGE_GAP    = 0;       // pages flush — continuous scroll feel
const ZOOM_FACTOR = 2.2;

interface Fig      { color: string; ratio: number; }
interface PageMeta { heading: string; lines: number[]; fig?: Fig; }

const PAGE_META: Record<number, PageMeta> = {
  1:  { heading:"Abstract",                              lines:[82,94,71,87,85,91,62,80,76,89,83,94,57,75,79,90] },
  2:  { heading:"1. Introduction to Spatial Interfaces", lines:[89,94,73,85,81,92,66,80,79,91,71,85,83,94], fig:{color:"#3a5568",ratio:2.8} },
  3:  { heading:"2. Depth Perception & Ocular Fatigue",  lines:[76,91,83,94,69,80,81,92,73,87,86,94,71,82,79,90] },
  4:  { heading:"3. Panel Layout Geometry",              lines:[91,94,76,87,83,92,69,80,79,91,73,85,86,94], fig:{color:"#5c4a38",ratio:2.2} },
  5:  { heading:"4. Typographic Legibility in VR",       lines:[81,92,71,85,86,94,76,87,69,82,83,92,73,87,79,91] },
  6:  { heading:"5. Interaction Primitives",             lines:[86,94,73,87,79,91,81,92,69,80,83,92,76,87], fig:{color:"#3a5448",ratio:3.2} },
  7:  { heading:"6. Environmental Contrast",             lines:[71,87,83,94,76,90,81,92,69,80,79,91,73,85,86,94,66,78] },
  8:  { heading:"7. Gaze-Based Navigation",              lines:[81,92,76,87,83,94,71,85,79,91,69,80,86,94], fig:{color:"#4a3d58",ratio:2.5} },
  9:  { heading:"8. Multi-Document Workspaces",          lines:[83,94,71,87,79,91,76,90,81,92,69,80,73,85,86,94] },
  10: { heading:"9. Haptic Feedback Patterns",           lines:[76,87,83,94,71,85,81,92,79,91,69,80,86,94,73,87] },
  11: { heading:"10. Accessibility in Immersive Readers",lines:[81,92,71,87,86,94,76,90,79,91,83,94,69,80], fig:{color:"#583d3d",ratio:2.0} },
  12: { heading:"References",                            lines:[83,73,79,76,81,71,83,73,79,76,81,71,83,76] },
};

const TOC_ITEMS = [
  {page:1,label:"Abstract"},{page:2,label:"1. Introduction"},{page:3,label:"2. Depth Perception"},
  {page:4,label:"3. Panel Layout"},{page:5,label:"4. Typography"},{page:6,label:"5. Interaction"},
  {page:7,label:"6. Environmental Contrast"},{page:8,label:"7. Gaze Navigation"},
  {page:9,label:"8. Multi-Document"},{page:10,label:"9. Haptic Feedback"},
  {page:11,label:"10. Accessibility"},{page:12,label:"References"},
];

// ─── Corner marks ─────────────────────────────────────────────────────────────
function Corners({ size=12, color="rgba(200,168,112,0.3)" }: { size?:number; color?:string }) {
  const s=`${size}px`, b=`1px solid ${color}`;
  const base: React.CSSProperties = { position:"absolute", width:s, height:s };
  return (<>
    <div style={{...base,top:0,left:0,borderTop:b,borderLeft:b}} />
    <div style={{...base,top:0,right:0,borderTop:b,borderRight:b}} />
    <div style={{...base,bottom:0,left:0,borderBottom:b,borderLeft:b}} />
    <div style={{...base,bottom:0,right:0,borderBottom:b,borderRight:b}} />
  </>);
}

// ─── Figure ───────────────────────────────────────────────────────────────────
function Figure({
  fig, label, pageWidth, readMode, onLightbox,
}: { fig:Fig; label:string; pageWidth:number; readMode:ReadMode; onLightbox:()=>void }) {
  const [hov, setHov] = useState(false);
  const lastTap = useRef(0);
  const figH = pageWidth / fig.ratio;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 380) { onLightbox(); lastTap.current = 0; }
    else lastTap.current = now;
  };

  const overlay = readMode === "dark" ? "rgba(0,0,0,0.35)" : "transparent";

  return (
    <div style={{ position:"relative", margin:"14px 0", zIndex: hov ? 4 : 1 }}>
      {hov && (
        <div style={{
          position:"absolute", inset:"-18px",
          background: readMode === "dark" ? "rgba(20,18,16,0.5)" : "rgba(248,245,240,0.5)",
          backdropFilter:"blur(4px)", borderRadius:"6px",
          zIndex:-1, pointerEvents:"none",
        }} />
      )}
      <div
        data-figure="true"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={handleClick}
        style={{
          width:"100%", height:`${figH}px`, position:"relative", overflow:"hidden",
          background: fig.color, borderRadius:"3px",
          cursor: hov ? "zoom-in" : "default",
          transform: hov ? "scale(1.016) translateY(-2px)" : "scale(1) translateY(0px)",
          transition:"transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s",
          boxShadow: hov ? "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)" : "0 2px 8px rgba(0,0,0,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
      >
        {/* dark mode overlay */}
        {readMode === "dark" && (
          <div style={{ position:"absolute", inset:0, background: overlay, pointerEvents:"none" }} />
        )}
        <span style={{
          fontFamily:"'DM Mono',monospace", fontSize:"10px", letterSpacing:"0.22em",
          textTransform:"uppercase", color:"rgba(255,255,255,0.3)",
          opacity: hov ? 0.65 : 0.3, transition:"opacity 0.2s", position:"relative",
        }}>
          {label}
        </span>
        {hov && (
          <div style={{ position:"absolute", bottom:"8px", right:"10px", fontFamily:"'DM Mono',monospace", fontSize:"8px", color:"rgba(255,255,255,0.22)", letterSpacing:"0.1em" }}>
            double-click to expand
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
interface LbFig { color: string; ratio: number; label: string; }

function Lightbox({ fig, onClose }: { fig:LbFig; onClose:()=>void }) {
  const vw = window.innerWidth, vh = window.innerHeight, pad = 48;
  const maxW = vw - pad * 2, maxH = vh - pad * 2;
  const w = Math.min(maxW, maxH * fig.ratio);
  const h = w / fig.ratio;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    // Double-click on backdrop to close
    <div
      onDoubleClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(8,7,5,0.97)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", animation:"lbIn 0.18s ease", cursor:"zoom-out" }}
    >
      {/* X button — single click */}
      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        onDoubleClick={e => e.stopPropagation()}
        style={{ position:"absolute", top:"20px", right:"20px", width:"32px", height:"32px", borderRadius:"50%", background:"rgba(220,215,205,0.08)", border:`1px solid ${C.borderMed}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: C.text, transition:"background 0.14s", zIndex:1 }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(220,215,205,0.15)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(220,215,205,0.08)")}
      >
        <X size={14} />
      </button>

      {/* Figure — double-click also closes */}
      <div
        onDoubleClick={onClose}
        style={{
          width:`${w}px`, height:`${h}px`, background: fig.color, borderRadius:"4px",
          position:"relative", overflow:"hidden", cursor:"zoom-out",
          boxShadow:`0 0 0 1px rgba(220,215,205,0.12), 0 48px 120px rgba(0,0,0,0.85)`,
          animation:"lbPop 0.22s cubic-bezier(0.34,1.2,0.64,1)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
      >
        <Corners size={18} color="rgba(255,255,255,0.2)" />
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", pointerEvents:"none" }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"12px", letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)" }}>
            {fig.label}
          </span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", letterSpacing:"0.14em", color:"rgba(255,255,255,0.14)" }}>
            {Math.round(w)} × {Math.round(h)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Document Page ────────────────────────────────────────────────────────────
function DocumentPage({
  page, widthPx, appeared, readMode, onLightbox,
}: {
  page:number; widthPx:number; appeared:boolean; readMode:ReadMode; onLightbox:(f:LbFig)=>void;
}) {
  const meta  = PAGE_META[page] ?? PAGE_META[1];
  const m     = MODES[readMode];
  const scale = widthPx / BASE_W;
  const h     = widthPx * A4;

  return (
    <div style={{
      width:`${widthPx}px`, height:`${h}px`, background: m.bg,
      position:"relative", overflow:"hidden",
      boxShadow: readMode === "dark"
        ? "0 2px 0 rgba(0,0,0,0.2), 0 8px 40px rgba(0,0,0,0.7), 0 40px 100px rgba(0,0,0,0.5)"
        : "0 2px 0 rgba(0,0,0,0.08), 0 8px 40px rgba(0,0,0,0.45), 0 40px 100px rgba(0,0,0,0.28)",
      fontFamily:"'Barlow',sans-serif", color: m.text,
      opacity: appeared ? 1 : 0,
      transform: appeared ? "translateY(0)" : "translateY(28px)",
      transition:"opacity 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1), background 0.4s ease",
      flexShrink:0,
    }}>
      <Corners size={Math.round(10 * scale)} color={readMode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)"} />

      <div style={{ position:"absolute", inset:0, padding:`${68*scale}px ${78*scale}px ${56*scale}px`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Cover */}
        {page === 1 && (
          <div style={{ borderBottom:`1px solid ${m.divider}`, paddingBottom:`${22*scale}px`, marginBottom:`${22*scale}px` }}>
            <div style={{ fontSize:`${8*scale}px`, fontFamily:"'DM Mono',monospace", letterSpacing:"0.18em", textTransform:"uppercase", color: m.footerText, marginBottom:`${12*scale}px` }}>
              Technical Report · VRI-2024-09
            </div>
            <div style={{ fontSize:`${22*scale}px`, fontWeight:600, lineHeight:1.22, color: m.heading, marginBottom:`${10*scale}px` }}>
              {DOC_TITLE}
            </div>
            <div style={{ fontSize:`${10*scale}px`, color: m.footerText }}>{DOC_AUTHOR}</div>
          </div>
        )}

        <div style={{ fontSize:`${12*scale}px`, fontWeight:600, color: m.heading, borderBottom:`1px solid ${m.divider}`, paddingBottom:`${9*scale}px`, marginBottom:`${15*scale}px`, flexShrink:0 }}>
          {meta.heading}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:`${8*scale}px`, flexShrink:0 }}>
          {meta.lines.slice(0,9).map((w,i) => (
            <div key={i} style={{ height:`${8*scale}px`, width:`${w}%`, background: m.line, borderRadius:`${2*scale}px`, opacity:0.5+(i%4)*0.07 }} />
          ))}
        </div>

        {meta.fig && (
          <Figure
            fig={meta.fig}
            label={`Figure ${Math.ceil(page/2)}`}
            pageWidth={widthPx}
            readMode={readMode}
            onLightbox={() => onLightbox({ color:meta.fig!.color, ratio:meta.fig!.ratio, label:`Figure ${Math.ceil(page/2)} — ${meta.heading}` })}
          />
        )}

        {meta.fig && meta.lines.length > 9 && (
          <div style={{ display:"flex", flexDirection:"column", gap:`${8*scale}px`, flexShrink:0 }}>
            {meta.lines.slice(9).map((w,i) => (
              <div key={i} style={{ height:`${8*scale}px`, width:`${w}%`, background: m.line, borderRadius:`${2*scale}px`, opacity:0.44 }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:`${9*scale}px ${78*scale}px`, borderTop:`1px solid ${m.divider}`, display:"flex", justifyContent:"space-between", alignItems:"center", background: m.bg }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:`${7*scale}px`, letterSpacing:"0.14em", color: m.footerText, textTransform:"uppercase" }}>
          {DOC_TITLE.substring(0,26)}
        </span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:`${8*scale}px`, color: m.footerText }}>{page}</span>
      </div>
    </div>
  );
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
function Thumb({ page, current, readMode, onSelect }: { page:number; current:boolean; readMode:ReadMode; onSelect:()=>void }) {
  const meta = PAGE_META[page];
  const m    = MODES[readMode];
  return (
    <button onClick={onSelect} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", background:"none", border:"none", cursor:"pointer", padding:"2px 0", width:"100%" }}>
      <div style={{
        width:"58px", height:"80px", background: m.bg, borderRadius:"2px", overflow:"hidden",
        border: current ? `1.5px solid ${C.accent}` : "1.5px solid transparent",
        boxShadow: current ? `0 0 0 1px ${C.accentDim}, 0 2px 10px rgba(0,0,0,0.5)` : "0 1px 4px rgba(0,0,0,0.4)",
        transition:"border-color 0.12s, box-shadow 0.12s", padding:"4px",
        display:"flex", flexDirection:"column", gap:"2px",
      }}>
        <div style={{ height:"3px", width:"72%", background: m.line, borderRadius:"1px" }} />
        {[68,82,62,78,72,88,58,74].map((w,i)=>(
          <div key={i} style={{ height:"2px", width:`${w}%`, background: m.line, borderRadius:"1px", opacity:0.6 }} />
        ))}
        {meta?.fig && <div style={{ height:"12px", background:meta.fig.color, borderRadius:"1px", marginTop:"2px", opacity:0.75 }} />}
      </div>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:current?C.accent:C.textDim, transition:"color 0.12s", lineHeight:1 }}>
        {page}
      </span>
    </button>
  );
}

// ─── Scrub preview ────────────────────────────────────────────────────────────
function ScrubPreview({ page, visible, readMode }: { page:number; visible:boolean; readMode:ReadMode }) {
  const meta = PAGE_META[page] ?? PAGE_META[1];
  const m    = MODES[readMode];
  return (
    <div style={{ position:"fixed", right:"20px", top:"50%", transform:"translateY(-50%)", zIndex:50, pointerEvents:"none", opacity:visible?1:0, transition:"opacity 0.18s" }}>
      <div style={{ background:C.panel, border:`1px solid ${C.borderMed}`, borderRadius:"12px", backdropFilter:"blur(20px)", padding:"16px 18px", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", boxShadow:`0 8px 48px rgba(0,0,0,0.8), 0 0 0 1px ${C.accentDim}`, position:"relative" }}>
        <Corners size={10} color={C.accent} />
        <div style={{ width:"52px", height:"72px", background:m.bg, borderRadius:"2px", padding:"4px", display:"flex", flexDirection:"column", gap:"2px", boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }}>
          <div style={{ height:"3px", width:"70%", background:m.line, borderRadius:"1px" }} />
          {[70,85,62,78,68,82,55].map((w,i)=>(
            <div key={i} style={{ height:"2px", width:`${w}%`, background:m.line, borderRadius:"1px", opacity:0.6 }} />
          ))}
          {meta.fig && <div style={{ height:"12px", background:meta.fig.color, borderRadius:"1px", marginTop:"2px", opacity:0.75 }} />}
        </div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"22px", fontWeight:500, color:C.text, lineHeight:1 }}>{page}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:C.textMid }}>/ {TOTAL_PAGES}</div>
        <div style={{ width:"52px", height:"2px", background:"rgba(200,168,112,0.1)", borderRadius:"1px", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${(page/TOTAL_PAGES)*100}%`, background:C.accent, borderRadius:"1px", transition:"width 0.1s" }} />
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage, setCurrentPage]   = useState(1);
  const [loadedPages,  setLoadedPages]  = useState(1);
  const [appearedSet,  setAppearedSet]  = useState(new Set<number>([1]));
  const [lightbox,     setLightbox]     = useState<LbFig | null>(null);
  const [thumbsOpen,   setThumbsOpen]   = useState(false);
  const [showToc,      setShowToc]      = useState(false);
  const [listening,    setListening]    = useState(false);
  const [ctrlHover,    setCtrlHover]    = useState(false);
  const [scrubbing,    setScrubbing]    = useState(false);
  const [scrubPage,    setScrubPage]    = useState(1);
  const [zoomedIn,     setZoomedIn]     = useState(false);        // extra magnify via double-tap
  const [viewMode,     setViewMode]     = useState<"fit" | "full">("full"); // base view
  const [readMode,     setReadMode]     = useState<ReadMode>("normal");
  const [scrollActive, setScrollActive] = useState(false);
  const [navVisible,   setNavVisible]   = useState(true);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const [dims, setDims] = useState({ w:0, h:0 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setDims({ w:width, h:height });
    });
    ro.observe(el);
    setDims({ w:el.clientWidth, h:el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Base view: "full" = fill width, "fit" = whole page visible on screen.
  // Double-tap adds an extra magnification (zoomedIn) on top of the base.
  const fitPageW    = dims.w > 0 ? Math.min(dims.w, dims.h / A4) : 0;
  const fullPageW   = dims.w;
  const basePageW   = viewMode === "full" ? fullPageW : fitPageW;
  const pageWidth   = zoomedIn ? basePageW * ZOOM_FACTOR : basePageW;
  const slotH       = (w: number) => w * A4 + PAGE_GAP + 28;

  // Lazy load
  useEffect(() => {
    const sentinel = sentinelRef.current, root = scrollRef.current;
    if (!sentinel || !root || loadedPages >= TOTAL_PAGES) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setLoadedPages(p => Math.min(TOTAL_PAGES, p + 1)); },
      { root, threshold:0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadedPages]);

  // Appear animation
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || dims.w === 0) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          const p = parseInt(e.target.getAttribute("data-page") ?? "0");
          if (p) setAppearedSet(prev => new Set([...prev, p]));
        }
      }),
      { root, threshold:0.03 }
    );
    pageRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, [loadedPages, dims.w]);

  // Current page
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        let best = { ratio:0, page:currentPage };
        entries.forEach(e => {
          if (e.intersectionRatio > best.ratio)
            best = { ratio:e.intersectionRatio, page:parseInt(e.target.getAttribute("data-page") ?? "1") };
        });
        if (best.ratio > 0) setCurrentPage(best.page);
      },
      { root, threshold:[0,0.25,0.5,0.75,1] }
    );
    pageRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, [loadedPages, dims.w]);

  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTop   = useRef(0);
  const onScroll = useCallback(() => {
    const st = scrollRef.current?.scrollTop ?? 0;

    // Reset lazy-loaded pages when back at top
    if (st < 60) setLoadedPages(1);

    // Nav: show when near top or scrolling back up, hide when scrolling down
    const atTop = st < 80;
    const scrollingUp = st < lastScrollTop.current;
    setNavVisible(atTop || scrollingUp);
    lastScrollTop.current = st;

    // Scroll rail
    setScrollActive(true);
    if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current);
    scrollIdleTimer.current = setTimeout(() => setScrollActive(false), 900);
  }, []);

  const scrollToPage = useCallback((p: number) => {
    setLoadedPages(prev => Math.max(prev, p));
    setTimeout(() => pageRefs.current[p-1]?.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  }, []);

  // Double-tap zoom — cursor-anchored, synchronous DOM commit via flushSync
  const handleDocDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-figure]")) return;
    const el     = scrollRef.current!;
    const rect   = el.getBoundingClientRect();
    const vw     = rect.width;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Snapshot current layout BEFORE any state change
    const preScrollLeft = el.scrollLeft;
    const preScrollTop  = el.scrollTop;
    const prePageW      = pageWidth;                               // current rendered width
    const preCenterOff  = Math.max(0, (vw - prePageW) / 2);      // flex centering offset

    // Cursor position in page-content space (pre-zoom)
    const pageX = preScrollLeft + mouseX - preCenterOff;
    const pageY = preScrollTop  + mouseY;

    const going = !zoomedIn;

    // flushSync forces React to commit the new pageWidth to the DOM synchronously
    // so we can immediately read the new layout and set scroll correctly.
    flushSync(() => setZoomedIn(going));

    const postPageW     = going ? basePageW * ZOOM_FACTOR : basePageW;
    const postCenterOff = Math.max(0, (vw - postPageW) / 2);
    const factor        = going ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;

    // Scroll so the same page-content point stays under the cursor
    el.scrollLeft = Math.max(0, pageX * factor + postCenterOff - mouseX);
    el.scrollTop  = Math.max(0, pageY * factor - mouseY);
  }, [zoomedIn, pageWidth, basePageW]);

  // Hold + drag scrub
  const holdTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef      = useRef<{ y:number; page:number } | null>(null);
  const isScrubRef   = useRef(false);
  const liveScrubRef = useRef(1);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const sy = e.clientY, sp = currentPage;
    holdTimer.current = setTimeout(() => {
      isScrubRef.current = true;
      dragRef.current = { y:sy, page:sp };
      liveScrubRef.current = sp;
      setScrubbing(true);
      setScrubPage(sp);
      document.body.style.userSelect = "none";
      document.body.style.cursor     = "ns-resize";
    }, 280);
  }, [currentPage]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isScrubRef.current || !dragRef.current) return;
      const target = Math.max(1, Math.min(TOTAL_PAGES, dragRef.current.page + Math.round((dragRef.current.y - e.clientY) / 55)));
      liveScrubRef.current = target;
      setScrubPage(target);
    };
    const onUp = () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (isScrubRef.current) {
        scrollToPage(liveScrubRef.current);
        setScrubbing(false);
        isScrubRef.current = false;
        dragRef.current    = null;
        document.body.style.userSelect = "";
        document.body.style.cursor     = "";
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [scrollToPage]);

  const cycleMode = useCallback(() => {
    setReadMode(m => MODE_ORDER[(MODE_ORDER.indexOf(m) + 1) % MODE_ORDER.length]);
  }, []);

  // Voice search stub — auto "listens" for a few seconds then stops
  const toggleListen = useCallback(() => {
    setListening(v => {
      if (v) return false;
      setTimeout(() => setListening(false), 4000);
      return true;
    });
  }, []);

  // Surround color transitions with reading mode
  const surroundBg = readMode === "dark" ? "#111010" : C.surround;

  return (
    <div style={{ width:"100%", height:"100%", background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"'Barlow',sans-serif", position:"relative" }}>
      <style>{`
        @keyframes lbIn  { from{opacity:0} to{opacity:1} }
        @keyframes lbPop { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes vw    { 0%,100%{height:6px} 50%{height:18px} }
        * { scrollbar-width:none }
        *::-webkit-scrollbar { display:none }
      `}</style>

      {/* ── Toolbar ─────────────────────────────── */}
      <div style={{
        height:`${TOOLBAR_H}px`, display:"flex", alignItems:"center", gap:"14px", padding:"0 18px",
        background:"rgba(13,12,10,0.72)", borderBottom:`1px solid ${C.border}`,
        backdropFilter:"blur(24px) saturate(1.4)", WebkitBackdropFilter:"blur(24px) saturate(1.4)",
        flexShrink:0, zIndex:30,
        transform: navVisible ? "translateY(0)" : `translateY(-${TOOLBAR_H}px)`,
        opacity: navVisible ? 1 : 0,
        transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease",
        marginBottom: navVisible ? 0 : `-${TOOLBAR_H}px`,
      }}>

        {/* Document title — editorial, filename-style */}
        <div style={{ display:"flex", alignItems:"center", gap:"11px", flex:1, minWidth:0 }}>
          <FileGlyph />
          <div style={{ display:"flex", alignItems:"baseline", gap:"8px", minWidth:0 }}>
            <span style={{ fontSize:"14px", fontWeight:500, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.01em" }}>
              {DOC_TITLE}
            </span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:C.textDim, flexShrink:0, textTransform:"uppercase", letterSpacing:"0.08em" }}>
              pdf
            </span>
          </div>
        </div>

        {/* Segmented control cluster */}
        <div style={{ display:"flex", alignItems:"center", gap:"4px", background:"rgba(220,215,205,0.04)", border:`1px solid ${C.border}`, borderRadius:"11px", padding:"3px" }}>
          {/* Voice search */}
          <PillBtn
            icon={<Mic size={15} />}
            active={listening}
            onClick={toggleListen}
            title="Voice search"
            pulse={listening}
          />
          {/* Contents */}
          <PillBtn
            icon={<AlignLeft size={15} />}
            active={showToc}
            onClick={() => setShowToc(v => !v)}
            title="Contents"
          />
          {/* Reading mode */}
          <PillBtn
            icon={MODE_ICONS[readMode]}
            active={readMode !== "normal"}
            onClick={cycleMode}
            title={`Reading mode: ${MODE_LABELS[readMode]}`}
          />
        </div>
      </div>

      {/* Voice listening banner */}
      {listening && (
        <div style={{
          position:"absolute", top:`${TOOLBAR_H + 12}px`, left:"50%", transform:"translateX(-50%)",
          zIndex:40, display:"flex", alignItems:"center", gap:"12px",
          background:C.panel, border:`1px solid ${C.accent}44`, borderRadius:"14px",
          padding:"12px 20px", backdropFilter:"blur(24px)",
          boxShadow:`0 12px 40px rgba(0,0,0,0.6), 0 0 0 4px ${C.accentDim}`,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"3px", height:"20px" }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width:"3px", borderRadius:"2px", background:C.accent,
                animation:`vw 0.9s ease-in-out ${i*0.12}s infinite`,
              }} />
            ))}
          </div>
          <span style={{ fontSize:"13px", color:C.text, fontWeight:500 }}>Listening…</span>
          <span style={{ fontSize:"11px", color:C.textMid }}>say a word or phrase to find it</span>
          <button onClick={() => setListening(false)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", padding:0, marginLeft:"4px" }}>
            <X size={14} style={{ color:C.textMid }} />
          </button>
        </div>
      )}

      {/* ── Body ────────────────────────────────── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative" }}>

        {/* TOC */}
        <div style={{ width:showToc?"188px":"0px", overflow:"hidden", transition:"width 0.2s cubic-bezier(0.4,0,0.2,1)", flexShrink:0, background:"rgba(12,11,9,0.99)", borderRight:showToc?`1px solid ${C.border}`:"none" }}>
          <div style={{ padding:"12px 0", overflowY:"auto", height:"100%" }}>
            <div style={{ padding:"0 14px 8px", fontSize:"9px", fontFamily:"'DM Mono',monospace", letterSpacing:"0.15em", textTransform:"uppercase", color:C.textDim }}>Contents</div>
            {TOC_ITEMS.map(item => (
              <button key={item.page} onClick={() => scrollToPage(item.page)} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", padding:"6px 14px",
                background:item.page===currentPage?C.accentDim:"none", border:"none",
                borderLeft:item.page===currentPage?`2px solid ${C.accent}`:"2px solid transparent",
                cursor:"pointer", textAlign:"left", gap:"8px", transition:"background 0.1s",
              }}
                onMouseEnter={e => { if(item.page!==currentPage)(e.currentTarget as HTMLElement).style.background="rgba(220,215,205,0.04)"; }}
                onMouseLeave={e => { if(item.page!==currentPage)(e.currentTarget as HTMLElement).style.background="none"; }}
              >
                <span style={{ fontSize:"12px", color:item.page===currentPage?C.accent:C.textMid, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:item.page===currentPage?C.accent:C.textDim, flexShrink:0 }}>{item.page}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onMouseDown={onMouseDown}
          onDoubleClick={handleDocDoubleClick}
          style={{
            flex:1, overflowY:"auto", overflowX: zoomedIn ? "auto" : "hidden",
            background:surroundBg, transition:"background 0.4s ease",
            display:"flex", flexDirection:"column", alignItems:"center", gap:`${PAGE_GAP}px`,
            padding:0,
            position:"relative", cursor: scrubbing ? "ns-resize" : (zoomedIn ? "zoom-out" : "zoom-in"),
          }}
        >
          {dims.w > 0 && Array.from({ length:loadedPages }, (_,i) => i+1).map(p => (
            <div
              key={p}
              ref={el => { pageRefs.current[p-1] = el; }}
              data-page={String(p)}
              style={{ position:"relative", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center" }}
            >
              <DocumentPage
                page={p} widthPx={pageWidth} appeared={appearedSet.has(p)}
                readMode={readMode} onLightbox={setLightbox}
              />
            </div>
          ))}

          {loadedPages < TOTAL_PAGES && <div ref={sentinelRef} style={{ height:"1px", width:"100%", flexShrink:0 }} />}
          {loadedPages >= TOTAL_PAGES && (
            <div style={{ height:"40px", flexShrink:0 }} />
          )}
        </div>

      </div>

      <ScrubPreview page={scrubPage} visible={scrubbing} readMode={readMode} />

      {/* ── Scroll pop-up rail + hover thumbnail panel ── */}
      {TOTAL_PAGES > 1 && (
        <div
          onMouseEnter={() => setThumbsOpen(true)}
          onMouseLeave={() => setThumbsOpen(false)}
          style={{
            position:"absolute", right:"16px", top:"50%", transform:"translateY(-50%)",
            zIndex:25, display:"flex", flexDirection:"row", alignItems:"center", gap:"10px",
            pointerEvents:"auto",
            // visible while scrolling OR while hovered
            opacity: (scrollActive && !scrubbing) || thumbsOpen ? 1 : 0,
            transition:"opacity 0.25s",
          }}
        >
          {/* Thumbnail panel — slides in to the left of the dot rail on hover */}
          <div style={{
            width: thumbsOpen ? "108px" : "0px", overflow:"hidden",
            transition:"width 0.22s cubic-bezier(0.4,0,0.2,1)",
            maxHeight:"70vh",
          }}>
            <div style={{
              opacity: thumbsOpen ? 1 : 0, transition:"opacity 0.16s",
              width:"108px", maxHeight:"70vh",
              background:"rgba(16,14,11,0.88)", border:`1px solid ${C.borderMed}`,
              borderRadius:"14px", backdropFilter:"blur(24px) saturate(1.4)",
              WebkitBackdropFilter:"blur(24px) saturate(1.4)",
              boxShadow:"-8px 8px 48px rgba(0,0,0,0.55)",
              padding:"12px 0", display:"flex", flexDirection:"column",
            }}>
              <div style={{ padding:"0 12px 8px", fontSize:"11px", fontWeight:600, color:C.text, flexShrink:0 }}>Pages</div>
              <div style={{ overflowY:"auto", padding:"0 10px", display:"flex", flexDirection:"column", gap:"6px", flex:1 }}>
                {Array.from({ length:TOTAL_PAGES }, (_,i) => i+1).map(p => (
                  <Thumb key={p} page={p} current={p===currentPage} readMode={readMode} onSelect={() => scrollToPage(p)} />
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge + dots */}
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:"10px",
            background:C.panel, border:`1px solid ${C.borderMed}`,
            borderRadius:"14px", padding:"10px 8px",
            backdropFilter:"blur(20px)", boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"1px" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"13px", fontWeight:500, color:C.accent, lineHeight:1 }}>
                {String(currentPage).padStart(2,"0")}
              </span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:C.textMid, lineHeight:1 }}>
                /{TOTAL_PAGES}
              </span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"5px", alignItems:"center" }}>
              {Array.from({ length:TOTAL_PAGES }, (_,i) => i+1).map(p => {
                const isCur  = p === currentPage;
                const loaded = p <= loadedPages;
                return (
                  <button key={p} onClick={() => scrollToPage(p)} title={`Page ${p}`} style={{
                    width: isCur ? "8px" : "5px", height: isCur ? "8px" : "5px",
                    borderRadius:"50%", border:"none", padding:0,
                    cursor:"pointer", flexShrink:0,
                    background: isCur ? C.accent : loaded ? "rgba(220,215,205,0.3)" : "rgba(220,215,205,0.1)",
                    transition:"all 0.18s",
                  }} />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div
        onMouseEnter={() => setCtrlHover(true)}
        onMouseLeave={() => setCtrlHover(false)}
        style={{ position:"absolute", bottom:"18px", left:"50%", transform:"translateX(-50%)", zIndex:30, pointerEvents:"auto" }}
      >
        {/* Resting hint */}
        <div style={{ display:"flex", alignItems:"center", gap:"5px", justifyContent:"center", opacity:ctrlHover?0:0.6, transition:"opacity 0.2s", position:"absolute", bottom:"4px", left:"50%", transform:"translateX(-50%)", pointerEvents:"none", whiteSpace:"nowrap" }}>
          <div style={{ width:"28px", height:"4px", borderRadius:"2px", background:"rgba(220,215,205,0.25)" }} />
        </div>
        {/* Expanded pill */}
        <div style={{
          opacity:ctrlHover?1:0, transform:ctrlHover?"translateY(0) scale(1)":"translateY(8px) scale(0.96)",
          transition:"opacity 0.2s, transform 0.22s cubic-bezier(0.34,1.4,0.64,1)",
          pointerEvents:ctrlHover?"auto":"none",
          display:"flex", alignItems:"center", gap:"3px",
          background:"rgba(20,18,15,0.75)", border:`1px solid ${C.borderMed}`, borderRadius:"16px", padding:"7px 8px",
          backdropFilter:"blur(28px) saturate(1.4)", WebkitBackdropFilter:"blur(28px) saturate(1.4)",
          boxShadow:`0 12px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}>
          <CtrlBtn onClick={() => scrollToPage(Math.max(1,currentPage-1))} disabled={currentPage<=1}>
            <ChevronLeft size={17} />
          </CtrlBtn>

          {/* Page pill */}
          <div style={{ fontFamily:"'DM Mono',monospace", display:"flex", alignItems:"baseline", gap:"3px", padding:"0 10px", minWidth:"58px", justifyContent:"center" }}>
            <span style={{ fontSize:"14px", color:C.text }}>{currentPage}</span>
            <span style={{ fontSize:"11px", color:C.textMid }}>/ {TOTAL_PAGES}</span>
          </div>

          <CtrlBtn onClick={() => scrollToPage(Math.min(TOTAL_PAGES,currentPage+1))} disabled={currentPage>=TOTAL_PAGES}>
            <ChevronRight size={17} />
          </CtrlBtn>

          <div style={{ width:"1px", height:"20px", background:C.border, margin:"0 4px" }} />

          {/* View segmented: Fit vs Full */}
          <div style={{ display:"flex", background:"rgba(220,215,205,0.05)", borderRadius:"10px", padding:"3px" }}>
            <SegBtn active={viewMode==="fit"}  onClick={() => { setViewMode("fit");  setZoomedIn(false); }}>Fit</SegBtn>
            <SegBtn active={viewMode==="full"} onClick={() => { setViewMode("full"); setZoomedIn(false); }}>Full</SegBtn>
          </div>
        </div>
      </div>

      {lightbox && <Lightbox fig={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FileGlyph() {
  // Minimal hand-drawn document mark — thin monochrome, no accent fill
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" fill="none" style={{ flexShrink:0 }}>
      <path d="M1 2.2C1 1.54 1.54 1 2.2 1H10L16 6.6V17.8C16 18.46 15.46 19 14.8 19H2.2C1.54 19 1 18.46 1 17.8V2.2Z"
        stroke={C.textMid} strokeWidth="1.1" />
      <path d="M10 1V6.4C10 6.73 10.27 7 10.6 7H16" stroke={C.textMid} strokeWidth="1.1" />
      <line x1="4.4" y1="11" x2="12.6" y2="11" stroke={C.textDim} strokeWidth="1.1" />
      <line x1="4.4" y1="14" x2="10.4" y2="14" stroke={C.textDim} strokeWidth="1.1" />
    </svg>
  );
}
function PillBtn({ icon, active=false, onClick, title, pulse=false }: { icon:React.ReactNode; active?:boolean; onClick?:()=>void; title?:string; pulse?:boolean }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:"34px", height:"32px", display:"flex", alignItems:"center", justifyContent:"center",
      background: active ? C.accent : "transparent",
      border:"none", borderRadius:"8px", cursor:"pointer",
      color: active ? "#141210" : C.textMid, transition:"all 0.16s",
      boxShadow: pulse ? `0 0 0 3px ${C.accentDim}` : "none",
    }}
      onMouseEnter={e => { if(!active){ const t=e.currentTarget as HTMLElement; t.style.color=C.text; t.style.background="rgba(220,215,205,0.07)"; } }}
      onMouseLeave={e => { if(!active){ const t=e.currentTarget as HTMLElement; t.style.color=C.textMid; t.style.background="transparent"; } }}
    >{icon}</button>
  );
}
function CtrlBtn({ children, onClick, disabled=false }: { children:React.ReactNode; onClick?:()=>void; disabled?:boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"34px", height:"34px", display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", borderRadius:"10px", cursor:disabled?"not-allowed":"pointer", color:disabled?C.textDim:C.text, transition:"background 0.12s" }}
      onMouseEnter={e => { if(!disabled)(e.currentTarget as HTMLElement).style.background="rgba(220,215,205,0.08)"; }}
      onMouseLeave={e => { if(!disabled)(e.currentTarget as HTMLElement).style.background="none"; }}
    >{children}</button>
  );
}
function SegBtn({ children, active, onClick }: { children:React.ReactNode; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      padding:"5px 14px", borderRadius:"8px", border:"none", cursor:"pointer",
      background: active ? C.accent : "transparent",
      color: active ? "#141210" : C.textMid,
      fontFamily:"'Barlow',sans-serif", fontSize:"12px", fontWeight:500,
      transition:"all 0.16s",
    }}
      onMouseEnter={e => { if(!active)(e.currentTarget as HTMLElement).style.color=C.text; }}
      onMouseLeave={e => { if(!active)(e.currentTarget as HTMLElement).style.color=C.textMid; }}
    >{children}</button>
  );
}
