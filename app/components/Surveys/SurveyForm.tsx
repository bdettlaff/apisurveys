"use client";

import { useEffect, useState } from "react";

export default function SurveyForm({ classId }: { classId: number }) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchBlocks() {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8080/api/classes/${classId}/blocks`,
        );
        const data = await res.json();
        setBlocks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlocks();
  }, [classId]);

  if (loading) return <p>Ładowanie...</p>;

  return (
    <div className="space-y-4">
      {blocks.map((b) => (
        <div key={b.id} className="p-4 border rounded-xl">
          <p className="font-bold">
            {b.teacher?.firstName} {b.teacher?.lastName}
          </p>
          <p className="text-sm text-zinc-600">{b.subject?.name}</p>
        </div>
      ))}
    </div>
  );
}
