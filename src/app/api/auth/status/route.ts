import { handle } from "@/server/http";
import { needsSetup } from "@/server/services/account";

export const GET = handle(async () => ({ needsSetup: await needsSetup() }));
