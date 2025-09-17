import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProjectList({ projects, onSelect, onDelete }: {
  projects: { id: string; name: string }[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {projects.map(project => (
        <li key={project.id} className="flex items-center justify-between bg-white rounded shadow px-4 py-2">
          <span className="font-medium">{project.name}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onSelect(project.id)}>
              Show details
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(project.id)}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProjectCreate({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = React.useState("");
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (name.trim()) {
          onCreate(name.trim());
          setName("");
        }
      }}
      className="flex gap-2 mb-6"
    >
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="New project name"
        className="flex-1"
        required
      />
      <Button type="submit">Create</Button>
    </form>
  );
}
