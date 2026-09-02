import { readFile } from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";

import { formatOrderItemsForShippingNotes } from "@/lib/orders/item-summary";
import type { OrderWithItems } from "@/lib/orders/types";

export const PRIME_XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function createPrimeXlsxResponseBody(workbookBytes: Buffer) {
  return new Blob([new Uint8Array(workbookBytes)], {
    type: PRIME_XLSX_MIME_TYPE
  });
}

export const PRIME_XLSX_HEADERS = [
  "ملاحظات",
  "عدد القطع\nأجباري",
  "يحتوي على ارجاع بضاعة؟",
  "هاتف المستلم\nأجباري 11 خانة",
  "تفاصيل العنوان\nأجباري",
  "شفرة المحافظة\nأجباري",
  "أسم المستلم",
  "المبلغ عراقي\nكامل بالالاف .\nفي حال عدم توفره سيعتبر 0",
  "رقم الوصل \nفي حال عدم وجود رقم وصل سيتم توليده من النظام",
  "كود الشحنة",
  "هاتف المستلم 2\n",
  "نوع البضاعة",
  "وصف البضاعة المسترجعة اوالمستبدلة"
] as const;

type PrimeCellValue = string | number;
type PrimeXlsxRow = readonly [
  string,
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  string,
  string,
  string,
  string
];

const worksheetPath = "xl/worksheets/sheet1.xml";
const stylesPath = "xl/styles.xml";
const orderColumns = "ABCDEFGHIJKLM".split("");
const cellXmlPattern = /<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g;
const xfXmlPattern = /<xf\b[^>]*\/>|<xf\b[^>]*>[\s\S]*?<\/xf>/g;
const orderRowStart = 2;
const orderRowEnd = 1132;
const fallbackOrderStyles: Record<string, string> = {
  A: "8",
  B: "9",
  C: "9",
  D: "10",
  E: "11",
  F: "12",
  G: "11",
  H: "13",
  I: "14",
  J: "14",
  K: "14",
  L: "15",
  M: "15"
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnIndex(column: string) {
  return column.split("").reduce((total, letter) => {
    return total * 26 + letter.charCodeAt(0) - 64;
  }, 0);
}

function getCellRef(cellXml: string) {
  return cellXml.match(/\br="([A-Z]+)(\d+)"/)?.[1] ?? "";
}

function getCellStyle(cellXml: string) {
  return cellXml.match(/\bs="([^"]+)"/)?.[1] ?? "";
}

function getRowXml(sheetXml: string, rowNumber: number) {
  return (
    sheetXml.match(
      new RegExp(`<row\\b(?=[^>]*\\br="${rowNumber}")[^>]*>[\\s\\S]*?<\\/row>`)
    )?.[0] ?? ""
  );
}

function readOrderStyles(sheetXml: string) {
  const rowTwoXml = getRowXml(sheetXml, orderRowStart);
  const styles: Record<string, string> = { ...fallbackOrderStyles };

  for (const cellXml of rowTwoXml.match(cellXmlPattern) ?? []) {
    const column = getCellRef(cellXml);
    if (orderColumns.includes(column)) {
      styles[column] = getCellStyle(cellXml) || styles[column];
    }
  }

  return styles;
}

function setXmlAttribute(xml: string, attribute: string, value: string) {
  const attributePattern = new RegExp(`\\b${attribute}="[^"]*"`);
  if (attributePattern.test(xml)) {
    return xml.replace(attributePattern, `${attribute}="${value}"`);
  }

  return xml.replace(/<xf\b/, `<xf ${attribute}="${value}"`);
}

function createTextStyleXml(styleXml: string) {
  return [
    ["numFmtId", "49"],
    ["applyNumberFormat", "1"],
    ["quotePrefix", "1"]
  ].reduce(
    (current, [attribute, value]) => setXmlAttribute(current, attribute, value),
    styleXml
  );
}

function addPhoneTextStyles(
  stylesXml: string,
  baseStyles: Record<string, string>
) {
  const cellXfsMatch = stylesXml.match(/<cellXfs\b[^>]*>[\s\S]*?<\/cellXfs>/);
  if (!cellXfsMatch) {
    throw new Error("PrimeUploadSample.xlsx is missing workbook cell styles.");
  }

  const cellXfsXml = cellXfsMatch[0];
  const existingStyles = cellXfsXml.match(xfXmlPattern) ?? [];
  if (existingStyles.length === 0) {
    throw new Error("PrimeUploadSample.xlsx has no workbook cell styles.");
  }

  const nextStyleIndex = existingStyles.length;
  const primaryPhoneStyle = createTextStyleXml(
    existingStyles[Number(baseStyles.D)] ?? existingStyles[0]
  );
  const secondaryPhoneStyle = createTextStyleXml(
    existingStyles[Number(baseStyles.K)] ?? existingStyles[0]
  );
  const updatedCellXfsXml = cellXfsXml
    .replace(/\bcount="\d+"/, `count="${existingStyles.length + 2}"`)
    .replace("</cellXfs>", `${primaryPhoneStyle}${secondaryPhoneStyle}</cellXfs>`);

  return {
    stylesXml: stylesXml.replace(cellXfsXml, updatedCellXfsXml),
    phoneStyles: {
      D: String(nextStyleIndex),
      K: String(nextStyleIndex + 1)
    }
  };
}

function styleAttribute(style: string | undefined) {
  return style ? ` s="${style}"` : "";
}

function renderTextCell(ref: string, style: string | undefined, value: string) {
  if (!value) {
    return `<c r="${ref}"${styleAttribute(style)}/>`;
  }

  const preserve = /^\s|\s$|\n/.test(value) ? ' xml:space="preserve"' : "";
  return `<c r="${ref}"${styleAttribute(style)} t="inlineStr"><is><t${preserve}>${escapeXml(
    value
  )}</t></is></c>`;
}

function renderNumberCell(ref: string, style: string | undefined, value: number) {
  return `<c r="${ref}"${styleAttribute(style)}><v>${Math.trunc(value)}</v></c>`;
}

function renderOrderCell(
  rowNumber: number,
  column: string,
  style: string | undefined,
  value: PrimeCellValue | null
) {
  const ref = `${column}${rowNumber}`;
  if (value === null) {
    return renderTextCell(ref, style, "");
  }

  if (typeof value === "number") {
    return renderNumberCell(ref, style, value);
  }

  return renderTextCell(ref, style, value);
}

function renderOrderCells(
  rowNumber: number,
  orderRow: PrimeXlsxRow | null,
  styles: Record<string, string>
) {
  return orderColumns.map((column, index) => {
    return renderOrderCell(
      rowNumber,
      column,
      styles[column],
      orderRow ? orderRow[index] : null
    );
  });
}

function replaceOrderCellsInRow(
  rowXml: string,
  rowNumber: number,
  orderRow: PrimeXlsxRow | null,
  styles: Record<string, string>
) {
  const rowOpen = rowXml.match(/^<row\b[^>]*>/)?.[0];
  if (!rowOpen) {
    return rowXml;
  }

  const preservedCells =
    rowXml
      .match(cellXmlPattern)
      ?.filter((cellXml) => !orderColumns.includes(getCellRef(cellXml))) ?? [];

  const cells = [
    ...renderOrderCells(rowNumber, orderRow, styles),
    ...preservedCells
  ].sort((first, second) => columnIndex(getCellRef(first)) - columnIndex(getCellRef(second)));

  return `${rowOpen}${cells.join("")}</row>`;
}

export function buildPrimeXlsxRow(order: OrderWithItems): PrimeXlsxRow {
  return [
    formatOrderItemsForShippingNotes(order.order_items),
    order.total_items,
    "N",
    order.primary_phone,
    order.address,
    order.governorate_code,
    order.customer_name,
    Math.trunc(order.cod_amount_iqd),
    "",
    "",
    order.secondary_phone ?? "",
    "ملابس",
    ""
  ];
}

export async function populatePrimeXlsxTemplate(
  templateBytes: Buffer,
  orders: OrderWithItems[]
) {
  const availableRows = orderRowEnd - orderRowStart + 1;
  if (orders.length > availableRows) {
    throw new Error(`Prime template supports up to ${availableRows} orders per export.`);
  }

  const zip = await JSZip.loadAsync(templateBytes);
  const sheetFile = zip.file(worksheetPath);
  const stylesFile = zip.file(stylesPath);
  if (!sheetFile) {
    throw new Error("PrimeUploadSample.xlsx is missing Sheet1 worksheet XML.");
  }

  if (!stylesFile) {
    throw new Error("PrimeUploadSample.xlsx is missing workbook styles.");
  }

  const sheetXml = await sheetFile.async("string");
  const baseStyles = readOrderStyles(sheetXml);
  const updatedStyles = addPhoneTextStyles(
    await stylesFile.async("string"),
    baseStyles
  );
  const styles = {
    ...baseStyles,
    ...updatedStyles.phoneStyles
  };
  const orderRows = orders.map((order) => buildPrimeXlsxRow(order));

  const updatedSheetXml = sheetXml.replace(
    /<row\b[^>]*>[\s\S]*?<\/row>/g,
    (rowXml) => {
      const rowNumber = Number(rowXml.match(/\br="(\d+)"/)?.[1] ?? 0);
      if (rowNumber < orderRowStart || rowNumber > orderRowEnd) {
        return rowXml;
      }

      const orderRow = orderRows[rowNumber - orderRowStart] ?? null;
      return replaceOrderCellsInRow(rowXml, rowNumber, orderRow, styles);
    }
  );

  zip.file(worksheetPath, updatedSheetXml);
  zip.file(stylesPath, updatedStyles.stylesXml);
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
}

export async function generatePrimeXlsx(orders: OrderWithItems[]) {
  const templatePath = path.join(process.cwd(), "PrimeUploadSample.xlsx");
  const templateBytes = await readFile(templatePath);
  return populatePrimeXlsxTemplate(templateBytes, orders);
}

export function createPrimeXlsxFileName(date: Date, batchNumber: string) {
  const isoDate = date.toISOString().slice(0, 10);
  return `NEVADA_SHIPPING_${isoDate}_${batchNumber}.xlsx`;
}
