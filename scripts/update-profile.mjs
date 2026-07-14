import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const START = "<!-- PROFILE:GENERATED:START -->";
export const END = "<!-- PROFILE:GENERATED:END -->";

export async function loadProfileData(filePath) {
  const data = JSON.parse(await fs.readFile(filePath, "utf8"));
  const required = ["username", "currentFocus", "learningGoal", "featuredRepositories", "excludedRepositories", "links"];
  for (const key of required) {
    if (!(key in data)) throw new Error(`Missing profile field: ${key}`);
  }
  const excluded = new Set(data.excludedRepositories.map((name) => name.toLowerCase()));
  const forbidden = data.featuredRepositories.find((name) => excluded.has(name.toLowerCase()));
  if (forbidden) throw new Error(`Excluded repository cannot be featured: ${forbidden}`);
  if (data.featuredRepositories.length !== 5) throw new Error("Exactly five featured repositories are required");
  return data;
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
    `**Now building:** ${profileData.currentFocus}`,
    `**Now learning:** ${profileData.learningGoal}`,
    "",
    `<sub>Public GitHub snapshot refreshed ${date}. Activity metrics are evidence, not the identity.</sub>`,
    END
  ].join("\n");
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
  let summary;
  try {
    summary = await fetchGitHubSummary(data.username);
  } catch (error) {
    summary = { publicRepositories: "—", stars: "—", forks: "—", updatedAt: new Date().toISOString() };
    console.warn(`Using degraded profile data: ${error.message}`);
  }
  const readme = await fs.readFile(readmePath, "utf8");
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
