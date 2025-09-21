"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient"; // make sure this exists

type Flashcard = {
  qId: number;
  question: string;
  answer: string;
};

const sampleCards: Flashcard[] = [
  { qId: 1, question: "OOP stands for?", answer: "Object Oriented Programming" },
  { qId: 2, question: "5 + 7 = ?", answer: "12" },
  { qId: 3, question: "Largest planet?", answer: "Jupiter" },
  { qId: 4, question: "HTML is used for?", answer: "Structuring web pages" },
  { qId: 5, question: "Python is interpreted or compiled?", answer: "Interpreted" },
];

export default function FlashcardFrenzy() {
  const [mode, setMode] = useState<"menu" | "single" | "multi">("menu");
  const [cardIndex, setCardIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<{ [player: string]: number }>({});
  const [playerId, setPlayerId] = useState("");
  const [finished, setFinished] = useState(false);
  const [flashStatus, setFlashStatus] = useState<"correct" | "wrong" | null>(null);
  const [matchId, setMatchId] = useState<string>("");

  // -----------------------------
  // Multiplayer setup
  // -----------------------------
  useEffect(() => {
    if (mode !== "multi" || !matchId) return;

    const setup = async () => {
      const channel = supabase.channel(matchId);

      channel.on("broadcast", { event: "newCard" }, (payload) => {
        const idx = payload.payload.index;
        if (idx >= 0) setCardIndex(idx);
        if (idx === sampleCards.length) setFinished(true);
      });

      channel.on("broadcast", { event: "scoreUpdate" }, (payload) => {
        setScores(payload.payload.scores);
      });

      await channel.subscribe();
      setPlayerId("player-" + Math.floor(Math.random() * 1000));
    };

    setup();

    return () => {
      supabase.channel(matchId).unsubscribe();
    };
  }, [mode, matchId]);

  // -----------------------------
  // Submit Answer
  // -----------------------------
  const submitAnswer = async () => {
    const card = sampleCards[cardIndex];
    if (!card) return;

    const isCorrect = answer.trim().toLowerCase() === card.answer.toLowerCase();
    setFlashStatus(isCorrect ? "correct" : "wrong");

    if (mode === "multi" && matchId) {
      if (isCorrect) {
        const newScores = { ...scores, [playerId]: (scores[playerId] || 0) + 1 };
        supabase.channel(matchId).send({
          type: "broadcast",
          event: "scoreUpdate",
          payload: { scores: newScores },
        });
        setScores(newScores);
      }
    } else {
      if (isCorrect) setScores({ ...scores, [playerId]: (scores[playerId] || 0) + 1 });
    }

    setAnswer("");

    setTimeout(() => {
      setFlashStatus(null);
      if (cardIndex + 1 < sampleCards.length) setCardIndex(cardIndex + 1);
      else setFinished(true);
    }, 500);
  };

  const restartGame = () => {
    setMode("menu");
    setCardIndex(0);
    setScores({});
    setFinished(false);
    setAnswer("");
    setMatchId("");
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (mode === "menu") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
        <div className="bg-white rounded-xl p-8 shadow-md text-center w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6">⚡ Flashcard Frenzy</h1>
          <p className="mb-6 text-gray-600">Choose a mode:</p>
          <button
            onClick={() => {
              setMode("single");
              setPlayerId("local-player");
            }}
            className="w-full py-2 px-4 mb-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            🎯 Single Player
          </button>
          <button
            onClick={() => {
              setMode("multi");
              setMatchId("match-" + Math.floor(Math.random() * 10000));
            }}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            🤝 Multiplayer
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            🎉 Game Over! Final Score: {scores[playerId] || 0}/{sampleCards.length}
          </h2>
          <button
            onClick={restartGame}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            🔄 Back to Menu
          </button>
          {mode === "multi" && (
            <ul className="mt-4">
              {Object.entries(scores).map(([p, s]) => (
                <li key={p}>
                  {p}: {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const currentCard = sampleCards[cardIndex];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard.qId}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`bg-white rounded-2xl p-8 shadow-lg w-full max-w-md text-center
            ${flashStatus === "correct" ? "border-4 border-green-400" : ""}
            ${flashStatus === "wrong" ? "border-4 border-red-400" : ""}`}
        >
          <h1 className="text-2xl font-bold mb-6">
            {mode === "multi" ? "🤝 Multiplayer" : "🎯 Single Player"}
          </h1>
          <p className="text-xl mb-4">{currentCard.question}</p>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your Answer..."
            className="border p-2 rounded w-full mb-4 text-center font-bold"
            onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
            disabled={!!flashStatus}
          />
          <button
            onClick={submitAnswer}
            className="w-full py-2 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 mb-4"
            disabled={!!flashStatus}
          >
            Submit
          </button>
          <p className="text-lg">Score: {scores[playerId] || 0}</p>
          <p className="text-gray-500 mt-1">
            Question {cardIndex + 1} of {sampleCards.length}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
