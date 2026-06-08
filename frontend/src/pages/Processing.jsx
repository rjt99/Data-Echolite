import TopBar from "../components/TopBar";
import { useNavigate } from "react-router-dom";

export default function Processing() {
  const navigate = useNavigate();

  return (
    <div>
      <TopBar heading="Processing Workflow" username="Rajita" />
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Inputs</h2>
          <p>File: customer_data.csv</p>
          <p>URL: https://example.com/data</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Agents Executing</h2>
          <div className="flex space-x-4">
            <div className="w-6 h-6 bg-[var(--primary)] rounded-full animate-bounce"></div>
            <div className="w-6 h-6 bg-[var(--primary)] rounded-full animate-bounce delay-150"></div>
            <div className="w-6 h-6 bg-[var(--primary)] rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Streaming Output</h2>
          <p className="font-mono text-gray-700">Reasoning token stream... (hardcoded)</p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-[var(--primary)] text-white px-6 py-2 rounded hover:opacity-90"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
