import { readFileSync } from "node:fs";
import path from "node:path";

import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { PRIME_XLSX_HEADERS } from "@/lib/xlsx/prime";

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function readTemplateHeaders() {
  const workbookPath = path.join(process.cwd(), "PrimeUploadSample.xlsx");
  const zip = await JSZip.loadAsync(readFileSync(workbookPath));
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sheetXml = await zip.file("xl/worksheets/sheet1.xml")?.async("string");

  if (!sharedStringsXml || !sheetXml) {
    throw new Error("PrimeUploadSample.xlsx is missing expected worksheet data.");
  }

  const sharedStrings = [...sharedStringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(
    (match) =>
      [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((textMatch) => decodeXml(textMatch[1]))
        .join("")
  );

  return "ABCDEFGHIJKL".split("").map((letter) => {
    const cellMatch = sheetXml.match(
      new RegExp(`<c(?=[^>]*\\br="${letter}1")[^>]*>([\\s\\S]*?)<\\/c>`)
    );
    const valueMatch = cellMatch?.[1].match(/<v>([\s\S]*?)<\/v>/);
    if (!valueMatch) {
      return "";
    }

    return sharedStrings[Number(valueMatch[1])] ?? "";
  });
}

describe("PrimeUploadSample workbook", () => {
  it("matches the XLSX A-L headers used by the exporter", async () => {
    await expect(readTemplateHeaders()).resolves.toEqual(PRIME_XLSX_HEADERS);
  });
});
