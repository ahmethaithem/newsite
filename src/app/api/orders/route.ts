import { NextResponse } from "next/server";

import {
  createOrderFromCheckout,
  PublicOrderError
} from "@/lib/orders/repository";

export const runtime = "nodejs";

function logUnexpectedOrderError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (error instanceof Error) {
    const supabaseError = error as Error & {
      code?: string;
      details?: string;
      hint?: string;
    };
    const safeError = {
      name: error.name,
      message: error.message,
      code: supabaseError.code,
      details: supabaseError.details,
      hint: supabaseError.hint,
      stack: error.stack
    };

    console.error(`[checkout:order-create] ${JSON.stringify(safeError)}`);
    return;
  }

  console.error(`[checkout:order-create] ${JSON.stringify({ error })}`);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await createOrderFromCheckout(payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof PublicOrderError) {
      return NextResponse.json(
        {
          message: error.messages[0],
          errors: error.messages
        },
        { status: error.status }
      );
    }

    logUnexpectedOrderError(error);

    return NextResponse.json(
      {
        message:
          "تعذر تثبيت الطلب حالياً. يرجى المحاولة لاحقاً أو التواصل معنا مباشرة."
      },
      { status: 500 }
    );
  }
}
