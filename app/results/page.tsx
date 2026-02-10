"use client";

import { createClient } from "@/lib/supabase/client";
import { BarChart, Trophy, Users } from "lucide-react";
import Link from "next/link";
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

const POSITION_ORDER = [
  "President",
  "Vice-President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Public Information Officer",
  "Protocol Officer",
  "Grade Level Representative",
];

const positionRank = new Map(
  POSITION_ORDER.map((position, index) => [position, index]),
);

export default function ResultsPage() {
  const [results, setResults] = useState<ResultCandidate[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState("all");
  const [showWinners, setShowWinners] = useState(false);
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

  const orderedGroupedResults = Object.entries(groupedResults).sort(
    ([, candidatesA], [, candidatesB]) => {
      const firstA = candidatesA[0];
      const firstB = candidatesB[0];
      const rankA = positionRank.get(firstA?.position) ?? POSITION_ORDER.length;
      const rankB = positionRank.get(firstB?.position) ?? POSITION_ORDER.length;
      if (rankA !== rankB) return rankA - rankB;

      if (firstA?.position === "Grade Level Representative") {
        return (
          (firstA.target_grade_level ?? 0) - (firstB?.target_grade_level ?? 0)
        );
      }

      return 0;
    },
  );

  const quickWinners = orderedGroupedResults.map(([position, candidates]) => {
    if (candidates.length === 0) {
      return { position, leaders: [] as ResultCandidate[] };
    }

    const topVotes = candidates[0].vote_count;
    const leaders = candidates.filter(
      (candidate) => candidate.vote_count === topVotes,
    );

    return { position, leaders };
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

            <div className="flex flex-wrap items-center gap-4">
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
              <button
                type="button"
                onClick={() => setShowWinners((value) => !value)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800"
              >
                {showWinners ? "Hide Quick Winners" : "Show Quick Winners"}
              </button>
              <Link href="/">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-800"
                >
                  Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {showWinners && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-slate-900">
                Quick Winners
              </h2>
              <span className="text-sm text-slate-500">
                {selectedSection === "all"
                  ? "Overall"
                  : `Section ${selectedSection}`}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {quickWinners.map((item) => (
                <div
                  key={item.position}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="text-sm font-semibold text-slate-600">
                    {item.position}
                  </p>
                  {item.leaders.length === 0 ? (
                    <p className="text-sm text-slate-500 mt-2">
                      No candidates yet
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {item.leaders.map((leader) => (
                        <div
                          key={leader.id}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: leader.partylist.color_hex,
                            }}
                          />
                          <span className="font-semibold text-slate-900">
                            {leader.full_name}
                          </span>
                          <span className="text-sm text-slate-600">
                            {leader.vote_count} vote
                            {leader.vote_count === 1 ? "" : "s"}
                          </span>
                        </div>
                      ))}
                      {item.leaders.length > 1 && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          Tie
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {orderedGroupedResults.map(([position, candidates]) => {
            const totalVotes = Math.max(
              candidates.reduce(
                (sum, candidate) => sum + candidate.vote_count,
                0,
              ),
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
                    const percentage =
                      (candidate.vote_count / totalVotes) * 100;
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
        </div>

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
