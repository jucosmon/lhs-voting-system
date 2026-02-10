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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Student Roster</h2>
        <span className="text-sm font-semibold text-slate-600">
          {students.length} students
        </span>
      </div>

      <div className="grid gap-3">
        {students.map((student) => (
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
                  ? `Grade ${student.section.grade_level} · ${student.section.name}`
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

        {students.length === 0 && (
          <div className="p-8 text-center text-slate-500">No students yet.</div>
        )}
      </div>
    </div>
  );
}
