// Die gespeicherten Originalmengen bleiben unverändert. Wir rechnen nur die Anzeige um.
function validServings(value) {
  return Number.isInteger(value) && value >= 1 && value <= 1000;
}

function scaleIngredient(line, original, desired) {
  if (!validServings(original) || !validServings(desired)) return { text: line, scaled: false };
  const fractions = { '½': 1 / 2, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 1 / 4, '¾': 3 / 4, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8 };
  const match = line.match(/^(\s*)(\d+\s+\d+\s*\/\s*\d+|\d+\s*[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\s*\/\s*\d+|\d+(?:[,.]\d+)?|[½⅓⅔¼¾⅛⅜⅝⅞])(.*)$/u);
  if (!match) return { text: line, scaled: false };
  const [, indent, amount, rest] = match;
  // Bereiche, Tausendertrennzeichen und Mehrfachmengen nicht versehentlich teilweise umrechnen.
  if (/^\s*(?:[\d.,/½⅓⅔¼¾⅛⅜⅝⅞–—−-]|bis\b|[x×](?=\s|\d))/iu.test(rest)) {
    return { text: line, scaled: false };
  }
  let value;
  const fractionChar = amount.slice(-1);
  if (fractions[fractionChar]) {
    value = Number(amount.slice(0, -1).trim() || 0) + fractions[fractionChar];
  } else if (amount.includes('/')) {
    const normalized = amount.replace(/\s*\/\s*/g, '/').trim().split(/\s+/);
    const [numerator, denominator] = normalized[normalized.length - 1].split('/').map(Number);
    if (!denominator) return { text: line, scaled: false };
    value = (normalized.length === 2 ? Number(normalized[0]) : 0) + numerator / denominator;
  } else {
    value = Number(amount.replace(',', '.'));
  }
  if (!Number.isFinite(value)) return { text: line, scaled: false };
  const quantity = value * desired / original;
  // Kleine Mengen nicht auf null abrunden.
  const digits = quantity > 0 && quantity < 0.01 ? 6 : 2;
  const formatted = quantity.toLocaleString('de-DE', { maximumFractionDigits: digits, useGrouping: false });
  return { text: original === desired ? line : indent + formatted + rest, scaled: true };
}
