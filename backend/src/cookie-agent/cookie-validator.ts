import fs from "fs";
import path from "path";
import { CookieValidationResult } from "./cookie-types.js";

const MIN_COOKIE_LINE_PARTS = 7;

function isNetscapeCookieLine(line: string): boolean {
  if (!line || line.startsWith("#")) return false;
  const parts = line.split("\t");
  return parts.length >= MIN_COOKIE_LINE_PARTS;
}

export function validateCookieFile(filePath: string, provider: string): CookieValidationResult {
  const fileName = path.basename(filePath);

  if (!fs.existsSync(filePath)) {
    return { valid: false, score: 0, reason: "file_not_found" };
  }

  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return { valid: false, score: 0, reason: "file_read_error" };
  }

  if (!content.trim()) {
    return { valid: false, score: 5, reason: "file_empty" };
  }

  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const cookieLines = lines.filter((line) => isNetscapeCookieLine(line));

  if (cookieLines.length === 0) {
    return { valid: false, score: 20, reason: "invalid_netscape_format" };
  }

  const score = Math.min(95, 50 + cookieLines.length * 5);
  console.log(
    `[CookieAgent] Validation complete file=${fileName} provider=${provider} score=${score} valid=true`
  );

  return { valid: true, score };
}
