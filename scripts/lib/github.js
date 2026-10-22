import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(LIB_DIR, '..', '..');
export const CONF_DIR = path.join(ROOT, 'conf');
export const ASSETS_DIR = path.join(ROOT, 'assets');
export const MOCK_PATH = path.join(ROOT, 'scripts', 'mock-data.json');

export const USE_MOCK = process.argv.includes('--mock');
export const USERNAME = process.env.GH_USERNAME || 'jaybondholliete';

export function loadTheme() {
  return JSON.parse(fs.readFileSync(path.join(CONF_DIR, 'theme.json'), 'utf8'));
}

export function loadMock() {
  return JSON.parse(fs.readFileSync(MOCK_PATH, 'utf8'));
}

async function gql(query, variables = {}) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN env var required (or run with --mock).');
  }
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'gd-profile-readme',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

const PROFILE_QUERY = `
query($login: String!) {
  user(login: $login) {
    name
    login
    bio
    followers { totalCount }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date weekday contributionCount contributionLevel } }
      }
    }
    repositories(first: 100, isFork: false, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
      nodes {
        name
        description
        stargazerCount
        forkCount
        pushedAt
        primaryLanguage { name color }
        repositoryTopics(first: 5) { nodes { topic { name } } }
        languages(first: 6) { edges { size node { name color } } }
      }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          stargazerCount
          forkCount
          pushedAt
          primaryLanguage { name color }
          repositoryTopics(first: 5) { nodes { topic { name } } }
        }
      }
    }
  }
}`;

export async function fetchProfile() {
  if (USE_MOCK) return loadMock();
  const data = await gql(PROFILE_QUERY, { login: USERNAME });
  return data.user;
}

async function rest(p) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const res = await fetch(`https://api.github.com${p}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'gd-profile-readme',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub REST HTTP ${res.status}`);
  return res.json();
}

export async function fetchLatestEvent() {
  if (USE_MOCK) return loadMock().events?.[0] ?? null;
  const events = await rest(`/users/${USERNAME}/events/public?per_page=30`);
  if (!Array.isArray(events)) return null;
  return (
    events.find((e) => e.type === 'PushEvent' && e.payload?.commits?.length) ||
    events[0] ||
    null
  );
}

export function languageStack(user, limit = 5) {
  const totals = new Map();
  for (const repo of user.repositories?.nodes ?? []) {
    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node.name;
      const cur = totals.get(name) || { size: 0, color: edge.node.color };
      cur.size += edge.size;
      if (!cur.color) cur.color = edge.node.color;
      totals.set(name, cur);
    }
  }
  const top = [...totals.entries()].sort((a, b) => b[1].size - a[1].size);
  const sum = top.reduce((s, [, v]) => s + v.size, 0) || 1;
  const stack = top.map(([name, v]) => ({ name, color: v.color, pct: (v.size / sum) * 100 }));

  const manualPath = path.join(CONF_DIR, 'stack.json');
  if (fs.existsSync(manualPath)) {
    for (const m of JSON.parse(fs.readFileSync(manualPath, 'utf8'))) {
      const hit = stack.find((l) => l.name.toLowerCase() === m.name.toLowerCase());
      if (hit) Object.assign(hit, m);
      else stack.push(m);
    }
    stack.sort((a, b) => b.pct - a.pct);
  }
  return stack.slice(0, limit);
}

export function featuredRepos(user, limit = 4) {
  const picked = [];
  const manualPath = path.join(CONF_DIR, 'projects.json');
  const repoByName = new Map((user.repositories?.nodes ?? []).map((r) => [r.name, r]));

  if (fs.existsSync(manualPath)) {
    for (const name of JSON.parse(fs.readFileSync(manualPath, 'utf8'))) {
      const repo = repoByName.get(name);
      if (repo) picked.push(repo);
    }
  }
  if (!picked.length) picked.push(...(user.pinnedItems?.nodes ?? []));
  if (!picked.length) picked.push(...(user.repositories?.nodes ?? []));
  return picked.slice(0, limit);
}

export function repoTier(repo) {
  const ageMs = Date.now() - new Date(repo.pushedAt).getTime();
  const recency = ageMs < 30 * 864e5 ? 5 : ageMs < 90 * 864e5 ? 2 : 0;
  const score = repo.stargazerCount + repo.forkCount * 2 + recency;
  if (score >= 50) return 'demon';
  if (score >= 20) return 'insane';
  if (score >= 8) return 'hard';
  if (score >= 2) return 'normal';
  return 'easy';
}
