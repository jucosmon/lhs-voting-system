"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Section = {
  id: number;
  name: string;
  grade_level: number;
};

const gradeLevels = [7, 8, 9, 10, 11, 12];

export default function SectionManagement() {
  const [sections, setSections] = useState<Section[]>([]);
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number>(7);
  const [editingId, setEditingId] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .order("grade_level")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setSections(data ?? []);
  };

  const resetForm = () => {
    setName("");
    setGradeLevel(7);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      grade_level: gradeLevel,
    };

    if (editingId) {
      await supabase.from("sections").update(payload).eq("id", editingId);
    } else {
      await supabase.from("sections").insert(payload);
    }

    resetForm();
    loadSections();
  };

  const handleEdit = (section: Section) => {
    setEditingId(section.id);
    setName(section.name);
    setGradeLevel(section.grade_level);
  };

  const handleDelete = async (sectionId: number) => {
    if (!confirm("Delete this section?")) return;
    await supabase.from("sections").delete().eq("id", sectionId);
    loadSections();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Sections</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="section-name">Section name</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="7-A"
              className="h-12"
              required
            />
          </div>
          <div>
            <Label htmlFor="section-grade">Grade level</Label>
            <select
              id="section-grade"
              className="w-full h-12 px-3 rounded-md border border-slate-300"
              value={gradeLevel}
              onChange={(event) =>
                setGradeLevel(Number.parseInt(event.target.value, 10))
              }
            >
              {gradeLevels.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="gap-2">
            <Plus className="w-4 h-4" />
            {editingId ? "Update" : "Add"} Section
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
          >
            <div>
              <p className="font-semibold text-slate-900">{section.name}</p>
              <p className="text-sm text-slate-600">
                Grade {section.grade_level}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(section)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(section.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
