const PROJECT_FLOW_API_URL = import.meta.env.VITE_PROJECT_FLOW_API_URL || 'http://localhost:3000';

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface CreateTaskData {
  title: string;
  description: string;
  deadline: string; // formato: 2025-11-25T15:26
}

export interface CreateSubTaskData extends CreateTaskData {
  parentTaskId: string;
}

export interface ProjectFlowTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string;
  parentTaskId: string | null;
}


export async function createProjectFlowTask(
  token: string,
  taskData: CreateTaskData
): Promise<ProjectFlowTask> {
  const response = await fetch(`${PROJECT_FLOW_API_URL}/task/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear tarea en Project Flow');
  }

  const result = await response.json();
  return result.data;
}

export async function createProjectFlowSubTask(
  token: string,
  parentTaskId: string,
  taskData: CreateTaskData
): Promise<ProjectFlowTask> {
  const response = await fetch(`${PROJECT_FLOW_API_URL}/task/${parentTaskId}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear subtarea en Project Flow');
  }

  const result = await response.json();
  return result.data;
}

export async function getProjectFlowTask(
  token: string,
  taskId: string
): Promise<ProjectFlowTask> {
  const response = await fetch(`${PROJECT_FLOW_API_URL}/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener tarea de Project Flow');
  }

  const result = await response.json();
  return result.data;
}
