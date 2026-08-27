import { useEffect, useState } from "react";

const MESSAGES = [
  "Searching official government sources...",
  "Checking multiple portals for the latest information...",
  "This can take up to a minute for new searches...",
  "Still working — almost there...",
];

// Takes the actual timestamp the search started at, rather than tracking
// its own start time internally. This is what makes the elapsed timer
// survive the component unmounting/remounting (e.g. navigating to another
// tab and back) — as long as `startedAt` itself is stored somewhere that
// survives navigation (a page-level Context), this component always
// recomputes the TRUE elapsed time on every mount, instead of restarting
// from zero.
function SearchingIndicator({ startedAt }) {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
  );

  useEffect(() => {
    if (!startedAt) return;
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [startedAt]);

  // Derived from elapsed time itself (not a separate internal timer), so
  // the rotating message also stays correct across remounts instead of
  // resetting to the first message every time.
  const messageIndex = Math.floor(elapsed / 6) % MESSAGES.length;

  return (
    <div className="searching-indicator">
      <div className="searching-indicator__bar-track">
        <div className="searching-indicator__bar-fill" />
      </div>
      <p className="searching-indicator__message">{MESSAGES[messageIndex]}</p>
      <p className="searching-indicator__elapsed">{elapsed}s elapsed</p>
    </div>
  );
}

export default SearchingIndicator;