import { env } from "cloudflare:workers";
import { handleApi } from "@/server/api.mjs";
export const dynamic = "force-dynamic";
const handle = (request: Request) => handleApi(request, env);
export { handle as GET, handle as POST, handle as OPTIONS, handle as PUT, handle as DELETE };
