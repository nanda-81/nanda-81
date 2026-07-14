import test from "node:test";
import assert from "node:assert/strict";
import { END, START, loadProfileData, renderGeneratedSection, replaceGeneratedSection } from "./update-profile.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("validates the four-project profile contract", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "profile-test-"));
  const file = path.join(dir, "profile-data.json");
  await fs.writeFile(file, JSON.stringify({ username: "nanda-81", currentFocus: "x", featuredRepositories: ["a", "b", "c", "d"], excludedRepositories: ["Cotiviti_Assessment"], links: {} }));
  const data = await loadProfileData(file);
  assert.equal(data.username, "nanda-81");
});

test("rejects an excluded project in the featured list", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "profile-test-"));
  const file = path.join(dir, "profile-data.json");
  await fs.writeFile(file, JSON.stringify({ username: "nanda-81", currentFocus: "x", featuredRepositories: ["a", "b", "c", "Cotiviti_Assessment"], excludedRepositories: ["Cotiviti_Assessment"], links: {} }));
  await assert.rejects(loadProfileData(file), /Excluded repository/);
});

test("replaces only the generated region", () => {
  const original = `before\n${START}\nold\n${END}\nafter`;
  const generated = `${START}\nnew\n${END}`;
  assert.equal(replaceGeneratedSection(original, generated), `before\n${generated}\nafter`);
});

test("rejects missing or duplicate markers", () => {
  assert.throws(() => replaceGeneratedSection("no markers", "x"), /exactly one/);
  assert.throws(() => replaceGeneratedSection(`${START}${START}${END}`, "x"), /exactly one/);
});

test("renders a maintainer-friendly live signal", () => {
  const output = renderGeneratedSection({ publicRepositories: 12, stars: 8, forks: 1, updatedAt: "2026-07-14T00:00:00.000Z" }, { currentFocus: "full-stack products" });
  assert.match(output, /12/);
  assert.match(output, /full-stack products/);
  assert.match(output, new RegExp(START));
  assert.match(output, new RegExp(END));
});
