import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ProjectOverviewSection } from "@/components/dashboard/ProjectOverviewSection";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { TaskListView } from "@/components/tasks/TaskListView";
import { Button } from "@/components/ui/button";
import { isDueWithinDays } from "@/lib/format-due-date";
import { fetchTasksApi } from "@/services/task-api";
import { useAuthStore } from "@/store/auth-store";
import { useTaskStore } from "@/store/task-store";
import type { Task } from "@/types/task";

export function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createSession, setCreateSession] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [searchParams] = useSearchParams();
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [overviewTasks, setOverviewTasks] = useState<Task[] | undefined>(undefined);
  const searchText = (searchParams.get("q") ?? "").trim().toLowerCase();
  const firstName = (currentUser?.name ?? "there").split(" ")[0];
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, [now]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      queueMicrotask(() => setOverviewTasks(undefined));
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setOverviewTasks(undefined);
    });
    void fetchTasksApi({ projectScope: "all" })
      .then((rows) => {
        if (!cancelled) setOverviewTasks(rows);
      })
      .catch(() => {
        if (!cancelled) setOverviewTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  function openCreateModal() {
    setCreateSession((s) => s + 1);
    setCreateOpen(true);
  }

  const statsTasks = overviewTasks ?? tasks;

  const { activeCount, dueSoonCount } = useMemo(() => {
    const active = statsTasks.filter((t) => t.status !== "done").length;
    const dueSoon = statsTasks.filter(
      (t) => t.status !== "done" && isDueWithinDays(t.dueDate, 7),
    ).length;
    return { activeCount: active, dueSoonCount: dueSoon };
  }, [statsTasks]);

  const visibleTasks = useMemo(() => {
    if (!searchText) return tasks;
    return tasks.filter((task) => {
      const assigneeNames = (task.assignees ?? [])
        .map((u) => u.name.toLowerCase())
        .join(" ");
      const haystack =
        `${task.title} ${task.description} ${assigneeNames}`.toLowerCase();
      return haystack.includes(searchText);
    });
  }, [searchText, tasks]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <CreateTaskModal
        key={createSession}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Overview
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {greeting}, {firstName}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Stay focused on your workspace priorities, recent assignments, and
              upcoming due dates.
            </p>
          </div>
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left shadow-lg shadow-black/20 backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Active
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left shadow-lg shadow-black/20 backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Due in 7d
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {dueSoonCount}
                </p>
              </div>
            </div>
            <Button
              className="shadow-lg shadow-primary/25"
              type="button"
              onClick={openCreateModal}
            >
              <Plus className="size-4" />
              New task
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <ProjectOverviewSection tasks={overviewTasks} projects={projects} />

      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="tasks-heading"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Your tasks
          </h2>
          <p className="text-xs text-muted-foreground">
            Showing tasks created by you or assigned to you
          </p>
        </div>

        <TaskListView
          onCreateClick={openCreateModal}
          tasks={visibleTasks}
          emptyTitle={
            searchText ? "No tasks match your search" : "No tasks yet"
          }
          emptyDescription={
            searchText
              ? "Try another keyword or open Tasks page for advanced filters."
              : "Create your first task to see it appear here with motion."
          }
        />
      </section>
    </div>
  );
}
