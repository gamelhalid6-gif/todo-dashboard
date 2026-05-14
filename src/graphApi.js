const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function callGraph(endpoint, method = 'GET', body = null, token) {
  const res = await fetch(`${GRAPH_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API ${method} ${endpoint} → ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getLists(token) {
  const data = await callGraph('/me/todo/lists', 'GET', null, token);
  return data.value;
}

export async function createList(name, token) {
  return callGraph('/me/todo/lists', 'POST', { displayName: name }, token);
}

export async function getTasks(listId, token) {
  const data = await callGraph(`/me/todo/lists/${listId}/tasks`, 'GET', null, token);
  return data.value;
}

export async function createTask(listId, task, token) {
  return callGraph(`/me/todo/lists/${listId}/tasks`, 'POST', task, token);
}

export async function updateTask(listId, taskId, updates, token) {
  return callGraph(`/me/todo/lists/${listId}/tasks/${taskId}`, 'PATCH', updates, token);
}

export async function deleteTask(listId, taskId, token) {
  return callGraph(`/me/todo/lists/${listId}/tasks/${taskId}`, 'DELETE', null, token);
}

export async function moveTask(sourceListId, targetListId, task, token) {
  const taskData = {
    title: task.title,
    importance: task.importance,
    status: task.status,
  };
  if (task.body?.content) taskData.body = task.body;
  if (task.dueDateTime) taskData.dueDateTime = task.dueDateTime;

  const newTask = await createTask(targetListId, taskData, token);
  await deleteTask(sourceListId, task.id, token);
  return newTask;
}
