export function requireBody(fields) {
  return (req, res, next) => {
    for (const f of fields) {
      if (!(f in req.body)) return res.status(400).json({ error: `Missing ${f}` });
    }
    next();
  };
}





