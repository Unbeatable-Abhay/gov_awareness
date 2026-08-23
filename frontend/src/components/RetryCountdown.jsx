import { useEffect, useState } from "react";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function RetryCountdown({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining <= 0) {
    return <span className="retry-countdown">You can try again now.</span>;
  }

  return <span className="retry-countdown">Try again in {formatTime(remaining)}</span>;
}

export default RetryCountdown;