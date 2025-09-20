"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";

type Flashcard = { qId: number; question: string; correct: string };

const MULTIPLAYER = true;

const sampleCards: Flashcard[] = [
  { qId: 1, question: "Capital of France?", correct: "Paris" },
  { qId: 2, question: "5 + 7 = ?", correct: "12" },
  { qId: 3, question: "Largest planet?", correct: "Jupiter" },
  { qId: 4, question: "OOP stands for?", correct: "Object Oriented Programming" },
  { qId: 5, question: "SQL stands for?", correct: "Structured Query Language" },
];

export default function GamePage() {
  const [card, setCard] = useState<Flashcard | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<{ [player: string]: number }>({});
  const [playerId, setPlayerId] = useState("");
  const [finished, setFinished] = useState(false);
  const matchId = "match-123";

  // -----------------------------
  // Multiplayer / First-correct-answer logic (async-safe)
  // -----------------------------
  useEffect(() => {
    const setup = async () => {
      if (!MULTIPLAYER) {
        setCard(sampleCards[0]);
        setPlayerId("local-player");
        return;
      }

      const channel = supabase.channel(matchId);

      // Listen for new cards
      channel.on("broadcast", { event: "newCard" }, (payload) => {
        setCard(payload.payload.card);
        if (!payload.payload.card) setFinished(true);
      });

      // Listen for score updates
      channel.on("broadcast", { event: "scoreUpdate" }, (payload) => {
        setScores(payload.payload.scores);
      });

      // Listen for first-correct-answer events
      channel.on("broadcast", { event: "correctAnswer" }, (payload) => {
        const { playerId: winner, newScores, nextCard } = payload.payload;
        setScores(newScores);
        setCard(nextCard);
        if (!nextCard) setFinished(true);
      });

      await channel.subscribe();
      console.log("Subscribed to channel", matchId);

      setPlayerId("player-" + Math.floor(Math.random() * 1000));
    };

    setup();

    // Cleanup: synchronous unsubscribe
    return () => {
      supabase.channel(matchId).unsubscribe();
    };
  }, []);

  // -----------------------------
  // Submit answer
  // -----------------------------
  const submitAnswer = async () => {
    if (!card) return;

    if (answer.trim().toLowerCase() === card.correct.toLowerCase()) {
      if (MULTIPLAYER) {
        const newScores = { ...scores, [playerId]: (scores[playerId] || 0) + 1 };
        const currentIndex = sampleCards.findIndex((c) => c.qId === card.qId);
        const nextCard =
          currentIndex + 1 < sampleCards.length ? sampleCards[currentIndex + 1] : null;

        // Broadcast first correct answer
        supabase.channel(matchId).send({
          type: "broadcast",
          event: "correctAnswer",
          payload: { playerId, newScores, nextCard },
        });

        if (!nextCard) await saveMatchToDB(newScores);
      } else {
        const newScores = { ...scores, [playerId]: (scores[playerId] || 0) + 1 };
        setScores(newScores);
        const nextIndex = index + 1;
        if (nextIndex < sampleCards.length) {
          setIndex(nextIndex);
          setCard(sampleCards[nextIndex]);
        } else {
          setFinished(true);
          setCard(null);
          await saveMatchToDB(newScores);
        }
      }
    }

    setAnswer("");
  };

  // -----------------------------
  // Save match to Supabase
  // -----------------------------
  const saveMatchToDB = async (finalScores: { [player: string]: number }) => {
    try {
      await fetch("/api/saveMatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, scores: finalScores, cards: sampleCards }),
      });
      console.log("Match saved to Supabase ✅");
    } catch (err) {
      console.error("Failed to save match:", err);
    }
  };

  const restartGame = () => {
    setIndex(0);
    setScores({});
    setFinished(false);
    setAnswer("");
    setCard(sampleCards[0]);
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 text-center font-bold">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl mb-4">
          ⚡ Flashcard Frenzy {MULTIPLAYER ? "(Multiplayer)" : "(Local)"}
        </h1>

        <AnimatePresence mode="wait">
          {!finished && card ? (
            <motion.div
              key={card.qId}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 border rounded-lg bg-gray-50 text-xl mb-4">{card.question}</div>
              <input
                type="text"
                className="w-full p-2 border rounded-lg mb-4 text-center font-bold"
                placeholder="Your Answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
              />
              <button
                onClick={submitAnswer}
                className="w-full py-2 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 mb-4"
              >
                Submit
              </button>
              <div className="text-xl mb-4">Score: {scores[playerId] || 0}</div>
            </motion.div>
          ) : (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl mb-2">🎉 Game Over!</h2>
              <p className="mb-4 text-lg">
                Your Final Score: {scores[playerId] || 0} / {sampleCards.length}
              </p>
              <button
                onClick={restartGame}
                className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-4"
              >
                🔄 Restart
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <h3 className="text-xl mb-2">Scoreboard</h3>
        <ul>
          {Object.entries(scores).map(([p, s]) => (
            <li key={p}>
              {p}: {s}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
