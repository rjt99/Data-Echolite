import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="bg-white shadow-lg rounded p-8 w-96">
        <h2 className="text-2xl font-bold text-center text-[var(--primary)] mb-6">Login</h2>
        <input type="text" placeholder="Username" className="w-full border p-2 mb-4 rounded" />
        <input type="password" placeholder="Password" className="w-full border p-2 mb-4 rounded" />
        <button
          onClick={() => navigate("/home")}
          className="w-full bg-[var(--primary)] text-white py-2 rounded hover:opacity-90"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
