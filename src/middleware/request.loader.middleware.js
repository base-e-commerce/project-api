const formatDurationMs = (hrtime) => {
  const [seconds, nanoseconds] = hrtime;
  return (seconds * 1e3 + nanoseconds / 1e6).toFixed(2);
};

const requestLoader = (req, res, next) => {
  const startTime = process.hrtime();
  const { method, originalUrl } = req;
  const baseMessage = `[LOADER] ${method} ${originalUrl}`;
  const detailParts = [];
  if (Object.keys(req.params || {}).length) {
    detailParts.push(`params=${JSON.stringify(req.params)}`);
  }
  if (Object.keys(req.query || {}).length) {
    detailParts.push(`query=${JSON.stringify(req.query)}`);
  }
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length) {
    detailParts.push(`bodyKeys=${Object.keys(req.body).length}`);
  }
  const detailTrace = detailParts.length ? ` (${detailParts.join(" ")})` : "";
  console.log(`${baseMessage} -> starting${detailTrace}`);

  let finished = false;
  const logCompletion = (event) => {
    if (finished) {
      return;
    }
    finished = true;
    const durationMs = formatDurationMs(process.hrtime(startTime));
    console.log(`${baseMessage} -> ${res.statusCode} completed in ${durationMs}ms${event ? ` (${event})` : ""}`);
  };

  res.on("finish", () => logCompletion("finish"));
  res.on("close", () => logCompletion("close"));

  next();
};

module.exports = requestLoader;
