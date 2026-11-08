import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSanity, requireSignIn } from "@/lib/admin-api";
import {
  approveFeedbackRequest,
  createFeedbackRequest,
  deleteFeedbackRequest,
  disableFeedbackRequest,
  regenerateFeedbackRequest,
} from "@/lib/feedback-requests";
import { repairDateError } from "@/lib/feedback-invite";

const createFields = z.object({
  customerName: z.string().trim().min(2, "Add the customer's name").max(60),
  controllerType: z.string().trim().min(2, "Add the controller type").max(40),
  repair: z.string().trim().min(2, "Add the repair").max(80),
  repairDate: z.string().trim(),
  message: z.string().trim().max(400).optional(),
});

const actionFields = z.object({
  id: z.string().trim().min(1),
  action: z.enum(["disable", "regenerate", "approve"]),
});

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function POST(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  const body = await request.json().catch(() => null);
  const parsed = createFields.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 400 },
    );
  }

  const dateError = repairDateError(parsed.data.repairDate);
  if (dateError) {
    return NextResponse.json({ error: dateError }, { status: 400 });
  }

  try {
    const created = await createFeedbackRequest({
      customerName: clean(parsed.data.customerName),
      controllerType: clean(parsed.data.controllerType),
      repair: clean(parsed.data.repair),
      repairDate: parsed.data.repairDate,
      message: parsed.data.message?.trim() || "",
    });

    return NextResponse.json({ ok: true, token: created.token, id: created.id });
  } catch (error) {
    console.error("Feedback link create failed:", error);
    return NextResponse.json(
      { error: "Could not create that feedback link." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  const parsed = actionFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form." }, { status: 400 });
  }

  try {
    const result =
      parsed.data.action === "disable"
        ? await disableFeedbackRequest(parsed.data.id)
        : parsed.data.action === "regenerate"
          ? await regenerateFeedbackRequest(parsed.data.id)
          : await approveFeedbackRequest(parsed.data.id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (parsed.data.action === "approve") revalidatePath("/");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Feedback link update failed:", error);
    return NextResponse.json(
      { error: "Could not update that feedback link." },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  const signedOut = await requireSignIn();
  if (signedOut) return signedOut;

  const unavailable = requireSanity();
  if (unavailable) return unavailable;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing feedback link." }, { status: 400 });
  }

  try {
    const result = await deleteFeedbackRequest(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback link delete failed:", error);
    return NextResponse.json(
      { error: "Could not delete that feedback link." },
      { status: 502 },
    );
  }
}
