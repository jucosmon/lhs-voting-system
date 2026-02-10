"use client";

import { createClient } from "@/lib/supabase/client";
import { BarChart, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";

type Section = {
  id: number;
  name: string;
};

type ResultCandidate = {
  id: string;
  full_name: string;
  position: string;
  target_grade_level: number | null;
  partylist: {
    name: string;
    color_hex: string;
  };
  vote_count: number;
};

export default function ResultsPage() {
  const [results, setResults] = useState<ResultCandidate[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    loadResults();
    loadSections();

    const channel = supabase
      .channel("votes-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes" },
        () => {
          loadResults();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSection]);

  const loadSections = async () => {
    const { data } = await supabase.from("sections").select("*").order("name");
    setSections(data ?? []);
  };

  const loadResults = async () => {
    const { data: candidates } = await supabase
      .from("candidates")
      .select(
        "id, full_name, position, target_grade_level, partylist:partylists(name, color_hex)",
      )
      .order("position");

    let votesQuery = supabase.from("votes").select("candidate_id, section_id");

    if (selectedSection !== "all") {
      votesQuery = votesQuery.eq("section_id", Number(selectedSection));
    }

    const { data: votes } = await votesQuery;

    const voteCounts = new Map<string, number>();
    votes?.forEach((vote) => {
      const candidateId = vote.candidate_id as string;
      voteCounts.set(candidateId, (voteCounts.get(candidateId) ?? 0) + 1);
    });

    const resultsWithZeros = (candidates ?? []).map((candidate) => ({
      ...(candidate as unknown as Omit<ResultCandidate, "vote_count">),
      vote_count: voteCounts.get(candidate.id) ?? 0,
    }));

    setResults(resultsWithZeros as ResultCandidate[]);
  };

  const groupedResults = results.reduce<Record<string, ResultCandidate[]>>(
    (acc, result) => {
      const key = result.target_grade_level
        ? `${result.position} (Grade ${result.target_grade_level})`
        : result.position;
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    },
    {},
  );

  Object.keys(groupedResults).forEach((key) => {
    groupedResults[key].sort((a, b) => b.vote_count - a.vote_count);
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Live Election Results
                </h1>
                <p className="text-sm text-slate-600">
                  Real-time vote tracking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">
                Filter by Section:
              </label>
              <select
                value={selectedSection}
                onChange={(event) => setSelectedSection(event.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="all">All Sections</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {Object.entries(groupedResults).map(([position, candidates]) => {
          const maxVotes = Math.max(
            ...candidates.map((candidate) => candidate.vote_count),
            1,
          );

          return (
            <div key={position} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" />
                {position}
              </h2>

              <div className="space-y-4">
                {candidates.map((candidate, index) => {
                  const percentage = (candidate.vote_count / maxVotes) * 100;
                  const isLeading = index === 0;

                  return (
                    <div key={candidate.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {isLeading && (
                            <Trophy className="w-5 h-5 text-yellow-500" />
                          )}
                          <span className="font-semibold text-slate-900">
                            {candidate.full_name}
                          </span>
                          <span
                            className="text-sm px-2 py-1 rounded"
                            style={{
                              backgroundColor: `${candidate.partylist.color_hex}20`,
                              color: candidate.partylist.color_hex,
                            }}
                          >
                            {candidate.partylist.name}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-slate-900">
                          {candidate.vote_count}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 flex items-center justify-end px-3 text-white font-semibold"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: candidate.partylist.color_hex,
                          }}
                        >
                          {percentage > 10 && `${percentage.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.keys(groupedResults).length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <BarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No votes recorded yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
