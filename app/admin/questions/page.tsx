"use client";

import { useEffect, useState } from "react";

type Category = {
  id: number;
  name: string;
};

type Question = {
  id: string;
  content: string;
  type: string;
  module: string;
  classRequirement: string;
  isActive: boolean;
  category: Category;
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchCategories = () => {
    fetch("http://localhost:8080/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  };

  useEffect(() => {
    fetch("http://localhost:8080/api/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data));
    fetchCategories();
  }, []);

  const filtered = questions.filter((q) => {
    const matchSearch = q.content.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory
      ? q.category?.id === Number(filterCategory)
      : true;
    return matchSearch && matchCategory;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to pytanie?")) return;
    await fetch(`http://localhost:8080/api/questions/${id}`, {
      method: "DELETE",
    });
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Wpisz nazwę kategorii!");
      return;
    }
    await fetch("http://localhost:8080/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    setNewCategoryName("");
    fetchCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Usunąć tę kategorię?")) return;
    await fetch(`http://localhost:8080/api/categories/${id}`, {
      method: "DELETE",
    });
    fetchCategories();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", color: "#f1f5f9" }}>
      <h1>Baza Pytań</h1>

      {/* Sekcja kategorii */}
      <div style={{ marginBottom: "2rem", padding: "1rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem", color: "#f1f5f9" }}>Zarządzanie kategoriami</h2>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input
            type="text"
            placeholder="Nazwa nowej kategorii..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: "0.9rem", width: "250px" }}
          />
          <button
            onClick={handleAddCategory}
            style={{ padding: "0.4rem 1rem", background: "#22c55e", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            + Dodaj kategorię
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {categories.map((cat) => (
            <span key={cat.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#2563eb", color: "#ffffff", padding: "0.3rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem" }}>
              {cat.name}
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#fca5a5", fontWeight: "bold", fontSize: "1rem", lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Przycisk dodaj pytanie */}
      <a href="/admin/questions/new">
        <button style={{ marginBottom: "1rem", padding: "0.5rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          + Dodaj pytanie
        </button>
      </a>

      {/* Wyszukiwarka i filtr */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Szukaj pytania..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "0.5rem", width: "300px", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9" }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9" }}
        >
          <option value="">Wszystkie kategorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Tabela pytań */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#1e293b" }}>
            <th style={th}>Treść pytania</th>
            <th style={th}>Typ</th>
            <th style={th}>Kategoria</th>
            <th style={th}>Moduł</th>
            <th style={th}>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "1rem", color: "#94a3b8" }}>
                Brak pytań
              </td>
            </tr>
          )}
          {filtered.map((q) => (
            <tr key={q.id} style={{ borderBottom: "1px solid #334155" }}>
              <td style={td}>{q.content}</td>
              <td style={td}>{q.type === "SCALE" ? "Skala 1-5" : "Otwarte"}</td>
              <td style={td}>{q.category?.name ?? "—"}</td>
              <td style={td}>{q.module}</td>
              <td style={td}>
                <a href={`/admin/questions/${q.id}`}>
                  <button style={{ ...btn, background: "#f59e0b" }}>Edytuj</button>
                </a>
                <button onClick={() => handleDelete(q.id)} style={{ ...btn, background: "#ef4444" }}>
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "0.75rem",
  textAlign: "left",
  fontWeight: "bold",
  borderBottom: "2px solid #334155",
  color: "#f1f5f9",
};

const td: React.CSSProperties = {
  padding: "0.75rem",
  color: "#f1f5f9",
};

const btn: React.CSSProperties = {
  marginRight: "0.5rem",
  padding: "0.3rem 0.75rem",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};