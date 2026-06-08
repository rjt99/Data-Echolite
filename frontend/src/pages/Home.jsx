import TopBar from "../components/TopBar";
import WorkflowCard from "../components/WorkflowCard";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <TopBar heading="Workflows" username="Rajita" />
      <div className="p-6">
        <button
          onClick={() => navigate("/create")}
          className="bg-[var(--primary)] text-white px-6 py-3 rounded mb-6 hover:opacity-90"
        >
          + Create a new Workflow
        </button>
        <div className="grid grid-cols-3 gap-4">
          <WorkflowCard title="Customer Data Cleanup" description="Processed workflow with insights." />
          <WorkflowCard title="Sales Trend Analysis" description="Workflow completed with charts." />
          <WorkflowCard title="Social Media Sentiment" description="Workflow processed successfully." />
        </div>
      </div>
    </div>
  );
}
