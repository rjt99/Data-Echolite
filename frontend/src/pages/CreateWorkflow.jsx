import TopBar from "../components/TopBar";
import { useNavigate } from "react-router-dom";

export default function CreateWorkflow() {
  const navigate = useNavigate();

  return (
    <div>
      <TopBar heading="Create Workflow" username="Rajita" />
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Upload or Enter Data</h2>
        <input type="file" className="mb-4" />
        <input type="text" placeholder="Enter URL" className="w-full border p-2 mb-4 rounded" />
        <textarea placeholder="Enter text, images, video links..." className="w-full border p-2 mb-4 rounded"></textarea>
        <button
          onClick={() => navigate("/processing")}
          className="bg-[var(--primary)] text-white px-6 py-2 rounded hover:opacity-90"
        >
          Process
        </button>
      </div>
    </div>
  );
}
