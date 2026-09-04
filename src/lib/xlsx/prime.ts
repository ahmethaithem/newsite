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
  "المتجر",
  "المحافظة",
  "المنطقة",
  "رقم الوصل",
  "مبلغ الوصل د.ع",
  "مبلغ الوصل $",
  "هاتف المستلم",
  "هاتف المستلم2",
  "تفاصيل العنوان",
  "ملاحظات",
  "العدد",
  "اسم المستلم"
] as const;

type PrimeCellValue = string | number;
type PrimeXlsxRow = readonly [
  string,
  string,
  string,
  string,
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string
];

const worksheetPath = "xl/worksheets/sheet1.xml";
const orderColumns = "ABCDEFGHIJKL".split("");
const cellXmlPattern = /<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g;
const rowXmlPattern = /<row\b[^>]*>[\s\S]*?<\/row>/g;
const orderRowStart = 2;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getCellRef(cellXml: string) {
  return cellXml.match(/\br="([A-Z]+)\d+"/)?.[1] ?? "";
}

function getCellStyle(cellXml: string) {
  return cellXml.match(/\bs="([^"]+)"/)?.[1] ?? "";
}

function getRowNumber(rowXml: string) {
  return Number(rowXml.match(/\br="(\d+)"/)?.[1] ?? 0);
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
  const styles: Record<string, string> = {};

  for (const cellXml of rowTwoXml.match(cellXmlPattern) ?? []) {
    const column = getCellRef(cellXml);
    if (orderColumns.includes(column)) {
      styles[column] = getCellStyle(cellXml);
    }
  }

  return styles;
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
  value: PrimeCellValue
) {
  const ref = `${column}${rowNumber}`;

  if (typeof value === "number") {
    return renderNumberCell(ref, style, value);
  }

  return renderTextCell(ref, style, value);
}

function renderOrderCells(
  rowNumber: number,
  orderRow: PrimeXlsxRow,
  styles: Record<string, string>
) {
  return orderColumns.map((column, index) =>
    renderOrderCell(rowNumber, column, styles[column], orderRow[index])
  );
}

function updateWorksheetDimension(sheetXml: string, orderCount: number) {
  const lastRow = Math.max(1, orderCount + orderRowStart - 1);
  const dimensionXml = `<dimension ref="A1:L${lastRow}"/>`;

  if (/<dimension\b[^>]*\/>/.test(sheetXml)) {
    return sheetXml.replace(/<dimension\b[^>]*\/>/, dimensionXml);
  }

  return sheetXml.replace(/<worksheet\b[^>]*>/, (worksheetOpen) => {
    return `${worksheetOpen}${dimensionXml}`;
  });
}

function createOrderRowOpen(templateRowXml: string, rowNumber: number) {
  const templateOpen =
    templateRowXml.match(/^<row\b[^>]*>/)?.[0] ??
    `<row r="${rowNumber}" spans="1:12">`;
  const withRowNumber = /\br="\d+"/.test(templateOpen)
    ? templateOpen.replace(/\br="\d+"/, `r="${rowNumber}"`)
    : templateOpen.replace("<row", `<row r="${rowNumber}"`);

  if (/\bspans="[^"]*"/.test(withRowNumber)) {
    return withRowNumber.replace(/\bspans="[^"]*"/, 'spans="1:12"');
  }

  return withRowNumber.replace(/>$/, ' spans="1:12">');
}

function renderOrderRow(
  rowNumber: number,
  orderRow: PrimeXlsxRow,
  styles: Record<string, string>,
  templateRowXml: string
) {
  return `${createOrderRowOpen(templateRowXml, rowNumber)}${renderOrderCells(
    rowNumber,
    orderRow,
    styles
  ).join("")}</row>`;
}

function replaceOrderRows(sheetXml: string, orderRows: PrimeXlsxRow[]) {
  const templateRowXml = getRowXml(sheetXml, orderRowStart);
  const styles = readOrderStyles(sheetXml);
  const renderedOrderRows = orderRows.map((orderRow, index) =>
    renderOrderRow(orderRowStart + index, orderRow, styles, templateRowXml)
  );

  return sheetXml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, (_, body: string) => {
    const preservedRows = (body.match(rowXmlPattern) ?? []).filter(
      (rowXml) => getRowNumber(rowXml) < orderRowStart
    );

    return `<sheetData>${[...preservedRows, ...renderedOrderRows].join(
      ""
    )}</sheetData>`;
  });
}

export function buildPrimeXlsxRow(order: OrderWithItems): PrimeXlsxRow {
  const totalQuantity = order.order_items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return [
    "NEVADA",
    order.governorate_name,
    order.district?.trim() ?? "",
    "",
    Math.trunc(order.cod_amount_iqd),
    "",
    order.primary_phone,
    order.secondary_phone ?? "",
    order.address,
    formatOrderItemsForShippingNotes(order.order_items),
    totalQuantity,
    order.customer_name
  ];
}

export async function populatePrimeXlsxTemplate(
  templateBytes: Buffer,
  orders: OrderWithItems[]
) {
  const zip = await JSZip.loadAsync(templateBytes);
  const sheetFile = zip.file(worksheetPath);
  if (!sheetFile) {
    throw new Error("Shipping template is missing Sheet1 worksheet XML.");
  }

  const sheetXml = await sheetFile.async("string");
  const orderRows = orders.map((order) => buildPrimeXlsxRow(order));
  const updatedSheetXml = updateWorksheetDimension(
    replaceOrderRows(sheetXml, orderRows),
    orders.length
  );

  zip.file(worksheetPath, updatedSheetXml);
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
