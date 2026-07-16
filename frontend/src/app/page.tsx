"use client";

import { useCallback, useEffect, useState } from "react";

interface Item {
  id: string;
  title: string;
  description?: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const API_BASE = API_URL;
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Pending");

  // Fetch health and items data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Check API Health
      const healthRes = await fetch(`${API_BASE}/health`, {
        signal: AbortSignal.timeout(4000),
      });
      if (healthRes.ok) {
        setIsApiOnline(true);
      } else {
        setIsApiOnline(false);
      }

      // 2. Fetch Items
      const itemsRes = await fetch(`${API_BASE}/items`);
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }
    } catch (err) {
      console.error("Error communicating with backend:", err);
      setIsApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchData]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          status,
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setItems((prev) => [...prev, newItem]);
        // Reset form
        setTitle("");
        setDescription("");
        setStatus("Pending");
      } else {
        setErrorMsg("Failed to add new item. Check your backend server log.");
      }
    } catch {
      setErrorMsg("Network error. Could not reach backend API.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Item Deletion
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setErrorMsg("Failed to delete item.");
      }
    } catch {
      setErrorMsg("Network error. Could not delete item.");
    }
  };

  // Count items stats
  const totalTasks = items.length;
  const completedTasks = items.filter((t) => t.status === "Completed").length;
  const pendingTasks = items.filter((t) => t.status === "Pending").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Ambient Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">
              R
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                rangkul
              </span>
              <span className="text-xs block text-slate-400 font-medium tracking-wider uppercase -mt-1">
                Monorepo Base
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicator */}
            {isApiOnline === null ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Checking API...
              </span>
            ) : isApiOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
                API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                API Offline
              </span>
            )}

            <a
              href={`${API_ORIGIN}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium px-4 py-2 rounded-lg transition-all"
            >
              Swagger Docs
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10 z-10">
        
        {/* Error Alert Banner */}
        {isApiOnline === false && (
          <div className="mb-8 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-sm flex items-start gap-3 backdrop-blur-sm animate-fadeIn">
            <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Backend Connection Failed</p>
              <p className="mt-1 opacity-90">
                The frontend is unable to reach the FastAPI backend at <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">{API_URL}</code>.
                Make sure you started the backend server by running <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">docker-compose up</code> or running Uvicorn manually inside the <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">backend</code> folder.
              </p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <section className="mb-10 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Welcome to Rangkul Monorepo
          </h2>
          <p className="mt-2 text-slate-400 max-w-2xl text-base md:text-lg">
            This dashboard communicates dynamically with the FastAPI backend. You can add tasks, view real-time data syncs, and check service integrations below.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold">{loading ? "..." : totalTasks}</span>
              <span className="text-xs text-indigo-400 font-medium">in-memory</span>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed Tasks</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-emerald-400">{loading ? "..." : completedTasks}</span>
              <span className="text-xs text-slate-500 font-medium">/ {totalTasks} total</span>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Tasks</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-purple-400">{loading ? "..." : pendingTasks}</span>
              <span className="text-xs text-slate-500 font-medium">remaining</span>
            </div>
          </div>
        </section>

        {/* Split Form & Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Task Form (Left Column) */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl sticky top-24">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white mb-5">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Demo Task
              </h3>
              
              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    disabled={!isApiOnline || submitting}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Test production deployment"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="desc" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="desc"
                    rows={3}
                    disabled={!isApiOnline || submitting}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about this step..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all resize-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    id="status"
                    disabled={!isApiOnline || submitting}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!isApiOnline || submitting || !title.trim()}
                  className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm cursor-pointer"
                >
                  {submitting ? "Adding..." : "Add to Backend"}
                </button>
              </form>
            </div>
          </div>

          {/* Task Grid/List (Right Columns) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Sync Status Card List
              </h3>
              
              <button
                onClick={fetchData}
                disabled={loading}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8.89M9 11l3-3m0 0l3 3m-3-3v12" />
                </svg>
                Sync Data
              </button>
            </div>

            {loading && items.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-slate-900/40 border border-slate-850 h-28 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="border-2 border-dashed border-slate-850 rounded-2xl p-12 text-center">
                <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-slate-400 font-medium">No items in the list</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isApiOnline ? "Create a task using the form on the left!" : "Connect the API service to load backend items."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 hover:border-indigo-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <span
                          className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {item.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/40 mt-4 pt-3.5">
                      <span className="text-[10px] font-mono text-slate-500">ID: {item.id}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        title="Delete task from backend"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tech Stack Info Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl mt-6">
              <h4 className="font-bold text-white mb-2">🚀 Deploying this monorepo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                This project contains multi-stage containerizations built for production.
                The <strong>FastAPI Backend</strong> exposes automated OpenAPI documentation and runs via Uvicorn.
                The <strong>Next.js Frontend</strong> compiles as a <code>standalone</code> bundle, keeping docker image sizes minimal and optimal for Vercel, Cloud Run, or VPS architectures.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-[10px] bg-slate-950 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800">FastAPI</span>
                <span className="text-[10px] bg-slate-950 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800">Next.js 15+</span>
                <span className="text-[10px] bg-slate-950 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800">Tailwind CSS v4</span>
                <span className="text-[10px] bg-slate-950 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800">Docker Standalone</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Rangkul Monorepo Base. Ready for production deployments.</p>
          <div className="flex gap-4">
            <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">FastAPI Docs</a>
            <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Next.js Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
