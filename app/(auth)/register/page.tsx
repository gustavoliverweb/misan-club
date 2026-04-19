import { connection } from "next/server";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  await connection(); // waits for the real request before reading params (required with PPR)
  const { ref } = await searchParams;
  console.log("Search params en RegisterPage:", { ref });
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Crear cuenta</h1>
      <RegisterForm sponsorRef={ref} />
    </div>
  );
}
