import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Target, CheckCircle2, Circle, Maximize2, Minimize2 } from 'lucide-react';

interface ChecklistItem {
  id: number;
  text: string;
  /** 该条体验在对应群聊中的固定视角（与当前会话角色无关） */
  perspective: string;
}

const MVP_ITEMS: ChecklistItem[] = [
  { id: 1, text: '产品经理交流群：启用和配置群龙虾', perspective: '群主' },
  { id: 2, text: '行业资讯分享群：开通和订阅定时群报', perspective: '群主' },
  { id: 3, text: '技术交流社区：群知识库与群龙虾Q&A', perspective: '群成员' },
  { id: 4, text: '兴趣爱好小组：管理群相册和群文件', perspective: '群主' },
  { id: 5, text: 'AI 产品共创营：体验入群导读', perspective: '新成员' },
];

const MVPChecklist: React.FC = () => {
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef(dragOffset);
  dragOffsetRef.current = dragOffset;
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, originX: 0, originY: 0 });
  const tapeRef = useRef<HTMLDivElement>(null);

  const onTapePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: dragOffsetRef.current.x,
      originY: dragOffsetRef.current.y,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    document.body.style.cursor = 'grabbing';

    const onMove = (e: PointerEvent) => {
      const { pointerX, pointerY, originX, originY } = dragStartRef.current;
      setDragOffset({
        x: originX + (e.clientX - pointerX),
        y: originY + (e.clientY - pointerY),
      });
    };

    const onUp = (e: PointerEvent) => {
      const el = tapeRef.current;
      if (el?.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  const toggleItem = (id: number) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className={`fixed left-8 top-[max(0.5rem,calc(100vh-2rem-32rem))] z-[100] origin-top-left select-none pointer-events-auto will-change-transform transition-[width,max-width] duration-300 ease-out ${
        expanded
          ? 'w-[22rem] max-w-[min(22rem,calc(100vw-2rem))]'
          : 'w-[15rem] max-w-[min(15rem,calc(100vw-2rem))]'
      }`}
      style={{ transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` }}
      aria-expanded={expanded}
    >
      <div
        className={`relative bg-[#fef3c7] border border-yellow-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transform -rotate-1 origin-top-left transition-all duration-300 ease-out hover:rotate-0 rounded-sm ${
          expanded ? 'p-7' : 'px-3.5 py-4 pt-5'
        }`}
      >
        {/* Sticky Note Pin / Tape effect — 唯一拖拽手柄 */}
        <div
          ref={tapeRef}
          role="presentation"
          onPointerDown={onTapePointerDown}
          className={`tape-handle absolute -top-3 left-1/2 -translate-x-1/2 z-30 min-h-9 min-w-[4.5rem] bg-white/40 backdrop-blur-md border border-white/50 rotate-2 shadow-sm touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}`}
        />

        <button
          type="button"
          aria-label={expanded ? '收起体验目录' : '展开体验目录'}
          title={expanded ? '收起' : '展开'}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setExpanded((v) => !v)}
          className="absolute right-2 top-3 z-40 rounded-lg p-1.5 text-gray-600 hover:bg-yellow-100/70 hover:text-gray-900 transition-colors"
        >
          {expanded ? <Minimize2 size={16} strokeWidth={2.25} /> : <Maximize2 size={16} strokeWidth={2.25} />}
        </button>

        {expanded ? (
          <>
            <div className="mb-5 border-b border-yellow-300/50 pb-3 pr-9">
              <h3 className="text-[17px] font-black text-gray-800 flex items-center gap-2 tracking-tight">
                <Target className="text-orange-500 shrink-0" size={20} />
                GroupClaw · MVP体验目录
              </h3>
            </div>

            <div className="space-y-4">
              {MVP_ITEMS.map((item) => {
                const isCompleted = completedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="flex items-start gap-3 group cursor-pointer"
                  >
                    <div className={`mt-0.5 shrink-0 transition-colors ${isCompleted ? 'text-green-500' : 'text-yellow-400 group-hover:text-yellow-500'}`}>
                      {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`block text-[13px] leading-relaxed transition-all duration-300 ${
                        isCompleted
                          ? 'text-gray-400 line-through decoration-gray-300'
                          : 'text-gray-700 font-medium group-hover:text-gray-900'
                      }`}>
                        {item.text}
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-gray-400" aria-hidden />
                        <span>视角：{item.perspective}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-yellow-300/30 flex justify-between items-center gap-2">
              <div className="text-[10px] text-yellow-600/60 font-black tracking-widest uppercase">GroupClaw MVP Guide</div>
              <div className="text-[10px] text-yellow-600/60 font-mono shrink-0">{completedItems.size}/{MVP_ITEMS.length}</div>
            </div>
          </>
        ) : (
          <div
            className="pr-8 pt-0.5 cursor-pointer rounded-md -mx-1 -mb-1 px-1 pb-1 hover:bg-yellow-100/35 transition-colors"
            onClick={() => setExpanded(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded(true);
              }
            }}
          >
            <div className="flex items-start gap-2">
              <Target className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <div className="text-[12px] font-black text-gray-800 leading-snug">GroupClaw</div>
                <div className="text-[10px] font-bold text-gray-500 leading-tight">MVP 体验目录</div>
                <div className="mt-2 text-[10px] text-yellow-700/80 font-mono tabular-nums">
                  进度 {completedItems.size}/{MVP_ITEMS.length}
                </div>
                <p className="mt-2 text-[9px] text-gray-500 leading-snug">点击图标展开，捏住顶部胶带可拖动</p>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-transparent to-black/5 pointer-events-none" />
      </div>
    </div>
  );
};

export default MVPChecklist;
