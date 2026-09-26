function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function bodyObject(res, body) {
  if (!isPlainObject(body)) {
    sendError(res, 400, "El cuerpo tiene que ser un objeto JSON");
    return null;
  }
  return body;
}

function parseId(value) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function requireId(res, value, label) {
  const id = parseId(value);
  if (id == null) {
    sendError(res, 400, `${label} inválido`);
    return null;
  }
  return id;
}

function text(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function wholeNumber(value, min) {
  if (typeof value !== "number" || !Number.isInteger(value) || !Number.isSafeInteger(value)) {
    return null;
  }
  if (value < min) return null;
  return value;
}

function uniqueConstraint(res, err, message) {
  if (err && err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    sendError(res, 409, message);
    return true;
  }
  return false;
}

module.exports = {
  sendError,
  bodyObject,
  requireId,
  text,
  wholeNumber,
  uniqueConstraint,
};
