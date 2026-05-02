import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { parseLocalDate } from "@/lib/format-due-date";
import {
  addPlanMonths,
  formatPlanMonthLabel,
  monthEndDate,
  monthStartDate,
} from "@/lib/project-plan-month";
import { useTaskStore } from "@/store/task-store";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";

const HORIZON_DAYS = 14;

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(base: Date, days: number): Date {
  const x = new Date(base);
  x.setDate(x.getDate() + days);
  return x;
}

function MiniDueTimeline({ tasks, anchorDate }: { tasks: Task[]; anchorDate: Date }) {
  const windowStart = useMemo(() => startOfLocalDay(anchorDate), [anchorDate]);
  const windowEnd = useMemo(
    () => addDays(windowStart, HORIZON_DAYS),
    [windowStart],
  );
  const totalMs = windowEnd.getTime() - windowStart.getTime();

  const markers = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "done");
    const out: { key: string; pct: number; overdue: boolean }[] = [];
    for (const t of open) {
      const due = startOfLocalDay(parseLocalDate(t.dueDate));
      if (Number.isNaN(due.getTime())) continue;
      let pct = ((due.getTime() - windowStart.getTime()) / totalMs) * 100;
      let overdue = false;
      if (due < windowStart) {
        pct = 1.5;
        overdue = true;
      } else if (due > windowEnd) {
        pct = 99;
      } else {
        pct = Math.min(99, Math.max(0, pct));
      }
      out.push({ key: t.id, pct, overdue });
    }
    return out;
  }, [tasks, totalMs, windowEnd, windowStart]);

  const todayPct = useMemo(() => {
    const day = startOfLocalDay(anchorDate);
    return Math.min(
      100,
      Math.max(0, ((day.getTime() - windowStart.getTime()) / totalMs) * 100),
    );
  }, [anchorDate, totalMs, windowStart]);

  if (markers.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        No open tasks with due dates in this project.
      </p>
    );
  }

  const overdueCount = markers.filter((m) => m.overdue).length;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Upcoming deadlines (next {HORIZON_DAYS} days)
        </p>
        <div className="inline-flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-violet-400/95" />
            Upcoming
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-400/95" />
            Overdue
          </span>
        </div>
      </div>
      <div className="relative h-7 rounded-md border border-white/10 bg-black/30">
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-primary/70"
          style={{ left: `${todayPct}%` }}
          title="Today"
        />
        {markers.map((m) => (
          <div
            key={m.key}
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 shadow-sm"
            style={{
              left: `${m.pct}%`,
              backgroundColor: m.overdue
                ? "rgb(248 113 113 / 0.95)"
                : "rgb(167 139 250 / 0.95)",
            }}
            title={m.overdue ? "Overdue" : "Due in window"}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Timeline starts at today and runs {HORIZON_DAYS} days ahead.{" "}
        {overdueCount > 0
          ? `${overdueCount} overdue task${overdueCount === 1 ? "" : "s"} shown in red.`
          : "No overdue tasks in this project."}
      </p>
    </div>
  );
}

function StatusStrip({
  todo,
  inProgress,
  done,
}: {
  todo: number;
  inProgress: number;
  done: number;
}) {
  if (todo + inProgress + done === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">No tasks in this project yet.</p>
    );
  }
  const total = todo + inProgress + done;
  const doneRatio = Math.round((done / total) * 100);
  const wTodo = (todo / total) * 100;
  const wIp = (inProgress / total) * 100;
  const wDone = (done / total) * 100;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Tasks by status
      </p>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        {wTodo > 0 ? (
          <div
            className="h-full bg-slate-400/85 transition-[width] duration-300"
            style={{ width: `${wTodo}%` }}
            title={`To do: ${todo}`}
          />
        ) : null}
        {wIp > 0 ? (
          <div
            className="h-full bg-violet-500/85 transition-[width] duration-300"
            style={{ width: `${wIp}%` }}
            title={`In progress: ${inProgress}`}
          />
        ) : null}
        {wDone > 0 ? (
          <div
            className="h-full bg-emerald-500/85 transition-[width] duration-300"
            style={{ width: `${wDone}%` }}
            title={`Done: ${done}`}
          />
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {doneRatio}% done · {todo} to do · {inProgress} in progress
      </p>
    </div>
  );
}

type Props = {
  tasks: Task[] | undefined;
  projects: Project[];
  /** Advances “today” on the due strip and window; should tick over time (e.g. dashboard clock). */
  anchorDate: Date;
};

const GANTT_BAR_COLORS = [
  "rgb(139 92 246 / 0.9)",
  "rgb(34 197 94 / 0.9)",
  "rgb(56 189 248 / 0.9)",
  "rgb(251 191 36 / 0.9)",
  "rgb(244 114 182 / 0.9)",
  "rgb(94 234 212 / 0.9)",
];

const AXIS_H_PX = 26;
const ROW_H = 40;

/** First of each calendar month from `start` through `end` (inclusive of months touched). */
function listMonthStartsBetween(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const limit = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur.getTime() <= limit.getTime()) {
    out.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

function axisMonthLabel(d: Date): string {
  return d.toLocaleString(undefined, { month: "short", year: "2-digit" });
}

function ProjectScheduleGantt({
  projects,
  anchorDate,
}: {
  projects: Project[];
  anchorDate: Date;
}) {
  const rows = useMemo(() => {
    const out: { id: string; name: string; start: string; end: string }[] = [];
    for (const p of projects) {
      const s = p.planStartMonth?.trim();
      const e = p.planEndMonth?.trim();
      if (!s || !e) continue;
      out.push({ id: p.id, name: p.name, start: s, end: e });
    }
    return out;
  }, [projects]);

  const { domainStart, domainEnd, totalMs, todayPct } = useMemo(() => {
    if (rows.length === 0) {
      return { domainStart: null as Date | null, domainEnd: null as Date | null, totalMs: 0, todayPct: null as number | null };
    }
    let minYm = rows[0].start;
    let maxYm = rows[0].end;
    for (const r of rows) {
      if (r.start < minYm) minYm = r.start;
      if (r.end > maxYm) maxYm = r.end;
    }
    const d0 = monthStartDate(addPlanMonths(minYm, -1));
    const d1 = monthEndDate(addPlanMonths(maxYm, 1));
    const totalMs = Math.max(1, d1.getTime() - d0.getTime());
    const today = startOfLocalDay(anchorDate).getTime();
    const todayPct = Math.min(100, Math.max(0, ((today - d0.getTime()) / totalMs) * 100));
    return { domainStart: d0, domainEnd: d1, totalMs, todayPct };
  }, [anchorDate, rows]);

  const monthTicks = useMemo(() => {
    if (!domainStart || !domainEnd) return [];
    return listMonthStartsBetween(domainStart, domainEnd);
  }, [domainStart, domainEnd]);

  const pctAt = (tMs: number) => ((tMs - domainStart!.getTime()) / totalMs) * 100;

  if (rows.length === 0 || !domainStart || !domainEnd) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-black/20 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground sm:text-sm">
          When projects include a start month and estimated close month, a schedule bar chart appears
          here.
        </p>
      </div>
    );
  }

  const rangeLabel = `${formatPlanMonthLabel(rows.reduce((a, r) => (r.start < a ? r.start : a), rows[0].start))} — ${formatPlanMonthLabel(rows.reduce((a, r) => (r.end > a ? r.end : a), rows[0].end))}`;
  const todayX = todayPct ?? 0;

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Project timeline</h3>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Bars show each project from its <span className="text-foreground/90">start month</span> through its{" "}
          <span className="text-foreground/90">estimated close month</span>. Vertical lines mark calendar months; the
          bright line is today.
        </p>
        <p className="text-[10px] text-muted-foreground/90">Chart range: {rangeLabel}</p>
      </div>

      <div className="flex gap-3 sm:gap-4">
        <div
          className="flex w-[6.5rem] shrink-0 flex-col sm:w-[8.5rem]"
          style={{ paddingTop: AXIS_H_PX }}
        >
          {rows.map((r) => (
            <div
              key={`label-${r.id}`}
              className="flex flex-col justify-center border-b border-white/5 py-1.5"
              style={{ minHeight: ROW_H }}
            >
              <p className="truncate text-[11px] font-medium text-foreground" title={r.name}>
                {r.name}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {formatPlanMonthLabel(r.start)} → {formatPlanMonthLabel(r.end)}
              </p>
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden rounded-md border border-white/10 bg-black/35">
          {/* Month grid + today (behind bars) */}
          <div
            className="pointer-events-none absolute z-0 bg-white/[0.03]"
            style={{ top: AXIS_H_PX, left: 0, right: 0, bottom: 0 }}
          >
            {monthTicks.map((d) => {
              const left = pctAt(d.getTime());
              if (left < 0 || left > 100) return null;
              return (
                <div
                  key={d.toISOString()}
                  className="absolute top-0 bottom-0 w-px bg-white/12"
                  style={{ left: `${left}%` }}
                />
              );
            })}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 top-0 z-[2] w-px bg-primary shadow-[0_0_6px_rgb(139_92_246/0.55)]"
            style={{ left: `${todayX}%` }}
            title="Today"
          />

          {/* Month labels */}
          <div
            className="relative z-[1] border-b border-white/10 bg-black/40 px-1"
            style={{ height: AXIS_H_PX }}
          >
            {monthTicks.map((d) => {
              const left = pctAt(d.getTime());
              if (left < -2 || left > 102) return null;
              return (
                <span
                  key={`lab-${d.toISOString()}`}
                  className="absolute top-1 max-w-[3.5rem] truncate text-[10px] font-medium tabular-nums text-muted-foreground"
                  style={{ left: `${left}%`, transform: "translateX(2px)" }}
                >
                  {axisMonthLabel(d)}
                </span>
              );
            })}
            <span
              className="absolute bottom-0.5 text-[9px] font-medium uppercase tracking-wide text-primary drop-shadow-sm"
              style={{ left: `${todayX}%`, transform: "translateX(-50%)" }}
            >
              Today
            </span>
          </div>

          {/* Bars */}
          <div className="relative z-[1]">
            {rows.map((r, i) => {
              const t0 = monthStartDate(r.start).getTime();
              const t1 = monthEndDate(r.end).getTime();
              const left = pctAt(t0);
              const width = ((t1 - t0) / totalMs) * 100;
              const bg = GANTT_BAR_COLORS[i % GANTT_BAR_COLORS.length];
              return (
                <div
                  key={r.id}
                  className="flex items-center border-b border-white/5 px-2 py-1.5 last:border-b-0"
                  style={{ minHeight: ROW_H }}
                >
                  <div className="relative h-7 w-full rounded-md bg-white/[0.06]">
                    <div
                      className="absolute inset-y-1 rounded-md shadow-sm ring-1 ring-white/15"
                      style={{
                        left: `${Math.max(0, Math.min(100, left))}%`,
                        width: `${Math.max(0.8, Math.min(100, width))}%`,
                        backgroundColor: bg,
                      }}
                      title={`${formatPlanMonthLabel(r.start)} → ${formatPlanMonthLabel(r.end)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectOverviewSection({ tasks, projects, anchorDate }: Props) {
  const setActiveProjectId = useTaskStore((s) => s.setActiveProjectId);
  const activeProjects = useMemo(
    () =>
      [...projects]
        .filter((p) => p.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [projects],
  );

  const byProjectId = useMemo(() => {
    if (!tasks) return new Map<string, Task[]>();
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const pid = t.projectId;
      if (!pid) continue;
      const list = map.get(pid) ?? [];
      list.push(t);
      map.set(pid, list);
    }
    return map;
  }, [tasks]);

  const unassigned = useMemo(
    () => (tasks ?? []).filter((t) => !t.projectId),
    [tasks],
  );

  return (
    <section aria-labelledby="project-overview-heading" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2
            id="project-overview-heading"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Project pulse
          </h2>
        </div>
        <Link
          to="/tasks"
          className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Manage on Tasks →
        </Link>
      </div>

      <ProjectScheduleGantt projects={activeProjects} anchorDate={anchorDate} />

      {tasks === undefined ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-8 text-center text-sm text-muted-foreground">
          <FolderKanban className="mx-auto mb-2 size-8 opacity-40" />
          <p>No active projects yet. Create one from the Projects page to see summaries here.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeProjects.map((project, index) => {
            const list = byProjectId.get(project.id) ?? [];
            const todo = list.filter((t) => t.status === "todo").length;
            const inProgress = list.filter((t) => t.status === "in-progress").length;
            const done = list.filter((t) => t.status === "done").length;
            const open = todo + inProgress;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="h-full"
              >
                <Link
                  to="/tasks"
                  onClick={() => setActiveProjectId(project.id)}
                  className="flex h-full flex-col gap-3 rounded-xl border border-white/10 bg-linear-to-b from-white/6 to-black/25 p-4 shadow-lg shadow-black/15 transition-colors hover:border-primary/45 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label={`Open tasks for ${project.name}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{project.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {list.length} task{list.length === 1 ? "" : "s"} · {open} open
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {list.length ? `${Math.round((done / list.length) * 100)}%` : "—"} done
                    </Badge>
                  </div>
                  <StatusStrip todo={todo} inProgress={inProgress} done={done} />
                  <MiniDueTimeline tasks={list} anchorDate={anchorDate} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {tasks !== undefined && unassigned.length > 0 ? (
        <p className="text-xs text-amber-200/90">
          {unassigned.length} task{unassigned.length === 1 ? "" : "s"} without a project — open
          Tasks to assign a project.
        </p>
      ) : null}
    </section>
  );
}
