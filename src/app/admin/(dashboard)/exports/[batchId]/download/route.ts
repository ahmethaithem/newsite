import { NextResponse } from "next/server";

import { getExportBatch } from "@/lib/admin/data";
import { isAdminAuthenticated } from "@/lib/admin/session";
import {
  PRIME_XLSX_MIME_TYPE,
  createPrimeXlsxResponseBody
} from "@/lib/xlsx/prime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DownloadRouteContext = {
  params: Promise<{
    batchId: string;
  }>;
};

export async function GET(request: Request, { params }: DownloadRouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { batchId } = await params;
  const batch = await getExportBatch(batchId);

  if (!batch) {
    return new NextResponse("الدفعة غير موجودة", { status: 404 });
  }

  const encodedFileName = encodeURIComponent(batch.file_name);
  const workbookBytes = Buffer.from(batch.csv_content, "base64");

  return new NextResponse(createPrimeXlsxResponseBody(workbookBytes), {
    headers: {
      "Content-Type": PRIME_XLSX_MIME_TYPE,
      "Content-Disposition": `attachment; filename="${batch.file_name}"; filename*=UTF-8''${encodedFileName}`
    }
  });
}
