"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Database, Gauge, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { Json } from "@/integrations/supabase/client";
import type { PressureProfile } from "@/src/data/mockExamData";
import { renderProgressBar } from "@/src/lib/examScoring";
import { normalizePressureProfile, pressureProfileAxes, readStoredPressureProfile, syncPressureProfile } from "@/src/lib/pressureProfileStorage";

interface ScoreSnapshot {
  id: string | null;
  module: string;
  band_score: number;
  accuracy: number;
  metrics: Json;
  storage: string;
  created_at: string;
}

const latestScoreKey = "ielts-pressure-lab-latest-score";
const emptyValue = "—";

function readMetric(metrics: Json, key: string) {
  if (typeof metrics === "object" && metrics !== null && !Array.isArray(metrics)) {
    const value = metrics[key];
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }

  return emptyValue;
}

function readObjectMetric(metrics: Json, key: string) {
  if (typeof metrics === "object" && metrics !== null && !Array.isArray(metrics)) {
    const value = metrics[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value;
    }
  }

  return null;
}

function readMetricWithFallback(metrics: Json, primaryKey: string, fallbackKey: string) {
  const primaryValue = readMetric(metrics, primaryKey);
  return primaryValue === emptyValue ? readMetric(metrics, fallbackKey) : primaryValue;
}

export function ScoreClient() {
  const [score, setScore] = useState<ScoreSnapshot | null>(null);
  const [profile, setProfile] = useState<PressureProfile>(() => readStoredPressureProfile());
  const [profileSaveState, setProfileSaveState] = useState("Saved locally");

  useEffect(() => {
    const raw = window.localStorage.getItem(latestScoreKey);
    if (!raw) {
      setProfile(readStoredPressureProfile());
      return;
    }

    try {
      const snapshot = JSON.parse(raw) as ScoreSnapshot;
      const resultProfile = normalizePressureProfile(readObjectMetric(snapshot.metrics, "pressure_profile") ?? readStoredPressureProfile());
      setScore(snapshot);
      setProfile(resultProfile);
      void syncPressureProfile(resultProfile);
    } catch {
      setScore(null);
      setProfile(readStoredPressureProfile());
    }
  }, []);

  const handleProfileChange = (key: keyof PressureProfile, value: number) => {
    const nextProfile = {
      ...profile,
      [key]: value
    };

    setProfile(nextProfile);
    setProfileSaveState("Saving...");
    void syncPressureProfile(nextProfile).then((result) => {
      setProfileSaveState(result.storage === "api" ? "Saved to profile API" : "Saved locally");
    });
  };

  return (
    <main className="score-output-shell">
      <section className="score-card" aria-labelledby="score-title">
        <div className="score-topline">
          <span>
            <Gauge size={18} />
            IELTS Pressure Lab Output
          </span>
          <Link href="/">
            <ArrowLeft size={17} />
            Back to lab
          </Link>
        </div>

        {score ? (
          <>
            <div className="score-hero">
              <div>
                <p>Module</p>
                <h1 id="score-title">{score.module.toUpperCase()}</h1>
              </div>
              <div className="band-score">
                <span>Band</span>
                <strong>{score.band_score.toFixed(1)}</strong>
              </div>
            </div>

            <div className="score-progress">
              <span>Accuracy</span>
              <strong>{score.accuracy}%</strong>
              <code>{renderProgressBar(score.accuracy)}</code>
            </div>

            <div className="score-metrics-grid">
              <Metric label="Correct" value={readMetric(score.metrics, "correct")} />
              <Metric label="WPM" value={readMetricWithFallback(score.metrics, "reading_wpm", "wpm")} />
              <Metric label="Elapsed" value={readMetric(score.metrics, "reading_elapsed_seconds")} />
              <Metric label="Missed" value={readMetricWithFallback(score.metrics, "missed_answers", "missed")} />
              <Metric label="Words" value={readMetric(score.metrics, "word_count")} />
            </div>

            <section className="score-profile-editor" aria-labelledby="pressure-profile-title">
              <div className="score-profile-heading">
                <span>
                  <SlidersHorizontal size={18} />
                  Pressure Profile
                </span>
                <small>
                  <Save size={15} />
                  {profileSaveState}
                </small>
              </div>
              <h2 id="pressure-profile-title">Adjust what the test felt like</h2>
              <p>These values are saved and reused in Command Center for the next session.</p>
              <div className="profile-slider-grid">
                {pressureProfileAxes.map((axis) => (
                  <label key={axis.key} className="profile-slider-row">
                    <span>
                      <strong>{axis.label}</strong>
                      <small>{axis.stressLabel}</small>
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={profile[axis.key]}
                      onChange={(event) => handleProfileChange(axis.key, Number(event.target.value))}
                    />
                    <em>{profile[axis.key]}/10</em>
                    <code>{renderProgressBar(profile[axis.key] * 10)}</code>
                  </label>
                ))}
              </div>
            </section>

            <div className="score-storage">
              <Database size={18} />
              <span>Stored through: {score.storage}</span>
              <small>{new Date(score.created_at).toLocaleString()}</small>
            </div>
          </>
        ) : (
          <div className="empty-score">
            <ShieldCheck size={24} />
            <h1 id="score-title">No score yet</h1>
            <p>Complete Reading, Listening, or Writing to generate a pressure result.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
