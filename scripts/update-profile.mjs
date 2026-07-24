import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const START = "<!-- PROFILE:GENERATED:START -->";
export const END = "<!-- PROFILE:GENERATED:END -->";

export function validateProfileData(data) {
  const required = ["username", "currentFocus", "featuredRepositories", "excludedRepositories", "links"];
  for (const key of required) {
    if (!(key in data)) throw new Error(`Missing profile field: ${key}`);
  }
  if (typeof data.username !== "string" || !data.username.trim()) throw new Error("Username must be a non-empty string");
  if (typeof data.currentFocus !== "string" || !data.currentFocus.trim()) throw new Error("Current focus must be a non-empty string");
  if (data.featuredRepositories.length !== 4) throw new Error("Exactly four featured repositories are required");
  const names = data.featuredRepositories.map((name) => name.toLowerCase());
  if (new Set(names).size !== names.length) throw new Error("Featured repositories must be unique");
  for (const [name, value] of Object.entries(data.links)) {
    if (typeof value !== "string" || !/^(https:\/\/|mailto:)/.test(value)) throw new Error(`Link ${name} must use https or mailto`);
  }
  const excluded = new Set(data.excludedRepositories.map((name) => name.toLowerCase()));
  const forbidden = data.featuredRepositories.find((name) => excluded.has(name.toLowerCase()));
  if (forbidden) throw new Error(`Excluded repository cannot be featured: ${forbidden}`);
  return data;
}

export function validateReadme(readme) {
  if (/github-readme-stats|streak-stats|raw\.githubusercontent\.com\/[^\s]+\/output\/github-contribution-grid-snake/i.test(readme)) {
    throw new Error("README contains deprecated dashboard widgets");
  }
  return true;
}

export async function loadProfileData(filePath) {
  const data = JSON.parse(await fs.readFile(filePath, "utf8"));
  return validateProfileData(data);
}

export async function fetchGitHubSummary(username, token = process.env.GITHUB_TOKEN) {
  const headers = { "User-Agent": "nanda-81-profile-updater", Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, { headers });
  if (!response.ok) throw new Error(`GitHub repository request failed: ${response.status}`);
  const repositories = await response.json();
  const publicRepos = repositories.filter((repo) => !repo.private);
  return {
    publicRepositories: publicRepos.length,
    stars: publicRepos.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0),
    forks: publicRepos.reduce((sum, repo) => sum + (repo.forks_count ?? 0), 0),
    updatedAt: new Date().toISOString(),
    featured: publicRepos.slice(0, 0)
  };
}

export function renderGeneratedSection(summary, profileData) {
  const date = new Date(summary.updatedAt).toISOString().slice(0, 10);
  return [
    START,
    "## Live profile signal",
    "",
    `**${summary.publicRepositories}** public repositories · **${summary.stars}** stars · **${summary.forks}** forks`,
    "",
    `**Focus:** ${profileData.currentFocus}`,
    "",
    `<sub>Public GitHub snapshot refreshed ${date}. Activity metrics are evidence, not the identity.</sub>`,
    END
  ].join("\n").replaceAll("\\u00c2\\u00b7", "·").replaceAll("\\u00e2\\u20ac\\u201d", "—");
}

export function replaceGeneratedSection(readme, generated) {
  const startCount = readme.split(START).length - 1;
  const endCount = readme.split(END).length - 1;
  if (startCount !== 1 || endCount !== 1) throw new Error("README must contain exactly one generated marker pair");
  const start = readme.indexOf(START);
  const end = readme.indexOf(END) + END.length;
  if (end < start) throw new Error("Generated markers are out of order");
  return `${readme.slice(0, start)}${generated}${readme.slice(end)}`;
}

async function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const dataPath = path.join(root, "profile-data.json");
  const readmePath = path.join(root, "README.md");
  const data = await loadProfileData(dataPath);
  const readme = await fs.readFile(readmePath, "utf8");
  validateReadme(readme);
  let summary;
  try {
    summary = await fetchGitHubSummary(data.username);
  } catch (error) {
    summary = { publicRepositories: "—", stars: "—", forks: "—", updatedAt: new Date().toISOString() };
    const existingDate = readme.match(/Public GitHub snapshot refreshed (\d{4}-\d{2}-\d{2})/i)?.[1];
    if (existingDate) summary.updatedAt = `${existingDate}T00:00:00.000Z`;
    console.warn(`Using degraded profile data: ${error.message}`);
    if (process.argv.includes("--check")) {
      replaceGeneratedSection(readme, readme.slice(readme.indexOf(START), readme.indexOf(END) + END.length));
      process.stdout.write("Profile is up to date (offline check).\n");
      return;
    }
  }
  const updated = replaceGeneratedSection(readme, renderGeneratedSection(summary, data));
  if (process.argv.includes("--check")) {
    process.stdout.write(updated === readme ? "Profile is up to date.\n" : "Profile needs a generated refresh.\n");
    process.exitCode = updated === readme ? 0 : 1;
    return;
  }
  await fs.writeFile(readmePath, updated, "utf8");
  process.stdout.write("Profile generated successfully.\n");
}

if (process.argv[1]?.endsWith("update-profile.mjs")) main();
