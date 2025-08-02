/**
 * Remove stale subplebbits that are no longer present in their source
 */
export function cleanupStaleSubplebbits(db, source = 'all') {
  console.log(`[Cleanup] Removing stale subplebbits for source: ${source}`);
  
  // Load grace periods from environment variables
  const githubGracePeriodHours = parseInt(process.env.GITHUB_CLEANUP_GRACE_PERIOD_HOURS || '18', 10);
  const duneGracePeriodHours = parseInt(process.env.DUNE_CLEANUP_GRACE_PERIOD_HOURS || '72', 10);
  
  // Determine grace period based on the source
  const gracePeriodHours = source === 'github' ? githubGracePeriodHours : duneGracePeriodHours;
  const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000;
  const thresholdTime = Date.now() - gracePeriodMs;

  let totalRemoved = 0;

  if (source === 'github' || source === 'all') {
    const result = db.prepare(`
      DELETE FROM known_subplebbits
      WHERE last_seen_at < ? AND source = 'github'
    `).run(thresholdTime);
    console.log(`[Cleanup] Removed ${result.changes} stale GitHub entries`);
    totalRemoved += result.changes;
  }

  if (source === 'dune' || source === 'all') {
    const result = db.prepare(`
      DELETE FROM known_subplebbits
      WHERE last_seen_at < ? AND source = 'dune'
    `).run(thresholdTime);
    console.log(`[Cleanup] Removed ${result.changes} stale Dune entries`);
    totalRemoved += result.changes;
  }

  console.log(`[Cleanup] Total removed: ${totalRemoved} stale entries`);
  return totalRemoved;
}
