"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  full_name: string;
  has_voted: boolean;
  section?: {
    name: string;
    grade_level: number;
  } | null;
};

export default function StudentRoster() {
  const [students, setStudents] = useState<Student[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, full_name, has_voted, section:sections(name, grade_level)")
      .order("full_name");

    if (error) {
      console.error(error);
      return;
    }

    setStudents((data as unknown as Student[] | null) ?? []);
  };

  const sectionOptions = students
    .filter((student) => student.section)
    .map((student) => student.section!)
    .filter(
      (section, index, array) =>
        array.findIndex((item) => item.name === section.name) === index,
    )
    .sort((a, b) => {
      if (a.grade_level !== b.grade_level) return a.grade_level - b.grade_level;
      return a.name.localeCompare(b.name);
    });

  const filteredStudents = students.filter((student) => {
    if (statusFilter === "voted") return student.has_voted;
    if (statusFilter === "pending") return !student.has_voted;
    if (sectionFilter !== "all") {
      if (sectionFilter === "unassigned") return !student.section;
      return student.section?.name === sectionFilter;
    }
    return true;
  });

  const groupedByGrade = filteredStudents.reduce<Record<number, Student[]>>(
    (acc, student) => {
      const grade = student.section?.grade_level ?? 0;
      if (!acc[grade]) acc[grade] = [];
      acc[grade].push(student);
      return acc;
    },
    {},
  );

  const gradeLevels = Object.keys(groupedByGrade)
    .map(Number)
    .filter((grade) => grade > 0)
    .sort((a, b) => a - b);

  const unassigned = groupedByGrade[0] ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Roster</h2>
          <p className="text-sm text-slate-600">
            {filteredStudents.length} student
            {filteredStudents.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-slate-600">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="voted">Voted</option>
            <option value="pending">Not voted</option>
          </select>
          <label className="text-sm font-semibold text-slate-600">
            Section
          </label>
          <select
            value={sectionFilter}
            onChange={(event) => setSectionFilter(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="all">All</option>
            {sectionOptions.map((section) => (
              <option key={section.name} value={section.name}>
                Grade {section.grade_level} · {section.name}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {gradeLevels.map((grade) => (
          <div key={grade}>
            <h3 className="text-sm font-semibold text-slate-600 mb-3">
              Grade {grade}
            </h3>
            <div className="grid gap-3">
              {groupedByGrade[grade].map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {student.full_name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {student.section
                        ? `Section ${student.section.name}`
                        : "No section"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      student.has_voted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {student.has_voted ? "Voted" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {unassigned.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-3">
              Unassigned
            </h3>
            <div className="grid gap-3">
              {unassigned.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {student.full_name}
                    </p>
                    <p className="text-sm text-slate-600">No section</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      student.has_voted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {student.has_voted ? "Voted" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-slate-500">No students yet.</div>
        )}
      </div>
    </div>
  );
}
