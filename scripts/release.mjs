#!/usr/bin/env node

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))

const colors = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  DIM: '\x1b[2m',
  NC: '\x1b[0m',
}

const step = (msg) => console.log(`\n${colors.BLUE}==>${colors.NC} ${msg}`)
const ok = (msg) => console.log(`  ${colors.GREEN}ok${colors.NC} ${msg}`)
const fail = (msg) => {
  console.log(`  ${colors.RED}error${colors.NC} ${msg}`)
  process.exit(1)
}

const ROOT_DIR = path.resolve(__dirname, '..')

for (const cmd of ['node', 'git']) {
  try {
    execSync(`where ${cmd}`, { stdio: 'ignore' })
  } catch {
    fail(`Required tool not found: ${cmd}`)
  }
}

if (!process.argv[2]) {
  console.log('Usage: node scripts/release.js [major|minor|patch|x.y.z]')
  console.log('')
  console.log('Examples:')
  console.log('  node scripts/release.js patch   # 0.1.8 -> 0.1.9')
  console.log('  node scripts/release.js minor   # 0.1.8 -> 0.2.0')
  console.log('  node scripts/release.js major   # 0.1.8 -> 1.0.0')
  console.log('  node scripts/release.js 0.2.0   # explicit version')
  process.exit(1)
}

const pkgPath = path.join(ROOT_DIR, 'package.json')
const currentVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version

const [major, minor, patch] = currentVersion.split('.').map(Number)
let newVersion

const arg = process.argv[2]
if (arg === 'major') {
  newVersion = `${major + 1}.0.0`
} else if (arg === 'minor') {
  newVersion = `${major}.${minor + 1}.0`
} else if (arg === 'patch') {
  newVersion = `${major}.${minor}.${patch + 1}`
} else if (/^\d+\.\d+\.\d+$/.test(arg)) {
  newVersion = arg
} else {
  fail('Invalid version format. Use x.y.z (e.g., 1.2.3)')
}

console.log(`${colors.BLUE}Release${colors.NC}`)
console.log(`  current : ${colors.DIM}${currentVersion}${colors.NC}`)
console.log(`  next    : ${colors.GREEN}${newVersion}${colors.NC}`)
console.log('')

;(async () => {
  try {
    // Pre-flight checks
    step('Running pre-flight checks')

    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    if (status.trim()) {
      fail('Uncommitted changes detected. Commit or stash them first.')
    }
    ok('Working tree clean')

    const branch = execSync('git branch --show-current', {
      encoding: 'utf-8',
    }).trim()

    if (branch !== 'main') {
      const cont = await question(
        `  ${colors.YELLOW}warning${colors.NC} You are on branch '${branch}', not 'main'.\n  Continue anyway? (y/n) `
      )
      if (!cont.match(/^y/i)) {
        console.log('Aborted.')
        process.exit(0)
      }
    } else {
      ok('On branch main')
    }

    try {
      execSync(`git tag | findstr "^v${newVersion}$"`, { stdio: 'ignore' })
      fail(`Tag v${newVersion} already exists.`)
    } catch {
      // Tag does not exist
    }
    ok(`Tag v${newVersion} is available`)

    const confirm = await question(`Proceed with release v${newVersion}? (y/n) `)
    if (!confirm.match(/^y/i)) {
      console.log('Aborted.')
      process.exit(0)
    }

    step('Updating version numbers')

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    pkg.version = newVersion
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
    ok('package.json')

    const tauriConfPath = path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json')
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'))
    tauriConf.version = newVersion
    fs.writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`)
    ok('src-tauri/tauri.conf.json')

    const cargoPath = path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml')
    let cargo = fs.readFileSync(cargoPath, 'utf-8')
    cargo = cargo.replace(/^(version\s*=\s*)"[^"]*"/m, `$1"${newVersion}"`)
    fs.writeFileSync(cargoPath, cargo)
    ok('src-tauri/Cargo.toml')

    step('Regenerating Cargo.lock')
    execSync('cargo generate-lockfile --quiet', {
      cwd: path.join(ROOT_DIR, 'src-tauri'),
      stdio: 'pipe',
    })
    ok('Cargo.lock')

    step('Generating changelog')

    let lastTag = ''
    try {
      lastTag = execSync('git describe --tags --abbrev=0', {
        encoding: 'utf-8',
      }).trim()
    } catch {
      lastTag = ''
    }

    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD'
    const today = new Date().toISOString().split('T')[0]

    let log = ''
    try {
      log = execSync(`git log ${range} --pretty=format:"%s" --reverse`, { encoding: 'utf-8' })
    } catch {
      log = ''
    }

    const added = []
    const fixed = []
    const changed = []

    const pattern = /^(feat|fix|refactor|perf|build|style|docs|test|chore)(\(.*?\))?!?:\s(.+)$/

    for (const line of log.split('\n').filter(Boolean)) {
      const m = line.match(pattern)
      if (!m) continue

      const [, type, scope, msg] = m
      const entry = scope ? `**${scope.slice(1, -1)}**: ${msg}` : msg

      switch (type) {
        case 'feat':
          added.push(entry)
          break
        case 'fix':
          fixed.push(entry)
          break
        case 'refactor':
        case 'perf':
        case 'style':
          changed.push(entry)
          break
      }
    }

    let entry = `## [${newVersion}] - ${today}`
    let hasContent = false

    if (added.length) {
      entry += `\n\n### Added\n\n${added.map((e) => `- ${e}`).join('\n')}`
      hasContent = true
    }
    if (fixed.length) {
      entry += `\n\n### Fixed\n\n${fixed.map((e) => `- ${e}`).join('\n')}`
      hasContent = true
    }
    if (changed.length) {
      entry += `\n\n### Changed\n\n${changed.map((e) => `- ${e}`).join('\n')}`
      hasContent = true
    }
    if (!hasContent) {
      entry += '\n\nMaintenance release.'
    }

    const changelogPath = path.join(ROOT_DIR, 'CHANGELOG.md')
    let changelog = fs.readFileSync(changelogPath, 'utf-8')
    const marker = '\n## ['
    const idx = changelog.indexOf(marker)

    if (idx !== -1) {
      const before = changelog.slice(0, idx)
      const after = changelog.slice(idx)
      changelog = `${before}\n\n${entry}\n${after}`
    } else {
      changelog = `${changelog.trimEnd()}\n\n${entry}\n`
    }

    fs.writeFileSync(changelogPath, changelog)
    ok('CHANGELOG.md')

    console.log('')
    console.log(`${colors.DIM}--- changelog preview ---${colors.NC}`)
    console.log(entry)
    console.log(`${colors.DIM}--- end preview ---${colors.NC}`)
    console.log('')

    const good = await question('Does the changelog look good? (y/n) ')
    if (!good.match(/^y/i)) {
      console.log('')
      console.log('Edit CHANGELOG.md manually, then run:')
      console.log(
        '  git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json CHANGELOG.md'
      )
      console.log(`  git commit -m "chore: release v${newVersion}"`)
      console.log(`  git tag -a v${newVersion} -m "Release v${newVersion}"`)
      console.log('  git push origin main --tags')
      process.exit(0)
    }

    step('Creating release commit')

    execSync(
      'git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json CHANGELOG.md',
      { stdio: 'pipe' }
    )
    execSync(`git commit -m "chore: release v${newVersion}"`, {
      stdio: 'pipe',
    })
    ok('Committed')

    step(`Creating tag v${newVersion}`)
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
      stdio: 'pipe',
    })
    ok('Tagged')

    console.log('')
    console.log(`${colors.GREEN}========================================${colors.NC}`)
    console.log(`${colors.GREEN}  Released v${newVersion}${colors.NC}`)
    console.log(`${colors.GREEN}========================================${colors.NC}`)
    console.log('')
    console.log('Next steps:')
    console.log('  1. Review the commit:  git show HEAD')
    console.log('  2. Push to trigger CI: git push origin main --tags')
    console.log('')
    console.log('  CI will build cross-platform binaries and create a draft GitHub release.')
    console.log('')
    console.log('To undo this release:')
    console.log(`  git tag -d v${newVersion} && git reset --soft HEAD~1`)

    rl.close()
  } catch (err) {
    console.error(`\n${colors.RED}Error: ${err.message}${colors.NC}`)
    process.exit(1)
  }
})()
