const authPanel = document.querySelector('#auth-panel');
const appPanel = document.querySelector('#app-panel');
const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const taskForm = document.querySelector('#task-form');
const refreshButton = document.querySelector('#refresh-btn');
const logoutButton = document.querySelector('#logout-btn');
const taskList = document.querySelector('#task-list');
const emptyState = document.querySelector('#empty-state');
const userNameEl = document.querySelector('#user-name');
const userEmailEl = document.querySelector('#user-email');
const toast = document.querySelector('#toast');
const taskTemplate = document.querySelector('#task-item-template');

const TOKEN_KEY = 'tasks_api_token';
const USER_KEY = 'tasks_api_user';

let token = localStorage.getItem(TOKEN_KEY);
let user = null;

try {
  const storedUser = localStorage.getItem(USER_KEY);
  if (storedUser) {
    user = JSON.parse(storedUser);
  }
} catch (_error) {
  localStorage.removeItem(USER_KEY);
}

const statusStyles = {
  pending: {
    label: 'Pending',
    className:
      'border-yellow-400/40 bg-yellow-400/10 text-yellow-300'
  },
  in_progress: {
    label: 'In progress',
    className:
      'border-sky-400/50 bg-sky-400/10 text-sky-300'
  },
  done: {
    label: 'Done',
    className:
      'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
  }
};

function showToast(message, type = 'info') {
  if (!toast) return;

  const palette = {
    info: 'border-sky-500/40 bg-slate-900/95 text-slate-100',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
    error: 'border-red-500/60 bg-red-500/10 text-red-100'
  };

  toast.textContent = message;
  toast.className =
    'pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto w-full max-w-md rounded-xl px-4 py-3 text-sm shadow-lg transition';
  toast.classList.add(palette[type] ?? palette.info);
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

async function api(path, options = {}) {
  const { skipAuth, ...rest } = options;
  const headers = new Headers(rest.headers ?? {});

  if (!headers.has('Content-Type') && rest.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...rest,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message ?? 'Request failed';
    throw new Error(message);
  }

  return data;
}

function setAuth(nextToken, nextUser) {
  token = nextToken;
  user = nextUser;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  updateUI();
  showToast(`Welcome back, ${user.name}!`, 'success');
}

function clearAuth() {
  token = null;
  user = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  updateUI();
  showToast('Signed out successfully.', 'info');
}

function updateUI() {
  const isAuthenticated = Boolean(token && user);

  if (isAuthenticated) {
    authPanel.classList.add('hidden');
    appPanel.classList.remove('hidden');
    userNameEl.textContent = user.name;
    userEmailEl.textContent = `<${user.email}>`;
    loadTasks().catch((error) =>
      showToast(error.message ?? 'Unable to fetch tasks', 'error')
    );
  } else {
    authPanel.classList.remove('hidden');
    appPanel.classList.add('hidden');
    taskList.innerHTML = '';
    emptyState.classList.remove('hidden');
  }
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderTasks(tasks = []) {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  for (const task of tasks) {
    const fragment = taskTemplate.content.cloneNode(true);
    const card = fragment.querySelector('article');
    card.dataset.taskId = task.id;

    const titleEl = fragment.querySelector('.task-title');
    const descEl = fragment.querySelector('.task-description');
    const metadataEl = fragment.querySelector('.task-metadata');
    const badgeEl = fragment.querySelector('.task-status-badge');
    const statusSelect = fragment.querySelector('.task-status-select');
    const saveBtn = fragment.querySelector('.task-save-btn');
    const deleteBtn = fragment.querySelector('.task-delete-btn');

    titleEl.textContent = task.title;
    if (task.description) {
      descEl.textContent = task.description;
      descEl.classList.remove('text-slate-500', 'italic');
    } else {
      descEl.textContent = 'No description provided.';
      descEl.classList.add('text-slate-500', 'italic');
    }

    const dueLabel = task.dueDate
      ? `Due ${formatDate(task.dueDate)}`
      : 'No due date assigned';
    metadataEl.textContent = `${dueLabel} • Updated ${formatDate(
      task.updatedAt
    )}`;

    const statusStyle = statusStyles[task.status] ?? statusStyles.pending;
    badgeEl.textContent = statusStyle.label;
    badgeEl.className = `rounded-full px-3 py-1 text-xs font-semibold border ${statusStyle.className} task-status-badge`;
    statusSelect.value = task.status;

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      try {
        await api(`/tasks/${task.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: statusSelect.value })
        });
        showToast('Task updated', 'success');
        await loadTasks();
      } catch (error) {
        showToast(error.message ?? 'Failed to update task', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    });

    deleteBtn.addEventListener('click', async () => {
      const confirmed = window.confirm(
        'Delete this task? This action cannot be undone.'
      );
      if (!confirmed) return;

      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting…';
      try {
        await api(`/tasks/${task.id}`, {
          method: 'DELETE'
        });
        showToast('Task deleted', 'info');
        await loadTasks();
      } catch (error) {
        showToast(error.message ?? 'Failed to delete task', 'error');
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete';
      }
    });

    taskList.appendChild(fragment);
  }
}

async function loadTasks() {
  const data = await api('/tasks');
  renderTasks(data.tasks ?? []);
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const payload = {
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password')
  };

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true
    });
    setAuth(data.token, data.user);
    registerForm.reset();
  } catch (error) {
    showToast(error.message ?? 'Registration failed', 'error');
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    email: formData.get('email'),
    password: formData.get('password')
  };

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true
    });
    setAuth(data.token, data.user);
    loginForm.reset();
  } catch (error) {
    showToast(error.message ?? 'Login failed', 'error');
  }
});

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const title = formData.get('title');
  const description = formData.get('description');
  const dueDateRaw = formData.get('dueDate');

  const payload = {
    title,
    description: description ? description : null
  };

  if (dueDateRaw) {
    const iso = new Date(`${dueDateRaw}T00:00:00`).toISOString();
    payload.dueDate = iso;
  }

  try {
    await api('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    taskForm.reset();
    showToast('Task created', 'success');
    await loadTasks();
  } catch (error) {
    showToast(error.message ?? 'Unable to create task', 'error');
  }
});

refreshButton.addEventListener('click', () => {
  loadTasks().catch((error) =>
    showToast(error.message ?? 'Unable to fetch tasks', 'error')
  );
});

logoutButton.addEventListener('click', () => {
  clearAuth();
});

updateUI();
