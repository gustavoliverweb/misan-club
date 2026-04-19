export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            Misan<span className="text-blue-600">Club</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
