"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Section = {
  id: number;
  name: string;
  grade_level: number;
};

export default function FacilitatorSectionSelect() {
  const [sections, setSections] = useState<Section[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const { data } = await supabase
      .from("sections")
      .select("id, name, grade_level")
      .order("grade_level")
      .order("name");

    setSections(data ?? []);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <UsersRound className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Facilitator Portal
              </h1>
              <p className="text-sm text-slate-600">
                Select a section to manage students and voting
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Choose a Section
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/facilitator/${section.id}`}
                className="rounded-xl border border-slate-200 p-5 hover:shadow-md transition"
              >
                <p className="text-lg font-semibold text-slate-900">
                  {section.name}
                </p>
                <p className="text-sm text-slate-600">
                  Grade {section.grade_level}
                </p>
              </Link>
            ))}
          </div>

          {sections.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              No sections yet. Add sections in the admin portal first.
            </div>
          )}

          <div className="mt-6">
            <Link href="/admin">
              <Button variant="outline">Go to Admin Portal</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
