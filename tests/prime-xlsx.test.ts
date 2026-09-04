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
    expect(createPrimeXlsxFileName(new Date("2026-09-04T00:00:00.000Z"), "BATCH-0001")).toBe(
      "NEVADA_SHIPPING_2026-09-04_BATCH-0001.xlsx"
    );
  });

  it("builds A-L order data in the shipping template order", () => {
    expect(buildPrimeXlsxRow(baghdadDevelopmentOrder)).toEqual([
      "NEVADA",
      "بغداد",
      "المنصور",
      "",
      30000,
      "",
      "07812345678",
      "",
      "المنصور، شارع 14 رمضان، قرب الصيدلية",
      "جاكيت فراري وردي L",
      1,
      "طلب تجريبي بغداد"
    ]);
  });

  it("generates a valid XLSX workbook from the provided template", async () => {
    const workbook = await generatePrimeXlsx([
      baghdadDevelopmentOrder,
      basraDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);

    expect(workbook.subarray(0, 2).toString()).toBe("PK");
    expect(parsed.zip.file("xl/workbook.xml")).toBeTruthy();
    expect(parsed.workbookXml).toContain('name="Sheet1"');
  });

  it("keeps exact A-L headers and writes real orders starting at row 2", async () => {
    const workbook = await generatePrimeXlsx([
      baghdadDevelopmentOrder,
      basraDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);
    const columns = "ABCDEFGHIJKL".split("");
    const headers = columns.map((column) => parsed.value(`${column}1`));

    expect(headers).toEqual(PRIME_XLSX_HEADERS);
    expect(parsed.sheetXml).toContain('<dimension ref="A1:L3"/>');
    expect(columns.map((column) => parsed.value(`${column}2`))).toEqual(
      buildPrimeXlsxRow(baghdadDevelopmentOrder).map(String)
    );
    expect(parsed.value("M1")).toBe("");
    expect(parsed.value("M2")).toBe("");
  });

  it("exports every requested shipping field to its exact column", async () => {
    const workbook = await generatePrimeXlsx([
      baghdadDevelopmentOrder,
      basraDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);

    expect(parsed.value("A2")).toBe("NEVADA");
    expect(parsed.value("B2")).toBe("بغداد");
    expect(parsed.value("B2")).not.toBe("BGD");
    expect(parsed.value("C2")).toBe("المنصور");
    expect(parsed.value("D2")).toBe("");
    expect(parsed.value("D2")).not.toBe(" ");
    expect(parsed.value("D2")).not.toBe("-");
    expect(parsed.value("D2")).not.toBe("null");
    expect(parsed.cellXml("D2")).toBe('<c r="D2"/>');
    expect(parsed.cellXml("D2")).not.toContain("<f>");
    expect(parsed.sheetXml).not.toContain("NEVADA-K1M02");
    expect(parsed.value("E2")).toBe("30000");
    expect(parsed.cellXml("E2")).not.toContain('t="inlineStr"');
    expect(parsed.value("F2")).toBe("");
    expect(parsed.value("G2")).toBe("07812345678");
    expect(parsed.cellXml("G2")).toContain('t="inlineStr"');
    expect(parsed.value("H3")).toBe("07887654321");
    expect(parsed.cellXml("H3")).toContain('t="inlineStr"');
    expect(parsed.value("I2")).toBe("المنصور، شارع 14 رمضان، قرب الصيدلية");
    expect(parsed.value("J2")).toBe("جاكيت فراري وردي L");
    expect(parsed.value("J3")).toBe("جاكيت فراري اسود M × 2");
    expect(parsed.value("K3")).toBe("2");
    expect(parsed.cellXml("K3")).not.toContain('t="inlineStr"');
    expect(parsed.value("L2")).toBe("طلب تجريبي بغداد");
  });

  it("can populate the provided workbook after removing its example row", async () => {
    const templatePath = path.join(process.cwd(), "PrimeUploadSample.xlsx");
    const workbook = await populatePrimeXlsxTemplate(readFileSync(templatePath), [
      baghdadDevelopmentOrder
    ]);
    const parsed = await readWorkbookCells(workbook);

    expect(parsed.value("A2")).toBe("NEVADA");
    expect(parsed.value("B2")).toBe("بغداد");
    expect(parsed.value("C2")).toBe("المنصور");
    expect(parsed.value("D2")).toBe("");
    expect(parsed.value("I2")).not.toBe("شارع المنظمة");
    expect(parsed.value("L2")).not.toBe("تجريبي");
    expect(parsed.value("A3")).toBe("");
  });
});
