import { useState, useEffect, useCallback } from 'react';
import type { Task, Meeting, Project, LookupCategory } from '@/types';
import { getAllTasks } from '@/services/taskService';
import { getAllMeetings } from '@/services/meetingService';
import { getAllProjects } from '@/services/projectService';
import { getLookups } from '@/services/lookupService';

interface DataState {
  tasks: Task[];
  meetings: Meeting[];
  projects: Project[];
  lookups: LookupCategory;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useData(): DataState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lookups, setLookups] = useState<LookupCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, m, p, l] = await Promise.all([
        getAllTasks(),
        getAllMeetings(),
        getAllProjects(),
        getLookups(),
      ]);
      setTasks(t);
      setMeetings(m);
      setProjects(p);
      setLookups(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    tasks,
    meetings,
    projects,
    lookups: lookups ?? {
      departments: [],
      taskTypes: [],
      taskStatuses: [],
      meetingTypes: [],
      meetingClassifications: [],
      projectTypes: [],
      projectStatuses: [],
    },
    loading,
    error,
    refresh,
  };
}
