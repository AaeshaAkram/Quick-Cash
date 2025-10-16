const buckets = new Map();

export function rateLimiter({ windowMs = 60000, max = 100 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b) {
      b = { count: 1, resetAt: now + windowMs };
      buckets.set(key, b);
      return next();
    }
    if (now > b.resetAt) {
      b.count = 1;
      b.resetAt = now + windowMs;
      return next();
    }
    if (b.count >= max) {
      res.setHeader('Retry-After', Math.ceil((b.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests' });
    }
    b.count += 1;
    next();
  };
}





