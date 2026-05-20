"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Category = {
  id: number;
  name: string;
};

export default function EditQuestionPage() {
  const router = useRouter();
  const { id } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    content: "",
    type: "SCALE",
    module: "",
    classRequirement: "",
    categoryId: "",
  });

  useEffect(() => {
    // Pobierz kategorie
    fetch("http://localhost:8080/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));

    // Pobierz dane istniejącego pytania
    fetch(`http://localhost:8080/api/questions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          content: data.content,
          type: data.type,
          module: data.module ?? "",
          classRequirement: data.classRequirement ?? "",
          categoryId: data.category?.id?.toString() ?? "",
        });
      });
  }, [id]);

  const handleSubmit = async () => {
    if (!form.content || !form.categoryId) {
      alert("Wypełnij treść pytania i wybierz kategorię!");
      return;
    }

    await fetch(`http://localhost:8080/api/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: form.content,
        type: form.type,
        module: form.module,
        classRequirement: form.classRequirement,
        category: { id: Number(form.categoryId) },
      }),
    });

    router.push("/admin/questions");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "600px" }}>
      <h1>Edytuj pytanie</h1>

      <label style={label}>Treść pytania</label>
      <textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        rows={4}
        style={{ ...input, resize: "vertical" }}
        placeholder="Wpisz treść pytania..."
      />

      <label style={label}>Typ pytania</label>
      <select
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
        style={input}
      >
        <option value="SCALE">Skala 1–5</option>
        <option value="OPEN">Pytanie otwarte</option>
      </select>

      <label style={label}>Kategoria</label>
      <select
        value={form.categoryId}
        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        style={input}
      >
        <option value="">-- Wybierz kategorię --</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <label style={label}>Moduł</label>
      <input
        type="text"
        value={form.module}
        onChange={(e) => setForm({ ...form, module: e.target.value })}
        style={input}
        placeholder="np. Matematyka"
      />

      <label style={label}>Wymagania klasy</label>
      <input
        type="text"
        value={form.classRequirement}
        onChange={(e) => setForm({ ...form, classRequirement: e.target.value })}
        style={input}
        placeholder="np. klasa 3"
      />

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button onClick={handleSubmit} style={{ ...btn, background: "#2563eb" }}>
          Zapisz zmiany
        </button>
        <button
          onClick={() => router.push("/admin/questions")}
          style={{ ...btn, background: "#6b7280" }}
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}

const label: React.CSSProperties = {
  display: "block",
  marginTop: "1rem",
  marginBottom: "0.25rem",
  fontWeight: "bold",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
};

const btn: React.CSSProperties = {
  padding: "0.6rem 1.5rem",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "1rem",
};