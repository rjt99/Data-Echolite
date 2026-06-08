import TopBar from "../components/TopBar";

export default function Dashboard() {
  return (
    <div>
      <TopBar heading="Dashboard" username="Rajita" />
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Key Insights</h2>
        <ul className="list-disc pl-6 text-gray-700">
          <li>Customer churn increased by 12% in Q2.</li>
          <li>High churn in age group 25–34.</li>
          <li>Positive sentiment correlates with higher retention.</li>
        </ul>
      </div>
    </div>
  );
}
