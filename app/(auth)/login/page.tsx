import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Iniciar sesión</h1>
      <LoginForm />
    </div>
  );
}
