"use client";

import { useEffect, useState } from "react";

type SchoolClass = {
    id: number;
    name: string;
};

type SurveyBlock = {
    id: number;
    teacherName: string;
    subjectName: string;
    module: string;
};

export default function CreateSurveyPage() {

    const userRole = "ADMIN";

    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [blocks, setBlocks] = useState<SurveyBlock[]>([]);

    const [classId, setClassId] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");



    useEffect(() => {

        fetch("http://localhost:8080/api/classes")
            .then((res) => res.json())
            .then((data) => setClasses(data))
            .catch(() => {
                setClasses([]);
            });

    }, []);


    useEffect(() => {

        if (!classId) {
            setBlocks([]);
            return;
        }

        fetch(`http://localhost:8080/api/classes/${classId}/blocks`)
            .then((res) => res.json())
            .then((data: SurveyBlock[]) => {
                setBlocks(data);
            })
            .catch(() => {
                setBlocks([]);
            });

    }, [classId]);

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!classId || !startDate || !endDate) {

            alert("Uzupełnij klasę oraz daty");

            return;
        }

        if (startDate > endDate) {

            alert(
                "Data rozpoczęcia musi być wcześniejsza niż data zakończenia"
            );

            return;
        }

        const survey = {
            classId: Number(classId),
            startDate,
            endDate,
        };

        const response = await fetch(
            "http://localhost:8080/api/admin/surveys",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(survey),
            }
        ).catch(() => null);

        if (response?.ok) {

            alert("Ankieta została utworzona");

        } else {

            alert("Nie udało się utworzyć ankiety");

        }
    };

    const selectedClass = classes.find(
        (c) => String(c.id) === classId
    );
    if (userRole !== "ADMIN") {

        return (
            <main className="p-8">

                <h1 className="text-red-500 text-2xl font-bold">

                    Nie masz dostępu do tej strony

                </h1>

            </main>
        );
    }

    return (

        <div className="min-h-screen bg-zinc-50">

            <main className="flex flex-col items-center pt-32 px-6">

                <div className="w-full max-w-3xl p-10 bg-white rounded-2xl shadow-xl border border-zinc-200">

                    <h1 className="text-3xl font-black mb-8">

                        Tworzenie ankiety

                    </h1>

                    <form
                        className="flex flex-col gap-4"
                        onSubmit={handleSubmit}
                    >



                        <select
                            className="border p-3 rounded-xl"
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                        >

                            <option value="">

                                Wybierz klasę

                            </option>

                            {classes.map((schoolClass) => (

                                <option
                                    key={schoolClass.id}
                                    value={schoolClass.id}
                                >

                                    {schoolClass.name}

                                </option>

                            ))}

                        </select>



                        <div>

                            <label className="font-semibold">

                                Data rozpoczęcia

                            </label>

                            <input
                                className="border p-3 rounded-xl w-full mt-1"
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                            />

                        </div>


                        <div>

                            <label className="font-semibold">

                                Data zakończenia

                            </label>

                            <input
                                className="border p-3 rounded-xl w-full mt-1"
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(e.target.value)
                                }
                            />

                        </div>

                        {/* PODGLĄD */}

                        <div className="border rounded-2xl p-5 mt-4 bg-zinc-50">

                            <h2 className="text-xl font-bold mb-3">

                                Podgląd ankiety

                            </h2>

                            <p>

                                Klasa: {selectedClass?.name || "Nie wybrano"}

                            </p>

                            <p>

                                Data rozpoczęcia:
                                {" "}
                                {startDate || "Nie wybrano"}

                            </p>

                            <p>

                                Data zakończenia:
                                {" "}
                                {endDate || "Nie wybrano"}

                            </p>

                            <h3 className="font-bold mt-5 mb-2">

                                Bloki oceny:

                            </h3>

                            {blocks.length === 0 ? (

                                <p className="text-zinc-500">

                                    Brak bloków do wyświetlenia.

                                </p>

                            ) : (

                                <ul className="flex flex-col gap-2">

                                    {blocks.map((block) => (

                                        <li
                                            key={block.id}
                                            className="border rounded-xl p-3 bg-white"
                                        >

                                            <p className="font-semibold">

                                                {block.teacherName}

                                            </p>

                                            <p className="text-sm text-zinc-600">

                                                {block.subjectName}

                                            </p>

                                            <p className="text-xs text-zinc-400">

                                                Moduł pytań:
                                                {" "}
                                                {block.module}

                                            </p>

                                        </li>

                                    ))}

                                </ul>

                            )}

                        </div>


                        <button
                            type="submit"
                            className="bg-black text-white rounded-xl p-3 font-bold mt-4"
                        >

                            Utwórz ankietę

                        </button>

                    </form>

                </div>

            </main>

        </div>
    );
}