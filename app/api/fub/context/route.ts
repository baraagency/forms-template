import {
  getEmbeddedClientName,
  parseEmbeddedContextPayload,
  verifyFubContextSignature,
} from "@/app/forms/_core/fubContextVerify";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const context = url.searchParams.get("context");
  const signature = url.searchParams.get("signature");

  if (!context || !signature) {
    return Response.json({ message: "Missing embedded context or signature." }, { status: 400 });
  }

  if (!verifyFubContextSignature(context, signature)) {
    return Response.json({ message: "Invalid embedded context signature." }, { status: 401 });
  }

  try {
    const payload = parseEmbeddedContextPayload(context);

    return Response.json({
      clientName: getEmbeddedClientName(payload),
      fubUserId: payload.fubUserId ?? payload.user?.id,
      fubUserName: payload.fubUserName ?? payload.user?.name,
      fubPersonId: payload.fubPersonId ?? payload.person?.id,
      accountId: payload.accountId ?? payload.account?.id,
    });
  } catch {
    return Response.json({ message: "Unable to decode embedded context." }, { status: 400 });
  }
}
