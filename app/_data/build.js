const now = new Date();

module.exports = {
  year: now.getUTCFullYear(),
  isoDate: now.toISOString().slice(0, 10),
  isoDateTime: now.toISOString(),
  rfc822Date: now.toUTCString(),
};
