"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

// Sample data structure
const testStats = [
  { project: "Project A", passed: 120, failed: 30 },
  { project: "Project B", passed: 80, failed: 20 },
  { project: "Project C", passed: 150, failed: 10 },
];

const reviewReasons = [
  { reason: "ENV_ISSUE", count: 12 },
  { reason: "TEST_SCRIPT_ISSUE", count: 8 },
  { reason: "FLAKY_TEST", count: 15 },
  { reason: "DATA_ISSUE", count: 5 },
  { reason: "OTHER", count: 3 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Test Results Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Tests Passed/Failed per Project</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={testStats}>
              <Legend />
              <Bar dataKey="passed" fill="#00C49F" name="Passed" />
              <Bar dataKey="failed" fill="#FF8042" name="Failed" />
            </BarChart>
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
