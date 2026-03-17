$ErrorActionPreference = 'Continue'
$repo = 'D:\Docs\Learn Tech\AIAgent\Refs\TodoList'
$logFile = Join-Path $repo 'docs\p2-p3-autoloop.log'

function Log($msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

function Run-WithRetry($phaseName, $prompt) {
  while ($true) {
    Log "START $phaseName"
    Set-Location $repo
    codex exec --full-auto $prompt
    $code = $LASTEXITCODE
    if ($code -eq 0) {
      Log "OK $phaseName"
      return
    }
    Log "FAIL $phaseName (exit=$code). Sleep 30s then retry"
    Start-Sleep -Seconds 30
  }
}

function Commit-IfChanges($message) {
  Set-Location $repo
  git add -A
  $status = git status --porcelain
  if ($status) {
    git commit -m $message
    if ($LASTEXITCODE -eq 0) { Log "COMMIT $message" } else { Log "COMMIT_FAIL $message" }
  } else {
    Log "NO_CHANGES $message"
  }
}

Set-Location $repo
if (-not (Test-Path $logFile)) {
  New-Item -ItemType File -Path $logFile -Force | Out-Null
}

Log 'AUTORUN STARTED: P2/P3 loop to production'

$phases = @(
  @{
    Name = 'P2-A Savings Goals';
    Prompt = 'Implement/complete Sprint 1 Savings Goals per docs/p2-p3-ux-dev-plan.md: goals data/actions, GoalCard+GoalModal, KidDashboard + Dashboard summary integration, milestone unlock 25/50/75/100 one-time, EN/VI i18n, targeted e2e test for create/progress/milestone. Keep scope focused and avoid regressions.'
    Commit = 'feat: P2 savings goals'
  },
  @{
    Name = 'P2-B Achievement Badges';
    Prompt = 'Implement P2 Achievement Badges per docs/p2-p3-ux-dev-plan.md: badge rules engine, store persistence, UI strip on KidDashboard + gallery on KidProfile, weekly report highlight for newly unlocked, EN/VI i18n, targeted tests. Keep code mobile-first and deterministic.'
    Commit = 'feat: P2 achievement badges'
  },
  @{
    Name = 'P2-C Fun Sounds and Animations';
    Prompt = 'Implement P2 fun sounds + animations per docs/p2-p3-ux-dev-plan.md: event-based feedback for task complete/day complete/badge unlock, settings toggle persist, respect reduced motion and sound off, add minimal assets/hooks, targeted tests. Keep performance light.'
    Commit = 'feat: P2 kid feedback sounds and animations'
  },
  @{
    Name = 'P3-D Sibling Leaderboard';
    Prompt = 'Implement P3 sibling leaderboard per docs/p2-p3-ux-dev-plan.md: weekly ranking card with fairness gate, most improved, streak star; show in parent dashboard and lightweight kid view; EN/VI i18n; targeted tests.'
    Commit = 'feat: P3 sibling leaderboard'
  },
  @{
    Name = 'P3-E Landing Social Proof';
    Prompt = 'Implement P3 landing page social proof per docs/p2-p3-ux-dev-plan.md: trust metrics strip, testimonials section, social proof block, EN/VI i18n, responsive styles, lightweight performance, targeted tests.'
    Commit = 'feat: P3 landing social proof'
  }
)

foreach ($phase in $phases) {
  Run-WithRetry $phase.Name $phase.Prompt

  Log "TEST $($phase.Name)"
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Log "BUILD_FAIL after $($phase.Name). Retrying phase"
    Run-WithRetry $phase.Name $phase.Prompt
    npm run build
  }

  Commit-IfChanges $phase.Commit

  Log "DEPLOY after $($phase.Name)"
  npm run deploy:prod:hosting
  if ($LASTEXITCODE -ne 0) {
    Log "DEPLOY_FAIL after $($phase.Name) - retrying deploy in 60s"
    Start-Sleep -Seconds 60
    npm run deploy:prod:hosting
  }
}

Log 'AUTORUN DONE: all P2/P3 phases completed'
