// Instant-runoff tally. ballots: string[][] (full rankings, best first).

function bordaScores(ballots, candidates) {
  const scores = Object.fromEntries(candidates.map(c => [c, 0]));
  for (const b of ballots) b.forEach((c, i) => { if (c in scores) scores[c] += b.length - i; });
  return scores;
}

export function runIrv(ballots, candidates) {
  const borda = bordaScores(ballots, candidates);
  let remaining = [...candidates];
  const rounds = [];
  while (remaining.length) {
    const counts = Object.fromEntries(remaining.map(c => [c, 0]));
    let active = 0;
    for (const b of ballots) {
      const pick = b.find(c => c in counts);
      if (pick) { counts[pick]++; active++; }
    }
    const max = Math.max(...Object.values(counts));
    const leader = remaining.filter(c => counts[c] === max).sort((a, b) => borda[b] - borda[a] || a.localeCompare(b))[0];
    if (remaining.length === 1 || max * 2 > active) {
      rounds.push({ counts, active, eliminated: null, winner: leader });
      return { winner: leader, rounds };
    }
    const min = Math.min(...Object.values(counts));
    const loser = remaining.filter(c => counts[c] === min).sort((a, b) => borda[a] - borda[b] || b.localeCompare(a))[0];
    rounds.push({ counts, active, eliminated: loser, winner: null });
    remaining = remaining.filter(c => c !== loser);
  }
  return { winner: null, rounds };
}

// Winner of each place is removed, then the count is rerun for the next place.
export function rankTop(ballots, candidates, places = 3) {
  if (!ballots.length) return [];
  const results = [];
  let remaining = [...candidates];
  for (let place = 1; place <= places && remaining.length; place++) {
    const res = runIrv(ballots, remaining);
    results.push({ place, ...res });
    remaining = remaining.filter(c => c !== res.winner);
  }
  return results;
}
