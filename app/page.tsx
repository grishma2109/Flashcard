import React, { useState } from "react";

type Flashcard = {
  question: string;
  answer: string;
};

// Sample flashcards
const flashcards: Flashcard[] = [
  { question: "OOP stands for?", answer: "Object Oriented Programming" },
  { question: "Python is interpreted or compiled?", answer: "Interpreted" },
  { question: "Which keyword defines a function in Python?", answer: "def" },
  { question: "Which company developed Java?", answer: "Sun Microsystems" },
];

export default function FlashcardFrenzy() {
  const [mode, setMode] = useState<"menu" | "single" | "multi">("menu");
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(0);
  const [players, setPlayers] = useState(2);
  const [turn, setTurn] = useState(0);
  const [multiScores, setMultiScores] = useState<number[]>([]);

  const [answer, setAnswer] = useState("");

  // Reset game
  const resetGame = () => {
    setScore(0);
    setCurrent(0);
    setTurn(0);
    setMultiScores(Array(players).fill(0));
    setAnswer("");
  };

  // Handle answer
  const handleAnswer = (isMulti: boolean) => {
    const correct = answer.trim().toLowerCase() === flashcards[current].answer.toLowerCase();

    if (isMulti) {
      const updated = [...multiScores];
      if (correct) updated[turn] += 1;
      setMultiScores(updated);
      setTurn((turn + 1) % players);
    } else {
      if (correct) setScore(score + 1);
    }

    setAnswer("");
    setCurrent(current + 1);
  };

  // Menu
  if (mode === "menu") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <h1 className="text-3xl font-bold">🎮 Flashcard Frenzy</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            resetGame();
            setMode("single");
          }}
        >
          Single Player
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => {
            resetGame();
            setMode("multi");
          }}
        >
          Multiplayer
        </button>
      </div>
    );
  }

  // Single Player Mode
  if (mode === "single") {
    if (current >= flashcards.length) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl">🎯 Final Score: {score}/{flashcards.length}</h2>
          <button className="mt-4 bg-gray-600 text-white px-4 py-2 rounded" onClick={() => setMode("menu")}>
            Back to Menu
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold">{flashcards[current].question}</h2>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your Answer..."
          className="border p-2 mt-3 rounded"
        />
        <button
          onClick={() => handleAnswer(false)}
          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded"
        >
          Submit
        </button>
        <p className="mt-3">Score: {score}</p>
      </div>
    );
  }

  // Multiplayer Mode
  if (mode === "multi") {
    if (current >= flashcards.length) {
      const winnerIndex = multiScores.indexOf(Math.max(...multiScores));
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold">🏆 Final Scores</h2>
          {multiScores.map((s, i) => (
            <p key={i}>
              Player {i + 1}: {s}
            </p>
          ))}
          <h3 className="mt-2">🥇 Winner: Player {winnerIndex + 1}</h3>
          <button className="mt-4 bg-gray-600 text-white px-4 py-2 rounded" onClick={() => setMode("menu")}>
            Back to Menu
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold">{flashcards[current].question}</h2>
        <p className="mb-2">👤 Player {turn + 1}'s turn</p>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your Answer..."
          className="border p-2 mt-3 rounded"
        />
        <button
          onClick={() => handleAnswer(true)}
          className="ml-2 bg-green-600 text-white px-3 py-1 rounded"
        >
          Submit
        </button>
        <div className="mt-3">
          {multiScores.map((s, i) => (
            <p key={i}>
              Player {i + 1}: {s}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
