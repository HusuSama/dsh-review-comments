/**
 * Host half of the file-review bundle: git status.
 *
 * The browser half cannot run processes, so this half polls `git status` and
 * `git diff` for every live Session's working directory and writes one compact
 * JSON file per Session under `.status/` next to this package. The browser half
 * reads that file through the ordinary workspace-files Remote (absolute file
 * reads are allowed) and paints the tree/file markers from it.
 *
 * Nothing here is model-facing and nothing touches the Session log.
 */
import { execFile } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The directory the browser half was built to read (build.mjs embeds the same path). */
const HERE = dirname(fileURLToPath(import.meta.url))
const STATUS_DIR = join(HERE, '.status')

/** Host poll period; the browser half polls the files a little slower. */
const POLL_MS = 2500
const GIT_TIMEOUT_MS = 5000
const MAX_BUFFER = 16 * 1024 * 1024
const MAX_FILES = 2000
const MAX_RUNS = 8000
const MAX_JSON_BYTES = 1_500_000
/** A directory that is not a repository is re-checked after this delay. */
const NON_REPO_TTL_MS = 30_000

/** Finder-launched apps often carry a minimal PATH; git lives in these places. */
const PATH_VALUE = [
  process.env.PATH,
  '/usr/bin',
  '/bin',
  '/usr/local/bin',
  '/opt/homebrew/bin',
].filter(Boolean).join(':')

const STATUS_NAMES = new Set(['added', 'modified', 'deleted', 'renamed', 'conflicted'])

/** Session ids are used as file names; keep only portable characters. */
function statusFileName(sessionId) {
  return String(sessionId).replace(/[^A-Za-z0-9._-]/g, '_') + '.json'
}

/** Run git and capture stdout; resolves with `{ ok, out }`, never rejects. */
function git(args, cwd) {
  return new Promise((resolve) => {
    execFile(
      'git',
      args,
      {
        cwd,
        env: { ...process.env, PATH: PATH_VALUE, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
        windowsHide: true,
      },
      (error, stdout) => {
        if (error) resolve({ ok: false, out: '' })
        else resolve({ ok: true, out: String(stdout || '') })
      },
    )
  })
}

/**
 * Map one porcelain-v2 XY pair (index status, worktree status) to our status.
 * @param {string} xy - two-character XY field.
 * @param {string} path - record path.
 * @param {boolean} untracked - the record was a `?` entry.
 * @returns {'added'|'modified'|'deleted'|'renamed'|'conflicted'|''}
 */
function statusOf(xy, untracked) {
  if (untracked) return 'added'
  const x = xy.slice(0, 1)
  const y = xy.slice(1, 2)
  if (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D')) return 'conflicted'
  if (x === 'D' || y === 'D') return 'deleted'
  if (x === 'R' || y === 'R') return 'renamed'
  if (x === 'A' || y === 'A' || x === 'C' || y === 'C') return 'added'
  if (x === 'M' || y === 'M' || x === 'T' || y === 'T') return 'modified'
  return ''
}

/**
 * Parse `git status --porcelain=v2 -z` output into change records.
 * @param {string} out - NUL separated porcelain output.
 * @returns {Array<{ path: string, oldPath: string, status: string }>}
 */
export function parsePorcelainV2(out) {
  const records = String(out || '').split('\0')
  const changes = []
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]
    if (!record) continue
    const kind = record.slice(0, 2)
    if (kind === '1 ') {
      const fields = record.split(' ')
      const xy = fields[1] || ''
      const path = fields.slice(8).join(' ')
      const status = statusOf(xy, false)
      if (path && status) changes.push({ path, oldPath: '', status })
      continue
    }
    if (kind === '2 ') {
      const fields = record.split(' ')
      const xy = fields[1] || ''
      const path = fields.slice(9).join(' ')
      const oldPath = records[index + 1] || ''
      index += 1
      const status = statusOf(xy, false) || 'modified'
      if (path) changes.push({ path, oldPath, status })
      continue
    }
    if (kind === 'u ') {
      const fields = record.split(' ')
      const path = fields.slice(10).join(' ')
      if (path) changes.push({ path, oldPath: '', status: 'conflicted' })
      continue
    }
    if (record.slice(0, 2) === '? ') {
      const path = record.slice(2)
      if (path) changes.push({ path, oldPath: '', status: 'added' })
    }
  }
  return changes
}

/**
 * Parse a unified diff (`--unified=0`) into per-path line runs.
 * @param {string} out - diff text.
 * @returns {Map<string, Array<{ start: number, end: number, kind: string, deleted?: number }>>}
 */
export function parseUnifiedZero(out) {
  const runs = new Map()
  const lines = String(out || '').split('\n')
  let currentPath = ''
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith('+++ ')) {
      const target = line.slice(4).trim()
      if (target === '/dev/null') currentPath = ''
      else currentPath = target.replace(/^b\//, '').replace(/^"b\//, '').replace(/"$/, '')
      continue
    }
    if (!currentPath || !line.startsWith('@@ ')) continue
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line)
    if (!match) continue
    const oldStart = Number(match[1])
    const oldCount = match[2] === undefined ? 1 : Number(match[2])
    const newStart = Number(match[3])
    const newCount = match[4] === undefined ? 1 : Number(match[4])
    if (!Number.isFinite(oldStart) || !Number.isFinite(oldCount) || !Number.isFinite(newStart) || !Number.isFinite(newCount)) continue
    let run = null
    if (newCount === 0 && oldCount > 0) {
      run = { start: Math.max(1, newStart), end: Math.max(1, newStart), kind: 'deleted', deleted: oldCount }
    } else if (newCount > 0 && oldCount === 0) {
      run = { start: newStart, end: newStart + newCount - 1, kind: 'added' }
    } else if (newCount > 0) {
      run = { start: newStart, end: newStart + newCount - 1, kind: 'modified' }
    }
    if (!run) continue
    const list = runs.get(currentPath)
    if (list === undefined) runs.set(currentPath, [run])
    else list.push(run)
  }
  for (const list of runs.values()) list.sort((a, b) => a.start - b.start)
  return runs
}

/** Cap the JSON payload; drop line detail first, then the file list tail. */
function shrink(data) {
  let json = JSON.stringify(data)
  if (json.length <= MAX_JSON_BYTES) return json
  data.truncated = true
  data.lineChanges = {}
  json = JSON.stringify(data)
  if (json.length <= MAX_JSON_BYTES) return json
  data.files = data.files.slice(0, 500)
  json = JSON.stringify(data)
  if (json.length <= MAX_JSON_BYTES) return json
  data.files = []
  return JSON.stringify(data)
}

/**
 * Compute the git status payload for one directory. Never throws.
 * @param {string} directory - absolute working directory of a Session.
 * @returns {Promise<object>} the payload written for that Session.
 */
export async function gitStatusFor(directory) {
  const base = { v: 1, generatedAt: Date.now(), isRepo: false }
  if (typeof directory !== 'string' || !directory) return base
  const rootResult = await git(['rev-parse', '--show-toplevel'], directory)
  if (!rootResult.ok) return base
  const repoRoot = rootResult.out.trim()
  if (!repoRoot) return base
  const branchResult = await git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot)
  const statusResult = await git(
    ['status', '--porcelain=v2', '-z', '--untracked-files=all', '--find-renames', '--'],
    repoRoot,
  )
  const changes = statusResult.ok ? parsePorcelainV2(statusResult.out) : []
  let diffResult = await git(['diff', '--no-color', '--no-ext-diff', '--unified=0', 'HEAD', '--'], repoRoot)
  if (!diffResult.ok) diffResult = await git(['diff', '--no-color', '--no-ext-diff', '--unified=0', '--'], repoRoot)
  const diffRuns = diffResult.ok ? parseUnifiedZero(diffResult.out) : new Map()

  const files = []
  const lineChanges = {}
  let runBudget = MAX_RUNS
  let truncated = changes.length > MAX_FILES || !statusResult.ok
  const kept = changes.slice(0, MAX_FILES)
  for (const change of kept) {
    if (!change || typeof change.path !== 'string' || !change.path) continue
    if (!STATUS_NAMES.has(change.status)) continue
    const absolute = join(repoRoot, change.path)
    files.push({
      path: change.path,
      abs: absolute,
      status: change.status,
      oldPath: typeof change.oldPath === 'string' ? change.oldPath : '',
    })
    const runs = diffRuns.get(change.path)
    if (runs && runs.length > 0) {
      if (runBudget <= 0) {
        truncated = true
        continue
      }
      const capped = runs.slice(0, runBudget)
      runBudget -= capped.length
      lineChanges[absolute] = capped
    }
  }
  const data = {
    v: 1,
    generatedAt: Date.now(),
    isRepo: true,
    repoRoot,
    cwd: directory,
    branch: branchResult.ok ? branchResult.out.trim() : '',
    truncated,
    files,
    lineChanges,
  }
  return data
}

/** Write one Session payload atomically; a failed write is warned, never thrown. */
function writeStatus(sessionId, json) {
  const target = join(STATUS_DIR, statusFileName(sessionId))
  const temporary = target + '.tmp'
  try {
    mkdirSync(STATUS_DIR, { recursive: true })
    writeFileSync(temporary, json)
    renameSync(temporary, target)
  } catch (error) {
    try { rmSync(temporary, { force: true }) } catch { /* ignore */ }
  }
}

/** Remove payloads for Sessions that are no longer live. */
function pruneStatusFiles(live) {
  let entries = []
  try { entries = readdirSync(STATUS_DIR) } catch { return }
  for (const entry of entries) {
    if (!entry.endsWith('.json') && !entry.endsWith('.json.tmp')) continue
    const name = basename(entry).replace(/\.json(\.tmp)?$/, '')
    if (!live.has(name)) {
      try { rmSync(join(STATUS_DIR, entry), { force: true }) } catch { /* ignore */ }
    }
  }
}

/** Required Host services: live Sessions and their committed working directories. */
export const inject = ['sessions', 'workingDirectory']

/**
 * Install the git status poller for the profile's lifetime.
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host plugin context.
 */
export function apply(ctx) {
  /** Last JSON written per Session file name, so unchanged repositories cost no writes. */
  const lastJson = new Map()
  /** Directory -> `{ root: string | null, at: number }`; non-repositories are cached. */
  const dirCache = new Map()
  let running = false

  const resolveDirectory = (session) => {
    try {
      const directory = ctx.workingDirectory.get(session)
      if (typeof directory === 'string' && directory) return directory
    } catch { /* fall through to the header */ }
    const header = session && session.header
    return header && typeof header.cwd === 'string' ? header.cwd : ''
  }

  const tick = async () => {
    if (running) return
    running = true
    try {
      let sessions = []
      try { sessions = ctx.sessions.list() } catch { sessions = [] }
      const live = new Set()
      const liveNames = new Set()
      /** directory -> payload computed once in this tick */
      const payloads = new Map()
      for (const session of sessions) {
        if (!session || session.id === undefined) continue
        const id = String(session.id)
        live.add(id)
        liveNames.add(statusFileName(id).replace(/\.json$/, ''))
        const directory = resolveDirectory(session)
        if (!directory) continue
        let payload = payloads.get(directory)
        if (payload === undefined) {
          const cached = dirCache.get(directory)
          const now = Date.now()
          if (cached !== undefined && cached.root === null && now - cached.at < NON_REPO_TTL_MS) {
            payload = { v: 1, generatedAt: now, isRepo: false }
          } else {
            try {
              payload = await gitStatusFor(directory)
            } catch {
              payload = { v: 1, generatedAt: now, isRepo: false }
            }
            dirCache.set(directory, { root: payload.isRepo ? payload.repoRoot : null, at: now })
          }
          payloads.set(directory, payload)
        }
        const json = shrink({ ...payload })
        if (lastJson.get(statusFileName(id)) === json) continue
        lastJson.set(statusFileName(id), json)
        writeStatus(id, json)
      }
      for (const name of [...lastJson.keys()]) if (!liveNames.has(name)) lastJson.delete(name)
      pruneStatusFiles(liveNames)
    } finally {
      running = false
    }
  }

  ctx.effect(() => {
    const first = setTimeout(() => { void tick() }, 1200)
    const timer = setInterval(() => { void tick() }, POLL_MS)
    if (typeof first.unref === 'function') first.unref()
    if (typeof timer.unref === 'function') timer.unref()
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, 'file-review: git status poller')
}
