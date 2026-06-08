import { User } from "lucide-react";

export default function TopBar({ heading, username }) {
  return (
    <div className="flex justify-between items-center bg-white shadow px-6 py-3">
      <h1 className="text-xl font-semibold text-[var(--primary)]">{heading}</h1>
      <div className="flex items-center space-x-2">
        <User className="text-[var(--primary)]" />
        <span className="text-sm">{username}</span>
      </div>
    </div>
  );
}
