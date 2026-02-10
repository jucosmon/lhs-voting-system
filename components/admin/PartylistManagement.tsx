"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Partylist = {
  id: string;
  name: string;
  color_hex: string;
  acronym: string | null;
  description: string | null;
  is_active: boolean;
};

export default function PartylistManagement() {
  const [partylists, setPartylists] = useState<Partylist[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    color_hex: "#3B82F6",
    acronym: "",
    description: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadPartylists();
  }, []);

  const loadPartylists = async () => {
    const { data, error } = await supabase
      .from("partylists")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setPartylists(data ?? []);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      color_hex: "#3B82F6",
      acronym: "",
      description: "",
      is_active: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      color_hex: formData.color_hex,
      acronym: formData.acronym.trim() || null,
      description: formData.description.trim() || null,
      is_active: formData.is_active,
    };

    if (!payload.name) return;

    if (editingId) {
      await supabase.from("partylists").update(payload).eq("id", editingId);
    } else {
      await supabase.from("partylists").insert(payload);
    }

    resetForm();
    loadPartylists();
  };

  const handleEdit = (party: Partylist) => {
    setEditingId(party.id);
    setFormData({
      name: party.name,
      color_hex: party.color_hex,
      acronym: party.acronym ?? "",
      description: party.description ?? "",
      is_active: party.is_active,
    });
  };

  const handleDelete = async (partyId: string) => {
    if (!confirm("Delete this partylist?")) return;
    await supabase.from("partylists").delete().eq("id", partyId);
    loadPartylists();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Partylists</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="party-name">Partylist name</Label>
            <Input
              id="party-name"
              value={formData.name}
              onChange={(event) =>
                setFormData({ ...formData, name: event.target.value })
              }
              placeholder="Lakas Kabataan"
              className="h-12"
              required
            />
          </div>
          <div>
            <Label htmlFor="party-acronym">Acronym</Label>
            <Input
              id="party-acronym"
              value={formData.acronym}
              onChange={(event) =>
                setFormData({ ...formData, acronym: event.target.value })
              }
              placeholder="LK"
              className="h-12"
            />
          </div>
          <div>
            <Label htmlFor="party-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="party-color"
                type="color"
                value={formData.color_hex}
                onChange={(event) =>
                  setFormData({ ...formData, color_hex: event.target.value })
                }
                className="h-12 w-12 rounded border border-slate-300"
              />
              <Input
                value={formData.color_hex}
                onChange={(event) =>
                  setFormData({ ...formData, color_hex: event.target.value })
                }
                className="h-12"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="party-description">Description</Label>
            <Input
              id="party-description"
              value={formData.description}
              onChange={(event) =>
                setFormData({ ...formData, description: event.target.value })
              }
              placeholder="Student-first leadership"
              className="h-12"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="gap-2">
            <Plus className="w-4 h-4" />
            {editingId ? "Update" : "Add"} Partylist
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {partylists.map((party) => (
          <div
            key={party.id}
            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 rounded-full border border-slate-200"
                style={{ backgroundColor: party.color_hex }}
              />
              <div>
                <p className="font-semibold text-slate-900">{party.name}</p>
                <p className="text-sm text-slate-600">
                  {party.acronym ? `${party.acronym} • ` : ""}
                  {party.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(party)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(party.id)}
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
