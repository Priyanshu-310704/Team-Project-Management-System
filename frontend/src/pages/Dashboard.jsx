import { useEffect, useState } from "react";
import api from "../api";
import "./Dashboard.css";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const [userInitial, setUserInitial] = useState("U");

  async function loadProjects() {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);

      if (res.data.length > 0 && !selectedProject) {
        setSelectedProject(res.data[0]._id);
      }
    } catch (err) {
      console.error("Error loading projects", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks(projectId) {
    if (!projectId) return;
    try {
      const res = await api.get(`/tasks/${projectId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error loading tasks", err);
    }
  }

  async function createProject(e) {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setCreatingProject(true);
    try {
      const res = await api.post("/projects", {
        title: projectTitle,
        description: "Team project"
      });
      setProjectTitle("");
      
      // Update selected project to the newly created one
      if (res.data && res.data._id) {
        setSelectedProject(res.data._id);
      }
      
      await loadProjects();
    } catch (err) {
      console.error("Error creating project", err);
    } finally {
      setCreatingProject(false);
    }
  }

  async function createTask(e) {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProject) return;

    setCreatingTask(true);
    try {
      await api.post("/tasks", {
        title: taskTitle,
        project: selectedProject
      });
      setTaskTitle("");
      loadTasks(selectedProject);
    } catch (err) {
      console.error("Error creating task", err);
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateTaskStatus(id, status) {
    try {
      await api.put(`/tasks/${id}`, { status });
      loadTasks(selectedProject);
    } catch (err) {
      console.error("Error updating task status", err);
    }
  }

  async function deleteTask(id) {
    try {
      await api.delete(`/tasks/${id}`);
      loadTasks(selectedProject);
    } catch (err) {
      console.error("Error deleting task", err);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  useEffect(() => {
    loadProjects();
    
    // Parse JWT token to get user's initials (optional / fallback)
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload && payload.name) {
          setUserInitial(payload.name.substring(0, 2).toUpperCase());
        } else if (payload && payload.email) {
          setUserInitial(payload.email.substring(0, 2).toUpperCase());
        }
      } catch (e) {
        console.error("Could not parse token for user name");
      }
    }
  }, []);

  useEffect(() => {
    loadTasks(selectedProject);
  }, [selectedProject]);

  const activeProject = projects.find((p) => p._id === selectedProject);

  // Group tasks by status
  const todoTasks = tasks.filter((t) => t.status === "todo" || !t.status);
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <span className="sidebar-title">TaskFlow</span>
        </div>

        <div className="sidebar-content">
          <div>
            <div className="project-section-title">Projects</div>
            <div className="project-list">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className={`project-item ${selectedProject === project._id ? "active" : ""}`}
                  onClick={() => setSelectedProject(project._id)}
                >
                  <span className="project-name">
                    <svg className="project-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                    </svg>
                    {project.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="project-section-title">New Project</div>
            <form onSubmit={createProject} className="add-project-form">
              <input
                value={projectTitle}
                placeholder="Project title..."
                onChange={(e) => setProjectTitle(e.target.value)}
                className="add-project-input"
                disabled={creatingProject}
              />
              <button type="submit" className="primary add-project-btn" disabled={creatingProject}>
                {creatingProject ? "..." : "+"}
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-project-info">
            {activeProject ? (
              <>
                <h1 className="header-project-title">{activeProject.title}</h1>
                <p className="header-project-desc">{activeProject.description || "Team project"}</p>
              </>
            ) : (
              <h1 className="header-project-title">No Project Selected</h1>
            )}
          </div>

          <div className="user-profile">
            <div className="user-avatar" title="Your Profile">
              {userInitial}
            </div>
            <button onClick={logout} className="logout-btn danger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </header>

        <div className="board-container">
          {projects.length === 0 ? (
            <div className="empty-state animate-fade-in">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3 className="empty-state-title">No Projects Found</h3>
              <p className="empty-state-desc">Create your first project in the sidebar to start managing your team tasks!</p>
            </div>
          ) : (
            <>
              {/* Task Creation Bar */}
              <div className="board-action-bar">
                <form onSubmit={createTask} className="add-task-form">
                  <input
                    value={taskTitle}
                    placeholder="Describe a new task..."
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="add-task-input"
                    disabled={creatingTask}
                  />
                  <button type="submit" className="primary add-task-btn" disabled={creatingTask}>
                    {creatingTask ? "Adding..." : "Add Task"}
                  </button>
                </form>
              </div>

              {/* Kanban Board */}
              <div className="board animate-fade-in">
                {/* Column: Todo */}
                <div className="board-column">
                  <div className="column-header">
                    <div className="column-title-wrapper">
                      <span className="column-dot todo"></span>
                      <h3 className="column-title">Todo</h3>
                    </div>
                    <span className="column-count">{todoTasks.length}</span>
                  </div>
                  <div className="task-list">
                    {todoTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onUpdateStatus={updateTaskStatus}
                        onDelete={deleteTask}
                      />
                    ))}
                    {todoTasks.length === 0 && <EmptyColumn />}
                  </div>
                </div>

                {/* Column: In Progress */}
                <div className="board-column">
                  <div className="column-header">
                    <div className="column-title-wrapper">
                      <span className="column-dot in-progress"></span>
                      <h3 className="column-title">In Progress</h3>
                    </div>
                    <span className="column-count">{inProgressTasks.length}</span>
                  </div>
                  <div className="task-list">
                    {inProgressTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onUpdateStatus={updateTaskStatus}
                        onDelete={deleteTask}
                      />
                    ))}
                    {inProgressTasks.length === 0 && <EmptyColumn />}
                  </div>
                </div>

                {/* Column: Done */}
                <div className="board-column">
                  <div className="column-header">
                    <div className="column-title-wrapper">
                      <span className="column-dot done"></span>
                      <h3 className="column-title">Done</h3>
                    </div>
                    <span className="column-count">{doneTasks.length}</span>
                  </div>
                  <div className="task-list">
                    {doneTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onUpdateStatus={updateTaskStatus}
                        onDelete={deleteTask}
                      />
                    ))}
                    {doneTasks.length === 0 && <EmptyColumn />}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TaskCard({ task, onUpdateStatus, onDelete }) {
  return (
    <div className="task-card">
      <h4 className="task-card-title">{task.title}</h4>
      <div className="task-card-footer">
        <div className="task-actions">
          <select
            className="task-action-select"
            value={task.status || "todo"}
            onChange={(e) => onUpdateStatus(task._id, e.target.value)}
          >
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        
        <button className="task-delete-btn" onClick={() => onDelete(task._id)} title="Delete Task">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyColumn() {
  return (
    <div style={{
      textAlign: 'center', 
      padding: '24px', 
      color: 'var(--text-tertiary)',
      border: '1px dashed var(--border-color)',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.85rem'
    }}>
      No tasks in this column
    </div>
  );
}

export default Dashboard;