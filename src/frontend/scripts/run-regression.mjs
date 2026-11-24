// Regression baseline (Zapper): runs the regression scenarios (playwright-bdd) and the existing
// Vitest and xUnit suites, then merges every result into one JUnit XML file.
// Usage (from the repository root): pnpm --dir src/frontend regression
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const repoRoot = path.resolve(frontendDir, '..', '..')
const resultsDir = path.join(
  repoRoot,
  '.zapper',
  'regression-baseline',
  'results',
)
const rawDir = path.join(resultsDir, 'raw')
const resultFile = path.join(resultsDir, 'regression.xml')
const scenariosJson = path.join(rawDir, 'regression-scenarios.json')
const vitestXml = path.join(rawDir, 'vitest.xml')
const trxDir = path.join(rawDir, 'dotnet')
const backendSolution = path.join(
  repoRoot,
  'src',
  'backend',
  'Nexus.ZapperTodo.slnx',
)
const backendTestsDir = path.join(repoRoot, 'src', 'backend', 'tests')

const toRepoPath = (absolute) =>
  path.relative(repoRoot, absolute).split(path.sep).join('/')

function run(label, command, args, cwd) {
  console.log(`\n=== ${label}: ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status ?? 1
}

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const decodeXml = (value) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const attr = (element, name) => {
  const match = element.match(new RegExp(`\\s${name}="([^"]*)"`))
  return match ? decodeXml(match[1]) : undefined
}

// Each case: { suite, classname, name, file, status: passed|failed|skipped, message, tags }
function readScenarios() {
  if (!fs.existsSync(scenariosJson)) return null
  const features = JSON.parse(fs.readFileSync(scenariosJson, 'utf8'))
  const cases = []
  for (const feature of features) {
    const uri = toRepoPath(path.resolve(frontendDir, feature.uri))
    for (const element of feature.elements ?? []) {
      if (element.type === 'background') continue
      const parts = [
        ...(element.before ?? []),
        ...(element.steps ?? []),
        ...(element.after ?? []),
      ]
      const failing = parts.find((part) => part.result?.status !== 'passed')
      cases.push({
        suite: 'regression-scenarios',
        classname: uri,
        file: uri,
        name: element.name,
        status: failing ? 'failed' : 'passed',
        message: failing
          ? `${failing.keyword ?? 'hook'}${failing.name ?? ''}: ${failing.result?.status ?? 'unknown'} ${failing.result?.error_message ?? ''}`.trim()
          : undefined,
        tags: (element.tags ?? []).map((tag) => tag.name),
      })
    }
  }
  return cases
}

function readVitest() {
  if (!fs.existsSync(vitestXml)) return null
  const xml = fs.readFileSync(vitestXml, 'utf8')
  const cases = []
  for (const match of xml.matchAll(
    /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g,
  )) {
    const head = `<testcase${match[1]}>`
    const body = match[3] ?? ''
    const classname = attr(head, 'classname') ?? ''
    const file = `src/frontend/${classname.split('\\').join('/')}`
    const failure = body.match(/<(failure|error)\b([^>]*)>/)
    const skipped = /<skipped\b/.test(body)
    cases.push({
      suite: 'vitest',
      classname: file,
      file,
      name: attr(head, 'name') ?? '',
      status: failure ? 'failed' : skipped ? 'skipped' : 'passed',
      message: failure
        ? (attr(`<x${failure[2]}>`, 'message') ?? 'failed')
        : undefined,
    })
  }
  return cases
}

function findClassFile(className) {
  const fileName = `${className.split('.').pop()}.cs`
  const stack = [backendTestsDir]
  while (stack.length) {
    const dir = stack.pop()
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name !== 'bin' && entry.name !== 'obj')
          stack.push(path.join(dir, entry.name))
      } else if (entry.name === fileName) {
        return toRepoPath(path.join(dir, entry.name))
      }
    }
  }
  return className
}

function readDotnet() {
  if (!fs.existsSync(trxDir)) return null
  const trxFiles = fs
    .readdirSync(trxDir)
    .filter((name) => name.endsWith('.trx'))
  if (trxFiles.length === 0) return null
  const cases = []
  for (const trxFile of trxFiles) {
    const xml = fs.readFileSync(path.join(trxDir, trxFile), 'utf8')
    const classById = new Map()
    for (const match of xml.matchAll(
      /<UnitTest\b([^>]*)>[\s\S]*?<TestMethod\b([^>]*?)\/?>/g,
    )) {
      classById.set(
        attr(`<x${match[1]}>`, 'id'),
        attr(`<x${match[2]}>`, 'className'),
      )
    }
    for (const match of xml.matchAll(
      /<UnitTestResult\b([^>]*?)(\/>|>([\s\S]*?)<\/UnitTestResult>)/g,
    )) {
      const head = `<x${match[1]}>`
      const className = classById.get(attr(head, 'testId')) ?? ''
      const outcome = attr(head, 'outcome')
      const file = findClassFile(className)
      const message = (match[3] ?? '').match(/<Message>([\s\S]*?)<\/Message>/)
      cases.push({
        suite: 'dotnet',
        classname: file,
        file,
        name: attr(head, 'testName') ?? '',
        status:
          outcome === 'Passed'
            ? 'passed'
            : outcome === 'NotExecuted'
              ? 'skipped'
              : 'failed',
        message: message
          ? decodeXml(message[1])
          : outcome !== 'Passed'
            ? outcome
            : undefined,
      })
    }
  }
  return cases
}

function missing(suite) {
  return [
    {
      suite,
      classname: suite,
      file: suite,
      name: `${suite} produced no result file`,
      status: 'failed',
      message: `${suite} did not produce a readable result file`,
    },
  ]
}

function toJUnit(groups) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<testsuites name="regression">',
  ]
  for (const [suite, cases] of groups) {
    const failures = cases.filter((c) => c.status === 'failed').length
    const skipped = cases.filter((c) => c.status === 'skipped').length
    lines.push(
      `  <testsuite name="${escapeXml(suite)}" tests="${cases.length}" failures="${failures}" skipped="${skipped}">`,
    )
    for (const c of cases) {
      lines.push(
        `    <testcase classname="${escapeXml(c.classname)}" name="${escapeXml(c.name)}" file="${escapeXml(c.file)}">`,
      )
      if (c.tags?.length) {
        lines.push(
          `      <properties><property name="tags" value="${escapeXml(c.tags.join(' '))}"/></properties>`,
        )
      }
      if (c.status === 'failed')
        lines.push(
          `      <failure message="${escapeXml(c.message ?? 'failed')}"/>`,
        )
      if (c.status === 'skipped') lines.push('      <skipped/>')
      lines.push('    </testcase>')
    }
    lines.push('  </testsuite>')
  }
  lines.push('</testsuites>', '')
  return lines.join('\n')
}

fs.rmSync(resultsDir, { recursive: true, force: true })
fs.mkdirSync(rawDir, { recursive: true })

const config = 'playwright.regression.config.ts'
const bddgenCode = run(
  'Regression scenarios (generate)',
  'pnpm',
  ['exec', 'bddgen', '-c', config],
  frontendDir,
)
const codes = [
  bddgenCode,
  bddgenCode === 0
    ? run(
        'Regression scenarios',
        'pnpm',
        ['exec', 'playwright', 'test', '-c', config],
        frontendDir,
      )
    : 1,
  run(
    'Vitest',
    'pnpm',
    [
      'exec',
      'vitest',
      'run',
      '--reporter=default',
      '--reporter=junit',
      `--outputFile.junit=${vitestXml}`,
    ],
    frontendDir,
  ),
  run(
    'xUnit',
    'dotnet',
    ['test', backendSolution, '--logger', 'trx', '--results-directory', trxDir],
    repoRoot,
  ),
]

const groups = [
  ['regression-scenarios', readScenarios() ?? missing('regression-scenarios')],
  ['vitest', readVitest() ?? missing('vitest')],
  ['dotnet', readDotnet() ?? missing('dotnet')],
]
fs.writeFileSync(resultFile, toJUnit(groups))

const all = groups.flatMap(([, cases]) => cases)
const bad = all.filter((c) => c.status !== 'passed')
console.log(
  `\nRegression: ${all.length - bad.length}/${all.length} passed. Results: ${toRepoPath(resultFile)}`,
)
for (const c of bad)
  console.log(`  ${c.status.toUpperCase()} [${c.suite}] ${c.file} :: ${c.name}`)
process.exit(bad.length > 0 || codes.some((code) => code !== 0) ? 1 : 0)
