import { useMemo } from "react";
import { TeamTask } from "../types";
import { deriveTaskInsights, TaskInsights } from "../utils/task-insights";

export function useTaskInsights(tasks: TeamTask[]): TaskInsights {
  return useMemo(() => deriveTaskInsights(tasks), [tasks]);
}
