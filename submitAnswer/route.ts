import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // { matchId, scores, cards }

    const { error } = await supabase.from("matches").insert([
      {
        match_id: body.matchId,
        scores: body.scores,
        cards: body.cards,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save match" }, { status: 500 });
    }

    return NextResponse.json({ message: "Match saved ✅" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save match" }, { status: 500 });
  }
}
