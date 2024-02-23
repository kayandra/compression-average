import brotli from "brotli";
import sizeof from "object-sizeof";
import ProgressBar from "progress";
import { compressSync as snappyCompress } from "snappy";
import { faker } from "@faker-js/faker";
import { createRandomPayload } from "./util";

const ITERATIONS = 1_000;
const loader = new ProgressBar("Calculating averages :bar :percent/:total", {
  total: 100,
});

// save on CPU by
// - Use snappy for hot data
// - GZIP or Brotli for cold data

const aggregator = new Map<string, number[]>();
const setAggregatorByKey = (key: string, base: number, payload: unknown) => {
  const prev = aggregator.get(key) ?? [];
  const perc = 1 - sizeof(payload) / base;
  aggregator.set(key, [...prev, perc]);
};

const summarize = () => {
  loader.terminate();

  // dump results
  const summarizer: Record<string, string> = {};
  for (const [key, value] of aggregator) {
    const average = value.reduce((a, b) => a + b) / value.length;
    summarizer[key] = `${(average * 100).toFixed(2)}%`;
  }

  summarizer["=========="] = "======";
  summarizer["Iterations"] = ITERATIONS.toString();

  console.clear();
  console.table(summarizer);
};

let STOP_EXECUTING = false;
const handleInterruption = () => {
  STOP_EXECUTING = true;
};

process.on("SIGINT", handleInterruption);
process.on("SIGQUIT", handleInterruption);
process.on("SIGTERM", handleInterruption);

for (let i = 1; i <= ITERATIONS; i++) {
  if (STOP_EXECUTING) break;
  const raw = faker.helpers.multiple(createRandomPayload, { count: 50 });
  const data = JSON.stringify(raw);
  const size = sizeof(data);

  setAggregatorByKey("snappy", size, snappyCompress(data));
  setAggregatorByKey("gzip", size, Bun.gzipSync(data));
  setAggregatorByKey("brotli", size, brotli.compress(Buffer.from(data)));

  loader.update(i / ITERATIONS);
}

summarize();
