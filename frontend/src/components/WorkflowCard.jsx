export default function WorkflowCard({ title, description }) {
  return (
    <div className="bg-white shadow rounded p-4 hover:shadow-lg transition">
      <h2 className="text-lg font-semibold text-[var(--primary)]">{title}</h2>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
