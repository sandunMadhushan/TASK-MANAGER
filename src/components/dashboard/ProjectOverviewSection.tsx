import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { parseLocalDate } from "@/lib/format-due-date";
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

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Due window</span>
        <span>Today → +{HORIZON_DAYS}d</span>
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
  const open = todo + inProgress;
  const wDoneComplete = (done / total) * 100;
  const wTodoAmongOpen = open > 0 ? (todo / open) * 100 : 0;
  const wIpAmongOpen = open > 0 ? (inProgress / open) * 100 : 0;

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Completed
        </p>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500/90 transition-[width] duration-300"
            style={{ width: `${wDoneComplete}%` }}
            title={`${done} of ${total} tasks done`}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {doneRatio}% of tasks done ({done}/{total})
        </p>
      </div>
      {open > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Open work mix
          </p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
            {wTodoAmongOpen > 0 ? (
              <div
                className="h-full bg-slate-400/85 transition-[width] duration-300"
                style={{ width: `${wTodoAmongOpen}%` }}
                title={`To do: ${todo}`}
              />
            ) : null}
            {wIpAmongOpen > 0 ? (
              <div
                className="h-full bg-violet-500/85 transition-[width] duration-300"
                style={{ width: `${wIpAmongOpen}%` }}
                title={`In progress: ${inProgress}`}
              />
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {todo} to do · {inProgress} in progress
          </p>
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  tasks: Task[] | undefined;
  projects: Project[];
  /** Advances “today” on the due strip and window; should tick over time (e.g. dashboard clock). */
  anchorDate: Date;
};

export function ProjectOverviewSection({ tasks, projects, anchorDate }: Props) {
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
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            A lightweight snapshot per project: status mix and upcoming due dates. Full Gantt
            charts usually need <span className="text-foreground/90">start and end</span> dates;
            today we only store <span className="text-foreground/90">due dates</span>, so this is a
            milestone-style strip instead of true bars.
          </p>
        </div>
        <Link
          to="/tasks"
          className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Manage on Tasks →
        </Link>
      </div>

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
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center text-sm text-muted-foreground">
          <FolderKanban className="mx-auto mb-2 size-8 opacity-40" />
          <p>No active projects yet. Create one from the Tasks page to see summaries here.</p>
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
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-linear-to-b from-white/[0.06] to-black/25 p-4 shadow-lg shadow-black/15"
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
              </motion.article>
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
