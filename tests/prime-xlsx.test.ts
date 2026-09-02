import { readFileSync } from "node:fs";
import path from "node:path";

import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  PRIME_XLSX_HEADERS,
  PRIME_XLSX_MIME_TYPE,
  buildPrimeXlsxRow,
  createPrimeXlsxFileName,
  generatePrimeXlsx,
  populatePrimeXlsxTemplate
} from "@/lib/xlsx/prime";
import {
  baghdadDevelopmentOrder,
  basraDevelopmentOrder
} from "@/lib/testing/dev-orders";

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseSharedStrings(xml: string) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((textMatch) => decodeXml(textMatch[1]))
      .join("")
  );
}

async function readWorkbookCells(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sheetXml = await zip.file("xl/worksheets/sheet1.xml")?.async("string");

  if (!workbookXml || !sharedStringsXml || !sheetXml) {
    throw new Error("Workbook is missing required Office Open XML parts.");
  }

  const sharedStrings = parseSharedStrings(sharedStringsXml);

  const cellsByRef = new Map(
    (sheetXml.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) ?? []).map((xml) => {
      const ref = xml.match(/\br="([^"]+)"/)?.[1] ?? "";
      return [ref, xml] as const;
    })
  );

  function cellXml(ref: string) {
    return cellsByRef.get(ref) ?? "";
  }

  function value(ref: string) {
    const xml = cellXml(ref);
    if (!xml) {
      return "";
    }

    const inline = [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join("");
    if (inline) {
      return inline;
    }

    const raw = xml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
    if (xml.includes('t="s"')) {
      return sharedStrings[Number(raw)] ?? "";
    }

    return raw;
  }

  return {
    zip,
    workbookXml,
    stylesXml: await zip.file("xl/styles.xml")?.async("string"),
    sheetXml,
    cellXml,
    value
  };
}

describe("Prime shipping XLSX", () => {
  it("uses the official XLSX MIME type and extension", () => {
    expect(PRIME_XLSX_MIME_TYPE).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(createPrimeXlsxFileName(new Date("2026-09-02T00:00:00.000Z"), "BATCH-0001")).toBe(
      "NEVADA_SHIPPING_2026-09-02_BATCH-0001.xlsx"
    );
  });

  it("builds A-M order data in the Prime template order", () => {
    expect(buildPrimeXlsxRow(baghdadDevelopmentOrder)).toEqual([
      "جاكيت فراري - وردي L × 1",
      1,
      "N",
      "07812345678",
      "المنصور، شارع 14 رمضان، قرب الصيدلية",
      "BGD",
      "طلب تجريبي بغداد",
      30000,
      "",
      "",
      "",
      "ملابس",
      ""
    ]);
  });

  it("generates a valid XLSX workbook from the official template", async () => {
    const workbook = await generatePrimeXlsx([
      baghdadDevelopmentOrder,
      basraDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);

    expect(workbook.subarray(0, 2).toString()).toBe("PK");
    expect(parsed.zip.file("xl/workbook.xml")).toBeTruthy();
    expect(parsed.workbookXml).toContain('name="Sheet1"');
  });

  it("keeps A-M headers and writes real orders starting at row 2", async () => {
    const workbook = await generatePrimeXlsx([
      baghdadDevelopmentOrder,
      basraDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);
    const headers = "ABCDEFGHIJKLM".split("").map((column) => parsed.value(`${column}1`));

    expect(headers).toEqual(PRIME_XLSX_HEADERS);
    expect("ABCDEFGHIJKLM".split("").map((column) => parsed.value(`${column}2`))).toEqual(
      buildPrimeXlsxRow(baghdadDevelopmentOrder).map(String)
    );
    expect(parsed.value("A2")).toBe("جاكيت فراري - وردي L × 1");
    expect(parsed.value("A3")).toBe("جاكيت فراري - أسود M × 2");
    expect(parsed.value("F2")).toBe("BGD");
    expect(parsed.value("F3")).toBe("BAS");
    expect(parsed.value("G2")).not.toBe("احمد خالد");
  });

  it("stores phones as text and COD amount as a whole number", async () => {
    const workbook = await generatePrimeXlsx([
      baghdadDevelopmentOrder,
      basraDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);

    expect(parsed.value("D2")).toBe("07812345678");
    expect(parsed.cellXml("D2")).toContain('t="inlineStr"');
    expect(parsed.value("K3")).toBe("07887654321");
    expect(parsed.cellXml("K3")).toContain('t="inlineStr"');
    expect(parsed.stylesXml).toContain('numFmtId="49"');
    expect(parsed.stylesXml).toContain('quotePrefix="1"');
    expect(parsed.value("H2")).toBe("30000");
    expect(parsed.cellXml("H2")).not.toContain('t="inlineStr"');
  });

  it("keeps normal shipment helper columns empty and preserves governorate lookup data", async () => {
    const templatePath = path.join(process.cwd(), "PrimeUploadSample.xlsx");
    const workbook = await populatePrimeXlsxTemplate(readFileSync(templatePath), [
      baghdadDevelopmentOrder,
      basraDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);

    expect(parsed.value("J2")).toBe("");
    expect(parsed.value("M2")).toBe("");
    expect(parsed.value("P2")).toBe("بغداد");
    expect(parsed.value("Q2")).toBe("BGD");
    expect(parsed.value("P10")).toBe("البصرة");
    expect(parsed.value("Q10")).toBe("BAS");
    expect(parsed.value("P19")).toBe("العمارة ميسان");
    expect(parsed.value("Q19")).toBe("AMA");
  });
});
