import { isMainThread } from "node:worker_threads";

if (!isMainThread) throw new Error("workers may not execute in the main thread");

// parentPort.on("message", (message) => {

// });
