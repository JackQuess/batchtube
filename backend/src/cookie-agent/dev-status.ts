import { cookieAgent } from "./index.js";

cookieAgent.reload();
const status = cookieAgent.getStatus();
console.log(JSON.stringify({ profiles: status }, null, 2));
