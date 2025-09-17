import Navbar from "@/components/ui/navbar";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">Projects</h1>
        <p className="text-gray-600">You are logged in! This is the next page after login.</p>
      </div>
    </div>
  );
}
