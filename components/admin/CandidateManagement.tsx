"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Edit2, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";

const POSITIONS = [
  "President",
  "Vice-President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Public Information Officer",
  "Protocol Officer",
  "Grade Level Representative",
];

const GRADE_LEVELS = [8, 9, 10, 11, 12];

type Partylist = {
  id: string;
  name: string;
  color_hex: string;
};

type Candidate = {
  id: string;
  full_name: string;
  position: string;
  partylist_id: string;
  target_grade_level: number | null;
  partylist?: Partylist | null;
};

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [partylists, setPartylists] = useState<Partylist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    position: "",
    partylist_id: "",
    target_grade_level: null as number | null,
  });

  const supabase = createClient();

  useEffect(() => {
    loadCandidates();
    loadPartylists();
  }, []);

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("*, partylist:partylists(name, color_hex)")
      .order("position");

    if (error) {
      console.error(error);
      return;
    }

    setCandidates(data ?? []);
  };

  const loadPartylists = async () => {
    const { data, error } = await supabase
      .from("partylists")
      .select("id, name, color_hex")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setPartylists(data ?? []);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      ...formData,
      target_grade_level:
        formData.position === "Grade Level Representative"
          ? formData.target_grade_level
          : null,
    };

    if (editingId) {
      await supabase.from("candidates").update(payload).eq("id", editingId);
    } else {
      await supabase.from("candidates").insert(payload);
    }

    resetForm();
    loadCandidates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    await supabase.from("candidates").delete().eq("id", id);
    loadCandidates();
  };

  const handleEdit = (candidate: Candidate) => {
    setFormData({
      full_name: candidate.full_name,
      position: candidate.position,
      partylist_id: candidate.partylist_id,
      target_grade_level: candidate.target_grade_level,
    });
    setEditingId(candidate.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      position: "",
      partylist_id: "",
      target_grade_level: null,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const normalizedTarget =
    formData.position === "Grade Level Representative"
      ? formData.target_grade_level
      : null;

  const hasPositionConflict = candidates.some((candidate) => {
    if (editingId && candidate.id === editingId) return false;
    if (candidate.partylist_id !== formData.partylist_id) return false;
    if (candidate.position !== formData.position) return false;
    if (candidate.position === "Grade Level Representative") {
      return candidate.target_grade_level === normalizedTarget;
    }
    return true;
  });

  const groupedByPartylist = partylists.reduce<Record<string, Candidate[]>>(
    (acc, party) => {
      acc[party.id] = [];
      return acc;
    },
    {},
  );

  candidates.forEach((candidate) => {
    if (!candidate.partylist_id) return;
    if (!groupedByPartylist[candidate.partylist_id]) {
      groupedByPartylist[candidate.partylist_id] = [];
    }
    groupedByPartylist[candidate.partylist_id].push(candidate);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          Candidate Management
        </h2>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showForm ? "Close" : "Add Candidate"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 bg-slate-50 rounded-lg space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                required
                value={formData.full_name}
                onChange={(event) =>
                  setFormData({ ...formData, full_name: event.target.value })
                }
                placeholder="Juan Dela Cruz"
                className="h-12"
              />
            </div>

            <div>
              <Label>Position</Label>
              <select
                required
                value={formData.position}
                onChange={(event) =>
                  setFormData({ ...formData, position: event.target.value })
                }
                className="w-full h-12 px-3 rounded-md border border-slate-300"
              >
                <option value="">Select Position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Partylist</Label>
              <select
                required
                value={formData.partylist_id}
                onChange={(event) =>
                  setFormData({ ...formData, partylist_id: event.target.value })
                }
                className="w-full h-12 px-3 rounded-md border border-slate-300"
              >
                <option value="">Select Partylist</option>
                {partylists.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.position === "Grade Level Representative" && (
              <div>
                <Label>Target Grade Level</Label>
                <select
                  required
                  value={formData.target_grade_level ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      target_grade_level: Number.parseInt(
                        event.target.value,
                        10,
                      ),
                    })
                  }
                  className="w-full h-12 px-3 rounded-md border border-slate-300"
                >
                  <option value="">Select Grade</option>
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {hasPositionConflict &&
            formData.partylist_id &&
            formData.position && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This partylist already has a candidate for this position
                {formData.position === "Grade Level Representative" &&
                normalizedTarget
                  ? ` (Grade ${normalizedTarget})`
                  : ""}
                . Please edit the existing candidate instead.
              </div>
            )}

          <div className="flex gap-2">
            <Button type="submit" disabled={hasPositionConflict}>
              {editingId ? "Update" : "Add"} Candidate
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {partylists.map((party) => {
          const partyCandidates = groupedByPartylist[party.id] ?? [];
          const groupedByPosition = partyCandidates.reduce<
            Record<string, Candidate[]>
          >((acc, candidate) => {
            const key = candidate.position;
            if (!acc[key]) acc[key] = [];
            acc[key].push(candidate);
            return acc;
          }, {});

          return (
            <div
              key={party.id}
              className="rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="h-10 w-10 rounded-full border border-slate-200"
                  style={{ backgroundColor: party.color_hex }}
                />
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {party.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {partyCandidates.length} candidate
                    {partyCandidates.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {partyCandidates.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No candidates yet for this partylist.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedByPosition).map(
                    ([position, positionCandidates]) => (
                      <div key={position}>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">
                          {position}
                        </h3>
                        <div className="grid gap-3">
                          {positionCandidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                              style={{
                                borderLeftWidth: "4px",
                                borderLeftColor: party.color_hex,
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                  <User className="w-6 h-6 text-slate-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {candidate.full_name}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {candidate.target_grade_level
                                      ? `Grade ${candidate.target_grade_level}`
                                      : "Executive"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(candidate)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(candidate.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
