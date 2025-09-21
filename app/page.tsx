"use client"; // must be first line

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Flashcard = {
  question: string;
  answer: string;
};

const flashcards: Flashcard[] = [
  { question: "OOP stands for?", answer: "Object Oriented Programming" },
  { question: "Python is interpreted or compiled?", answer: "Interpreted" },
  { question: "Which keyword defines a function in Python?", answer: "def" },
  { question: "Which company developed Java?", answer: "Sun Microsystems" },
];

export default function HomePage() {
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [flashStatus, setFlashStatus] = useState<"correct" | "wrong" | null>(
    null
  );

  const handleAnswer = () => {
    if (current >= flashcards.length) return;

    const isCorrect =
      answer.trim().toLowerCase() ===
      flashcards[current].answer.toLowerCase();

    setFlashStatus(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswer("");

    setTimeout(() => {
      setFlashStatus(null);
      setCurrent((prev) => prev + 1);
    }, 500);
  };

  if (current >= flashcards.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            🎯 Final Score: {score}/{flashcards.length}
          </h2>
          <button
            onClick={() => {
              setScore(0);
              setCurrent(0);
              setAnswer("");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Restart Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`text-center p-6 border rounded-xl shadow-lg w-full max-w-md
            ${
              flashStatus === "correct"
                ? "bg-green-200 border-green-500"
                : flashStatus === "wrong"
                ? "bg-red-200 border-red-500"
                : "bg-white"
            }`}
        >
          <h1 className="text-3xl font-bold mb-6">🎮 Flashcard Frenzy</h1>
          <h2 className="text-lg font-semibold mb-4">
            {flashcards[current].question}
          </h2>

          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your Answer..."
            className="border p-2 rounded w-full text-center mb-4"
            onKeyDown={(e) => e.key === "Enter" && handleAnswer()}
            disabled={!!flashStatus}
          />
          <button
            onClick={handleAnswer}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            disabled={!!flashStatus}
          >
            Submit
          </button>

          <p className="mt-4 text-lg">Score: {score}</p>
          <p className="text-gray-500 mt-1">
            Question {current + 1} of {flashcards.length}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
