import { NextResponse } from "next/server";

import {
  createExportBatchDownload,
  getExportErrorMessage
} from "@/lib/admin/export-service";
import { isAdminAuthenticated } from "@/lib/admin/session";
import {
  PRIME_XLSX_MIME_TYPE,
  createPrimeXlsxResponseBody
} from "@/lib/xlsx/prime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    const formData = await request.formData();
    const allEligible = formData.get("allEligible") === "1";
    const rawOrderIds = String(formData.get("orderIds") ?? "[]");
    const orderIds = allEligible ? [] : (JSON.parse(rawOrderIds) as string[]);
    const result = await createExportBatchDownload({ orderIds, allEligible });
    const encodedFileName = encodeURIComponent(result.fileName);

    return new NextResponse(createPrimeXlsxResponseBody(result.workbookBytes), {
      headers: {
        "Content-Type": PRIME_XLSX_MIME_TYPE,
        "Content-Disposition": `attachment; filename="${result.fileName}"; filename*=UTF-8''${encodedFileName}`
      }
    });
  } catch (error) {
    const message = encodeURIComponent(getExportErrorMessage(error));
    return NextResponse.redirect(new URL(`/admin/orders?error=${message}`, request.url));
  }
}
