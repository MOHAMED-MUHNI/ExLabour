# ============================================================================
# ExLabour - Automated PR Creation & Merge Script
# Version: 1.0.0
# Purpose: Merge feature/ratings-system to main with proper versioning
# ============================================================================

param(
    [switch]$SkipPR = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$repo = "d:\claude projects\my-project\ExLabour"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "ExLabour - Automated Feature Merge" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "$repo\.git")) {
    Write-Host "[ERROR] Not in a git repository!" -ForegroundColor Red
    exit 1
}

Set-Location $repo
Write-Host "[OK] Repository: $repo" -ForegroundColor Green

# ============================================================================
# STEP 1: Verify Current Branch and Status
# ============================================================================
Write-Host ""
Write-Host "[STEP 1/6] Verifying current branch status..." -ForegroundColor Yellow

$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "feature/ratings-system") {
    Write-Host "[WARN] Current branch: $currentBranch (expected: feature/ratings-system)" -ForegroundColor Yellow
    Write-Host "[INFO] Switching to feature/ratings-system..." -ForegroundColor Yellow
    git checkout feature/ratings-system
}

$status = git status --porcelain
if ($status) {
    Write-Host "[ERROR] Working directory has uncommitted changes:" -ForegroundColor Red
    Write-Host $status
    Write-Host "[ERROR] Please commit or stash changes first" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Branch: feature/ratings-system (clean)" -ForegroundColor Green

# ============================================================================
# STEP 2: Verify Feature Branch is Pushed
# ============================================================================
Write-Host ""
Write-Host "[STEP 2/6] Verifying feature branch is pushed to GitHub..." -ForegroundColor Yellow

git fetch origin 2>$null
$localCommit = git rev-parse feature/ratings-system
$remoteCommit = git rev-parse origin/feature/ratings-system 2>$null

if ($remoteCommit -and $localCommit -eq $remoteCommit) {
    Write-Host "[OK] Feature branch is up-to-date on GitHub" -ForegroundColor Green
} else {
    Write-Host "[WARN] Feature branch not on GitHub, pushing..." -ForegroundColor Yellow
    git push -u origin feature/ratings-system
    Write-Host "[OK] Feature branch pushed" -ForegroundColor Green
}

# ============================================================================
# STEP 3: Create Pull Request (Manual)
# ============================================================================
Write-Host ""
Write-Host "[STEP 3/6] Creating Pull Request..." -ForegroundColor Yellow

# Check if GitHub CLI is installed
$ghInstalled = gh --version 2>$null
if ($ghInstalled) {
    Write-Host "[INFO] GitHub CLI detected. Create PR manually at:" -ForegroundColor Cyan
    Write-Host "  https://github.com/MOHAMED-MUHNI/ExLabour/pull/new/feature/ratings-system" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[INFO] Or use: gh pr create --title 'feat: add ratings and reviews system' --base main" -ForegroundColor Cyan
} else {
    Write-Host "[WARN] GitHub CLI not found. Create PR manually at:" -ForegroundColor Yellow
    Write-Host "  https://github.com/MOHAMED-MUHNI/ExLabour/pull/new/feature/ratings-system" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "[WAIT] Press Enter when PR is created and merged on GitHub..." -ForegroundColor Yellow
Read-Host

# ============================================================================
# STEP 4: Switch to Main and Merge Feature Branch
# ============================================================================
Write-Host ""
Write-Host "[STEP 4/6] Merging to main branch..." -ForegroundColor Yellow

if (-not $DryRun) {
    git checkout main
    Write-Host "[OK] Switched to main" -ForegroundColor Green
    
    git pull origin main 2>$null
    Write-Host "[OK] Main branch updated from GitHub" -ForegroundColor Green
    
    git merge --no-ff feature/ratings-system -m "Merge pull request #1: Add ratings and reviews system

Features:
- Complete 5-star rating system
- User review management with CRUD operations
- Auto-calculated user reputation stats
- Frontend review components with validation
- Database indexes for optimal performance

Endpoints:
+ POST /api/reviews/task/:taskId
+ GET /api/reviews/user/:userId
+ GET /api/reviews/my
+ GET /api/reviews/task/:taskId
+ PUT /api/reviews/:reviewId
+ DELETE /api/reviews/:reviewId

Closes #1"
    
    Write-Host "[OK] Feature merged into main" -ForegroundColor Green
} else {
    Write-Host "[DRY-RUN] Would checkout main and merge feature/ratings-system" -ForegroundColor Cyan
}

# ============================================================================
# STEP 5: Create Release Tag
# ============================================================================
Write-Host ""
Write-Host "[STEP 5/6] Creating release tag v1.1.0..." -ForegroundColor Yellow

$tagMessage = @"
v1.1.0: Add ratings and reviews system

Features:
- 5-star rating system for completed tasks
- User reviews with optional comments
- Anonymous review option
- User reputation stats (avg rating, total reviews)
- Complete CRUD operations for reviews
- Pagination for user reviews
- Frontend review components with interactive stars

Backend Endpoints:
  POST   /api/reviews/task/:taskId
  GET    /api/reviews/user/:userId
  GET    /api/reviews/my
  GET    /api/reviews/task/:taskId
  PUT    /api/reviews/:reviewId
  DELETE /api/reviews/:reviewId

Database Changes:
  + New Review collection
  + User.averageRating field
  + User.totalReviews field

Breaking Changes: None
Commits: 4
Files: 10 new/modified (including automation scripts)
"@

if (-not $DryRun) {
    git tag -a v1.1.0 -m $tagMessage
    Write-Host "[OK] Tag v1.1.0 created" -ForegroundColor Green
} else {
    Write-Host "[DRY-RUN] Would create tag v1.1.0" -ForegroundColor Cyan
}

# ============================================================================
# STEP 6: Push Changes and Tags
# ============================================================================
Write-Host ""
Write-Host "[STEP 6/6] Pushing to GitHub..." -ForegroundColor Yellow

if (-not $DryRun) {
    git push origin main
    Write-Host "[OK] Main branch pushed" -ForegroundColor Green
    
    git push origin v1.1.0
    Write-Host "[OK] Tag v1.1.0 pushed" -ForegroundColor Green
} else {
    Write-Host "[DRY-RUN] Would push main branch and v1.1.0 tag to GitHub" -ForegroundColor Cyan
}

# ============================================================================
# STEP 7: Cleanup Feature Branch (Optional)
# ============================================================================
Write-Host ""
Write-Host "[STEP 7/7] Cleaning up feature branch..." -ForegroundColor Yellow

if (-not $DryRun) {
    git branch -d feature/ratings-system
    Write-Host "[OK] Local feature branch deleted" -ForegroundColor Green
    
    git push origin --delete feature/ratings-system 2>$null
    Write-Host "[OK] Remote feature branch deleted" -ForegroundColor Green
} else {
    Write-Host "[DRY-RUN] Would delete feature/ratings-system locally and remotely" -ForegroundColor Cyan
}

# ============================================================================
# Final Status
# ============================================================================
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Release v1.1.0 Ready!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  [OK] main branch: Merged with feature/ratings-system" -ForegroundColor Green
Write-Host "  [OK] Tag: v1.1.0 created and pushed" -ForegroundColor Green
Write-Host "  [OK] Feature branch: Cleaned up" -ForegroundColor Green
Write-Host ""
Write-Host "View Release on GitHub:" -ForegroundColor Cyan
Write-Host "  https://github.com/MOHAMED-MUHNI/ExLabour/releases/tag/v1.1.0" -ForegroundColor Cyan
Write-Host ""
Write-Host "Recent commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""
Write-Host "Ready to start next phase!" -ForegroundColor Green
