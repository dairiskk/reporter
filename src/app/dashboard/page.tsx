"use client";
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog } from "@headlessui/react";
import Navbar from "@/components/ui/navbar";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

type Project = { id: string; name: string };
type ReportFile = { id: string; name?: string; createdAt?: string };
type TestStat = { status: string; count: number };
type ReviewReason = { reason: string; count: number };

// Helper to fetch with JWT
function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [reportFiles, setReportFiles] = useState<ReportFile[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [testStats, setTestStats] = useState<TestStat[]>([]);
  const [reviewReasons, setReviewReasons] = useState<ReviewReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);

  // New state for multiple project/report pairs
  const [projectReportPairs, setProjectReportPairs] = useState([
    { projectId: "", reportIds: [] as string[], projectSearch: "", reportFileSearch: "" }
  ]);

  // Helper to update a pair
  function updatePair(index: number, changes: Partial<typeof projectReportPairs[0]>) {
    setProjectReportPairs(pairs => pairs.map((pair, i) => i === index ? { ...pair, ...changes } : pair));
  }

  // Helper to add a new pair
  function addPair() {
    setProjectReportPairs(pairs => [...pairs, { projectId: "", reportIds: [], projectSearch: "", reportFileSearch: "" }]);
  }

  // Helper to remove a pair
  function removePair(index: number) {
    setProjectReportPairs(pairs => pairs.filter((_, i) => i !== index));
  }

  useEffect(() => {
    fetchWithAuth("/api/projects")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          setError("");
        } else {
          setProjects([]);
          setError(data.error || "Failed to load projects");
        }
      })
      .catch(() => {
        setProjects([]);
        setError("Failed to load projects");
      });
  }, []);

  // Fetch report files for each selected project
  useEffect(() => {
    projectReportPairs.forEach((pair, idx) => {
      if (!pair.projectId) return;
      fetchWithAuth(`/api/projects/${pair.projectId}/results/upload`).then(res => res.json()).then(r => {
        const files = Array.isArray(r.files) ? r.files : [];
        updatePair(idx, { availableReports: files });
      });
    });
  }, [projectReportPairs.map(p => p.projectId).join(",")]);

  // When applying filters, aggregate all selected project/report IDs
  function applyFilters() {
    setSelectedProjects(projectReportPairs.map(p => p.projectId).filter(Boolean));
    setSelectedReports(projectReportPairs.flatMap(p => p.reportIds));
    setFilterOpen(false);
  }

  // Fetch summary and review reasons based on selected projects/reports/date range
  useEffect(() => {
    const params = new URLSearchParams();
    selectedProjects.forEach(id => params.append("projectIds[]", id));
    selectedReports.forEach(id => params.append("reportFileIds[]", id));
    if (dateRange.start) params.append("startDate", dateRange.start);
    if (dateRange.end) params.append("endDate", dateRange.end);
    setLoading(true);
    Promise.all([
      fetchWithAuth(`/api/summary?${params}`).then(res => res.json()),
      fetchWithAuth(`/api/review-reasons?${params}`).then(res => res.json()),
    ]).then(([summary, reasons]) => {
      setTestStats(summary.summary);
      setReviewReasons(reasons.reasons);
      setLoading(false);
    });
  }, [selectedProjects, selectedReports, dateRange]);

  // Compute reviewed vs not reviewed for pie chart
  const reviewedStats = React.useMemo(() => {
    const reviewed = testStats.find(s => s.status === "reviewed")?.count || 0;
    const notReviewed = testStats.reduce((acc, s) => acc + (s.status !== "reviewed" ? s.count : 0), 0);
    return [
      { name: "Reviewed", value: reviewed },
      { name: "Not Reviewed", value: notReviewed }
    ];
  }, [testStats]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className={`p-8${filterOpen ? ' blur-sm pointer-events-none select-none' : ''}`}> 
        <h1 className="text-3xl font-bold mb-8">Test Results Dashboard</h1>
        <div className="mb-6 flex justify-start">
          <Button
            onClick={() => setFilterOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1 rounded-lg shadow flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 14.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17V14.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
            Filter
          </Button>
        </div>
        <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-opacity-30" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-xl mx-auto" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setFilterOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <Dialog.Title className="text-xl font-bold mb-4">Filter Dashboard</Dialog.Title>
            {projectReportPairs.map((pair, idx) => (
              <div key={idx} className="mb-6 border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold">Project {idx + 1}</label>
                  {projectReportPairs.length > 1 && (
                    <button className="text-red-500 text-lg" onClick={() => removePair(idx)}>&times;</button>
                  )}
                </div>
                <input
                  type="text"
                  className="border rounded-lg p-2 w-full mb-2"
                  placeholder="Search projects..."
                  value={pair.projectSearch}
                  onChange={e => updatePair(idx, { projectSearch: e.target.value })}
                />
                <select
                  className="border rounded p-2 w-full mb-2"
                  value={pair.projectId}
                  onChange={e => updatePair(idx, { projectId: e.target.value, reportIds: [] })}
                >
                  <option value="">Select a project</option>
                  {projects.filter(p => p.name.toLowerCase().includes(pair.projectSearch.toLowerCase())).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {/* Report files for this project */}
                {pair.projectId && (
                  <>
                    <input
                      type="text"
                      className="border rounded-lg p-2 w-full mb-2"
                      placeholder="Search report files..."
                      value={pair.reportFileSearch}
                      onChange={e => updatePair(idx, { reportFileSearch: e.target.value })}
                    />
                    <select
                      multiple
                      className="border rounded p-2 w-full"
                      value={pair.reportIds}
                      onChange={e => updatePair(idx, { reportIds: Array.from(e.target.selectedOptions, o => o.value) })}
                    >
                      {(pair.availableReports || [])
                        .filter(f => (f.name || "").toLowerCase().includes(pair.reportFileSearch.toLowerCase()))
                        .map((f, i) => (
                          <option key={f.id || i} value={f.id}>
                            {f.name || `Report ${f.id}`} — {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "No date"}
                          </option>
                        ))}
                    </select>
                  </>
                )}
              </div>
            ))}
            <div className="flex justify-between gap-2 mt-2">
              <Button className="bg-gray-100 px-2 py-1" onClick={addPair}>+ Add Project</Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => { setProjectReportPairs([{ projectId: "", reportIds: [], projectSearch: "", reportFileSearch: "" }]); setDateRange({ start: "", end: "" }); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-4 py-1 rounded-lg shadow"
                >
                  Clear
                </Button>
                <Button
                  onClick={applyFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-1 rounded-lg shadow flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Apply
                </Button>
              </div>
            </div>
            {/* Date range picker stays outside pairs */}
            <div className="mb-4 mt-6">
              <label className="block font-semibold mb-1">Date Range</label>
              <div className="flex gap-2 mb-2">
                <Input type="date" value={dateRange.start} onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))} />
                <Input type="date" value={dateRange.end} onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button className="bg-gray-100 px-2 py-1" onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setDateRange({ start: today, end: today });
                }}>Today</Button>
                <Button className="bg-gray-100 px-2 py-1" onClick={() => {
                  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                  const today = new Date().toISOString().slice(0, 10);
                  setDateRange({ start: weekAgo, end: today });
                }}>Last 7 days</Button>
                <Button className="bg-gray-100 px-2 py-1" onClick={() => setDateRange({ start: "", end: "" })}>Clear</Button>
              </div>
            </div>
          </div>
        </Dialog>
        {/* Charts only on main page */}
        {selectedProjects.length === 0 && selectedReports.length === 0 && !dateRange.start && !dateRange.end ? (
          <div className="text-center py-12 text-gray-500 text-lg">No data selected. Please use the Filter button to choose projects, reports, or date range.</div>
        ) : loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-bold mb-4">Test Status Summary</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={testStats}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#00C49F" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-bold mb-4">Reviewed vs Not Reviewed</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reviewedStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {reviewedStats.map((entry, index) => (
                      <Cell key={entry.name || index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-bold mb-4">Most Common Review Reasons</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reviewReasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {reviewReasons.map((entry, index) => (
                      <Cell key={entry.reason || index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
