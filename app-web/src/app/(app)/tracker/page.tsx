"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  MapPin,
  GripVertical,
  MoreHorizontal,
  Trash2,
  MoveRight,
  ChevronDown,
  StickyNote,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MOCK_JOBS } from "@/components/jobs/mock";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PipelineStatus = "applied" | "interviewing" | "offered" | "rejected";

interface TrackerJob {
  id: string;
  jobId: string;
  status: PipelineStatus;
  appliedAt: string;
  notes: string;
}

const MOCK_TRACKER: TrackerJob[] = [
  { id: "t1", jobId: "1", status: "interviewing", appliedAt: "2d ago",  notes: "Round 1 done. Round 2 scheduled for next week." },
  { id: "t2", jobId: "2", status: "applied",      appliedAt: "3d ago",  notes: "" },
  { id: "t3", jobId: "4", status: "applied",      appliedAt: "4d ago",  notes: "Applied via referral from Aditya." },
  { id: "t6", jobId: "5", status: "offered",      appliedAt: "10d ago", notes: "Offer: ₹32 LPA + ESOPs. Deadline this Friday." },
  { id: "t7", jobId: "7", status: "rejected",     appliedAt: "12d ago", notes: "Rejected post final round. Feedback: system design." },
];

const COLUMNS: {
  status: PipelineStatus;
  label: string;
  color: string;
  dot: string;
  bg: string;
  border: string;
  headerBg: string;
}[] = [
  { status: "applied",      label: "Applied",      color: "text-[#6b9eff]",   dot: "bg-[#6b9eff]",   bg: "bg-[#6b9eff]/5",   border: "border-[#6b9eff]/15",   headerBg: "bg-[#6b9eff]/8" },
  { status: "interviewing", label: "Interviewing", color: "text-[#ff9f68]",   dot: "bg-[#ff9f68]",   bg: "bg-[#ff9f68]/5",   border: "border-[#ff9f68]/15",   headerBg: "bg-[#ff9f68]/8" },
  { status: "offered",      label: "Offered",      color: "text-primary",     dot: "bg-primary",     bg: "bg-primary/5",     border: "border-primary/15",     headerBg: "bg-primary/8" },
  { status: "rejected",     label: "Rejected",     color: "text-destructive", dot: "bg-destructive", bg: "bg-destructive/5", border: "border-destructive/15", headerBg: "bg-destructive/8" },
];

const SOURCE_LOGOS: Record<string, string> = {
  linkedin: "/linkedin-logo.png",
  naukri:   "/naukri-logo.png",
  indeed:   "/indeed-logo.png",
};

const WORK_MODE_CONFIG = {
  remote: { label: "Remote", color: "text-primary",          bg: "bg-primary/8" },
  hybrid: { label: "Hybrid", color: "text-[#ff9f68]",        bg: "bg-[#ff9f68]/10" },
  onsite: { label: "Onsite", color: "text-muted-foreground", bg: "bg-muted" },
};

// ── Draggable Card ─────────────────────────────────────────────────────────────
function KanbanCard({
  item,
  overlay = false,
  onMove,
  onRemove,
  onUpdateNotes,
}: {
  item: TrackerJob;
  overlay?: boolean;
  onMove?: (id: string, status: PipelineStatus) => void;
  onRemove?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
}) {
  const job = MOCK_JOBS.find((j) => j.id === item.jobId);
  if (!job) return null;

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  const wm = WORK_MODE_CONFIG[job.workMode];

  function commitNotes() {
    onUpdateNotes?.(item.id, notesValue);
    setEditingNotes(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-[12px] border bg-card px-3 py-3 flex flex-col gap-2 touch-none select-none",
        overlay   ? "shadow-xl rotate-1 opacity-95 border-primary/30" : "border-border",
        isDragging ? "opacity-30" : "hover:border-border/80 hover:shadow-sm transition-all duration-150",
      )}
    >
      {/* Row 1: drag handle + company + source + actions */}
      <div className="flex items-center gap-2">
        <button
          {...listeners}
          {...attributes}
          className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="w-5 h-5 rounded-[5px] bg-muted border border-border flex items-center justify-center shrink-0 text-[9px] font-bold text-foreground">
          {job.company[0]}
        </div>
        <span className="text-[11px] text-muted-foreground/60 truncate flex-1">{job.company}</span>
        <Image
          src={SOURCE_LOGOS[job.source]}
          alt={job.source}
          width={12}
          height={12}
          className="rounded-[3px] object-contain opacity-40 shrink-0"
        />
        {!overlay && onMove && onRemove && (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-5 h-5 rounded-[5px] flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-colors shrink-0 outline-none">
              <MoreHorizontal className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-44">
              {COLUMNS.filter((c) => c.status !== item.status).map((col) => (
                <DropdownMenuItem
                  key={col.status}
                  onClick={() => onMove(item.id, col.status)}
                  className="gap-2 cursor-pointer"
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", col.dot)} />
                  <MoveRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  <span className={cn("text-sm font-medium", col.color)}>{col.label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemove(item.id)}
                variant="destructive"
                className="gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">Remove</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-foreground leading-snug px-0.5">
        {job.title}
      </p>

      {/* Location + work mode */}
      <div className="flex items-center gap-1.5 px-0.5">
        <MapPin className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <span className="text-[11px] text-muted-foreground/50 truncate flex-1">{job.city}</span>
        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", wm.bg, wm.color)}>
          {wm.label}
        </span>
      </div>

      {/* Salary + applied date */}
      <div className="flex items-center justify-between px-0.5 pt-0.5 border-t border-border/40">
        {job.salary ? (
          <span className="text-[10px] font-semibold text-muted-foreground/60">{job.salary}</span>
        ) : (
          <span className="text-[10px] text-muted-foreground/25">No salary listed</span>
        )}
        <span className="text-[10px] text-muted-foreground/30">Applied {item.appliedAt}</span>
      </div>

      {/* Notes section — hidden in drag overlay */}
      {!overlay && (
        <div className="px-0.5">
          {editingNotes ? (
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={commitNotes}
              onKeyDown={(e) => { if (e.key === "Escape") commitNotes(); }}
              className="w-full text-[11px] bg-muted/50 border border-border rounded-[6px] p-1.5 text-muted-foreground resize-none outline-none placeholder:text-muted-foreground/30 min-h-[56px] focus:border-border/80"
              placeholder="Add a note about this application…"
              autoFocus
            />
          ) : notesValue ? (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-left w-full group/notes"
            >
              <p className="text-[11px] text-muted-foreground/60 line-clamp-2 bg-muted/40 rounded-[6px] px-1.5 py-1 group-hover/notes:bg-muted/70 transition-colors">
                {notesValue}
              </p>
            </button>
          ) : (
            <button
              onClick={() => setEditingNotes(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            >
              <StickyNote className="w-3 h-3" />
              Add note
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Droppable Column ───────────────────────────────────────────────────────────
function KanbanColumn({
  column,
  items,
  isOver,
  onMove,
  onRemove,
  onUpdateNotes,
}: {
  column: (typeof COLUMNS)[number];
  items: TrackerJob[];
  isOver: boolean;
  onMove: (id: string, status: PipelineStatus) => void;
  onRemove: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.status });

  return (
    <div className="flex flex-col w-[260px] shrink-0">
      <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-t-[14px] border border-b-0", column.headerBg, column.border)}>
        <span className={cn("w-2 h-2 rounded-full shrink-0", column.dot)} />
        <span className={cn("text-xs font-semibold flex-1", column.color)}>{column.label}</span>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", column.bg, column.border, column.color)}>
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 p-2 rounded-b-[14px] border overflow-y-auto transition-colors duration-150",
          "min-h-[120px] max-h-[calc(100dvh-260px)]",
          column.border,
          isOver ? `${column.bg} border-dashed` : "bg-muted/10"
        )}
      >
        {items.map((item) => (
          <KanbanCard
            key={item.id}
            item={item}
            onMove={onMove}
            onRemove={onRemove}
            onUpdateNotes={onUpdateNotes}
          />
        ))}
        {items.length === 0 && (
          <div className={cn(
            "flex-1 flex items-center justify-center rounded-[10px] min-h-[80px]",
            isOver ? "opacity-100" : "opacity-40"
          )}>
            <p className={cn("text-xs font-medium", column.color)}>Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mobile List Row ────────────────────────────────────────────────────────────
function MobileListRow({
  item,
  onMove,
  onRemove,
}: {
  item: TrackerJob;
  onMove: (id: string, status: PipelineStatus) => void;
  onRemove: (id: string) => void;
}) {
  const job = MOCK_JOBS.find((j) => j.id === item.jobId);
  if (!job) return null;
  const wm = WORK_MODE_CONFIG[job.workMode];

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
      <div className="w-8 h-8 rounded-[8px] bg-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground shrink-0 mt-0.5">
        {job.company[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Image src={SOURCE_LOGOS[job.source]} alt={job.source} width={11} height={11} className="rounded-[3px] object-contain opacity-50 shrink-0" />
          <span className="text-[11px] text-muted-foreground/50 truncate">{job.company}</span>
          <span className="text-muted-foreground/30 text-[10px]">·</span>
          <span className={cn("text-[10px] font-medium px-1 py-0.5 rounded-full", wm.bg, wm.color)}>{wm.label}</span>
        </div>
        {item.notes && (
          <p className="text-[11px] text-muted-foreground/50 mt-1 line-clamp-1">{item.notes}</p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="w-7 h-7 rounded-[8px] flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors shrink-0 outline-none mt-0.5">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {COLUMNS.filter((c) => c.status !== item.status).map((col) => (
            <DropdownMenuItem key={col.status} onClick={() => onMove(item.id, col.status)} className="gap-2 cursor-pointer">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", col.dot)} />
              <span className={cn("text-sm font-medium", col.color)}>{col.label}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onRemove(item.id)} variant="destructive" className="gap-2 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Remove</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function TrackerPage() {
  const [items, setItems] = useState<TrackerJob[]>(MOCK_TRACKER);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [mobileCollapsed, setMobileCollapsed] = useState<Set<PipelineStatus>>(new Set(["rejected"]));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeItem = items.find((i) => i.id === activeId) ?? null;

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragOver(e: { over: { id: string } | null }) { setOverId(e.over ? String(e.over.id) : null); }
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    setOverId(null);
    if (!over) return;
    const targetStatus = String(over.id) as PipelineStatus;
    if (!COLUMNS.find((c) => c.status === targetStatus)) return;
    setItems((prev) => prev.map((item) =>
      item.id === String(active.id) ? { ...item, status: targetStatus } : item
    ));
  }

  function moveItem(id: string, status: PipelineStatus) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }
  function updateNotes(id: string, notes: string) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, notes } : item));
  }
  function toggleMobileCollapse(status: PipelineStatus) {
    setMobileCollapsed((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-4 lg:px-6 pt-5 pb-4 border-b border-border shrink-0">
        <h1 className="font-serif text-2xl text-foreground">Tracker</h1>
        <p className="text-xs text-muted-foreground/50 mt-0.5">
          Manage your active applications · drag cards or use the menu to update status
        </p>

        {/* Pipeline stats */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {COLUMNS.map((col) => {
            const count = items.filter((i) => i.status === col.status).length;
            return (
              <div key={col.status} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] border", col.bg, col.border)}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", col.dot)} />
                <span className={cn("text-[11px] font-semibold", col.color)}>{col.label}</span>
                <span className={cn("text-[11px] font-bold tabular-nums", col.color)}>{count}</span>
              </div>
            );
          })}
          <span className="text-[11px] text-muted-foreground/40 ml-1">{items.length} total</span>
        </div>
      </div>

      {/* ── Desktop kanban ── */}
      <div className="hidden md:block flex-1 overflow-x-auto overflow-y-auto">
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragOver={onDragOver as never}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3 p-4 lg:p-6 w-max">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                column={col}
                items={items.filter((i) => i.status === col.status)}
                isOver={overId === col.status}
                onMove={moveItem}
                onRemove={removeItem}
                onUpdateNotes={updateNotes}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeItem && <KanbanCard item={activeItem} overlay />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ── Mobile list ── */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 py-4">
          {COLUMNS.map((col) => {
            const colItems = items.filter((i) => i.status === col.status);
            if (colItems.length === 0) return null;
            const isCollapsed = mobileCollapsed.has(col.status);
            return (
              <div key={col.status} className="rounded-[14px] border border-border overflow-hidden">
                <button
                  onClick={() => toggleMobileCollapse(col.status)}
                  className={cn("w-full flex items-center gap-2 px-4 py-3 transition-colors hover:opacity-90", col.headerBg)}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", col.dot)} />
                  <span className={cn("text-xs font-semibold flex-1 text-left", col.color)}>{col.label}</span>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", col.bg, col.border, col.color)}>
                    {colItems.length}
                  </span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/50 transition-transform", isCollapsed && "-rotate-90")} />
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {colItems.map((item) => (
                      <MobileListRow key={item.id} item={item} onMove={moveItem} onRemove={removeItem} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
