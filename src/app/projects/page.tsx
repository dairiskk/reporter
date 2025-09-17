"use client";

import { useEffect, useState } from "react";
import { ProjectList, ProjectCreate } from "@/components/ui/project-list";
import { useToast } from "@/components/ui/toast-provider";
import Navbar from "@/components/ui/navbar";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => showToast("Failed to load projects", "error"));
  }, [showToast]);

  function handleCreate(name: string) {
    fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ name }),
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.id && data.name) {
          setProjects(prev => [...prev, { id: data.id, name: data.name }]);
          showToast("Project created", "success");
        } else {
          showToast(data.error || "Failed to create project", "error");
        }
      })
      .catch(() => showToast("Failed to create project", "error"));
  }

  function handleDelete(id: string) {
    fetch(`/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProjects(prev => prev.filter(p => p.id !== id));
          showToast("Project deleted", "success");
        } else {
          showToast(data.error || "Failed to delete project", "error");
        }
      })
      .catch(() => showToast("Failed to delete project", "error"));
  }

  function handleSelect(id: string) {
    router.push(`/projects/details?id=${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">Projects</h1>
        <ProjectCreate onCreate={handleCreate} />
        <ProjectList projects={projects} onSelect={handleSelect} onDelete={handleDelete} />
      </div>
    </div>
  );
}
