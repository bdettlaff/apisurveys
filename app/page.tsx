import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Witaj w aplikacji</h1>
      <Link
        href="/login"
        className="px-6 py-2 bg-zinc-900 text-white rounded-lg"
      >
        Przejdź do logowania
      </Link>
    </div>
  );
}
