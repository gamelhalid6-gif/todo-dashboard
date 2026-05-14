const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET = 'Tasks';
const HEADERS = ['task_id', 'title', 'category', 'notes', 'active', 'last_synced'];

async function call(path, method = 'GET', body = null, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function initSheet(spreadsheetId, token) {
  // Find or create the Tasks sheet
  const info = await call(`/${spreadsheetId}?fields=sheets.properties`, 'GET', null, token);
  const sheets = info.sheets || [];
  const exists = sheets.some(s => s.properties.title === SHEET);

  if (!exists) {
    if (sheets.length > 0 && sheets[0].properties.title === 'Sheet1') {
      // Rename the default sheet
      await call(`/${spreadsheetId}:batchUpdate`, 'POST', {
        requests: [{
          updateSheetProperties: {
            properties: { sheetId: sheets[0].properties.sheetId, title: SHEET },
            fields: 'title',
          },
        }],
      }, token);
    } else {
      await call(`/${spreadsheetId}:batchUpdate`, 'POST', {
        requests: [{ addSheet: { properties: { title: SHEET } } }],
      }, token);
    }
  }

  // Ensure header row
  const head = await call(`/${spreadsheetId}/values/${SHEET}!A1:F1`, 'GET', null, token);
  if (!head.values?.length) {
    await call(
      `/${spreadsheetId}/values/${SHEET}!A1:F1?valueInputOption=RAW`,
      'PUT',
      { values: [HEADERS] },
      token
    );
  }
}

export async function getTasks(spreadsheetId, token) {
  const data = await call(`/${spreadsheetId}/values/${SHEET}`, 'GET', null, token);
  if (!data.values || data.values.length <= 1) return [];

  return data.values
    .slice(1)
    .map((row, i) => ({
      id: row[0] || '',
      title: row[1] || '',
      category: row[2] || 'Not Important',
      notes: row[3] || '',
      active: row[4] !== 'FALSE',
      rowIndex: i + 2,
    }))
    .filter(t => t.id && t.active);
}

function rowData(task) {
  return [task.id, task.title, task.category, task.notes, 'TRUE', new Date().toISOString()];
}

export async function addTask(spreadsheetId, task, token) {
  return call(
    `/${spreadsheetId}/values/${SHEET}!A:F:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    'POST',
    { values: [rowData(task)] },
    token
  );
}

export async function updateTask(spreadsheetId, task, token) {
  return call(
    `/${spreadsheetId}/values/${SHEET}!A${task.rowIndex}:F${task.rowIndex}?valueInputOption=RAW`,
    'PUT',
    { values: [rowData(task)] },
    token
  );
}

export async function deleteTask(spreadsheetId, rowIndex, token) {
  return call(
    `/${spreadsheetId}/values/${SHEET}!E${rowIndex}?valueInputOption=RAW`,
    'PUT',
    { values: [['FALSE']] },
    token
  );
}
