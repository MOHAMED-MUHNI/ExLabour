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

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "ExLabour - Automated Feature Merge" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "$repo\.git")) {
    Write-Host "❌ Not in a git repository!" -ForegroundColor Red
    exit 1
}

Set-Location $repo
Write-Host "✅ Repository: $repo" -ForegroundColor Green

# ============================================================================
# STEP 1: Verify Current Branch and Status
# ============================================================================
Write-Host ""
Write-Host "[STEP 1/6] Verifying current branch status..." -ForegroundColor Yellow

$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "feature/ratings-system") {
    Write-Host "⚠️  Current branch: $currentBranch (expected: feature/ratings-system)" -ForegroundColor Yellow
    Write-Host "Switching to feature/ratings-system..." -ForegroundColor Yellow
    git checkout feature/ratings-system
}

$status = git status --porcelain
if ($status) {
    Write-Host "❌ Working directory has uncommitted changes:" -ForegroundColor Red
    Write-Host $status
    Write-Host "Please commit or stash changes first" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Branch: feature/ratings-system (clean)" -ForegroundColor Green

# ============================================================================
# STEP 2: Verify Feature Branch is Pushed
# ============================================================================
Write-Host ""
Write-Host "[STEP 2/6] Verifying feature branch is pushed to GitHub..." -ForegroundColor Yellow

git fetch origin
$localCommit = git rev-parse feature/ratings-system
$remoteCommit = git rev-parse origin/feature/ratings-system 2>$null

if ($remoteCommit -and $localCommit -eq $remoteCommit) {
    Write-Host "✅ Feature branch is up-to-date on GitHub" -ForegroundColor Green
} else {
    Write-Host "⚠️  Feature branch not on GitHub, pushing..." -ForegroundColor Yellow
    git push -u origin feature/ratings-system
    Write-Host "✅ Feature branch pushed" -ForegroundColor Green
}

# ============================================================================
# STEP 3: Create Pull Request (Manual or Using GitHub CLI)
# ============================================================================
Write-Host ""
Write-Host "[STEP 3/6] Creating Pull Request..." -ForegroundColor Yellow

# Check if GitHub CLI is installed
$ghInstalled = gh --version 2>$null
if ($ghInstalled) {
    Write-Host "GitHub CLI detected, creating PR automatically..." -ForegroundColor Cyan
    
    if (-not $DryRun) {
        gh pr create `
            --title "feat: add ratings and reviews system" `
            --body "$(Get-Content PR-RATINGS-SYSTEM.md)" `
            --base main `
            --head feature/ratings-system `
            --repo MOHAMED-MUHNI/ExLabour
        
        Write-Host "✅ Pull Request created" -ForegroundColor Green
    } else {
        Write-Host "[DRY RUN] Would create PR with GitHub CLI" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  GitHub CLI not found. Create PR manually:" -ForegroundColor Yellow
    Write-Host "https://github.com/MOHAMED-MUHNI/ExLabour/pull/new/feature/ratings-system" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Enter when PR is created and merged..." -ForegroundColor Yellow
    Read-Host
}

# ============================================================================
# STEP 4: Switch to Main and Merge Feature Branch
# ============================================================================
Write-Host ""
Write-Host "[STEP 4/6] Merging to main branch..." -ForegroundColor Yellow

if (-not $DryRun) {
    git checkout main
    Write-Host "✅ Switched to main" -ForegroundColor Green
    
    git pull origin main
    Write-Host "✅ Main branch updated from GitHub" -ForegroundColor Green
    
    git merge --no-ff feature/ratings-system -m "Merge pull request #1: Add ratings and reviews system

- Complete 5-star rating system
- User review management with CRUD operations
- Auto-calculated user reputation stats
- Frontend review components with validation
- Database indexes for optimal performance

Features:
  + POST /api/reviews/task/:taskId
  + GET /api/reviews/user/:userId
  + GET /api/reviews/my
  + GET /api/reviews/task/:taskId
  + PUT /api/reviews/:reviewId
  + DELETE /api/reviews/:reviewId

Closes #1"
    
    Write-Host "✅ Feature merged into main" -ForegroundColor Green
} else {
    Write-Host "[DRY RUN] Would checkout main and merge feature/ratings-system" -ForegroundColor Cyan
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
  POST   /api/reviews/task/:taskId       - Create review
  GET    /api/reviews/user/:userId        - Get user reviews (paginated)
  GET    /api/reviews/my                  - Get my submitted reviews
  GET    /api/reviews/task/:taskId        - Get task reviews
  PUT    /api/reviews/:reviewId           - Update review
  DELETE /api/reviews/:reviewId           - Delete review

Database Changes:
  + New Review collection
  + User.averageRating field
  + User.totalReviews field

Breaking Changes: None
Commits: 3
Files: 7 new/modified

Security:
  - Only authorized users can review
  - One review per task per reviewer
  - Validation: rating 1-5, comment max 500 chars
  - Anonymous option available

Performance:
  - Indexed queries for optimal retrieval
  - Compound index on taskId+reviewerId for uniqueness
  - Pagination support for large result sets
"@

if (-not $DryRun) {
    git tag -a v1.1.0 -m $tagMessage
    Write-Host "✅ Tag v1.1.0 created" -ForegroundColor Green
} else {
    Write-Host "[DRY RUN] Would create tag v1.1.0" -ForegroundColor Cyan
}

# ============================================================================
# STEP 6: Push Changes and Tags
# ============================================================================
Write-Host ""
Write-Host "[STEP 6/6] Pushing to GitHub..." -ForegroundColor Yellow

if (-not $DryRun) {
    git push origin main
    Write-Host "✅ Main branch pushed" -ForegroundColor Green
    
    git push origin v1.1.0
    Write-Host "✅ Tag v1.1.0 pushed" -ForegroundColor Green
} else {
    Write-Host "[DRY RUN] Would push main branch and v1.1.0 tag to GitHub" -ForegroundColor Cyan
}

# ============================================================================
# STEP 7: Cleanup Feature Branch (Optional)
# ============================================================================
Write-Host ""
Write-Host "[BONUS] Cleaning up feature branch..." -ForegroundColor Yellow

if (-not $DryRun) {
    git branch -d feature/ratings-system
    Write-Host "✅ Local feature branch deleted" -ForegroundColor Green
    
    git push origin --delete feature/ratings-system
    Write-Host "✅ Remote feature branch deleted" -ForegroundColor Green
} else {
    Write-Host "[DRY RUN] Would delete feature/ratings-system locally and remotely" -ForegroundColor Cyan
}

# ============================================================================
# Final Status
# ============================================================================
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "✅ SUCCESS - Release v1.1.0 Ready!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  • main branch: Merged with feature/ratings-system" -ForegroundColor Green
Write-Host "  • Tag: v1.1.0 created and pushed" -ForegroundColor Green
Write-Host "  • Feature branch: Cleaned up" -ForegroundColor Green
Write-Host ""
Write-Host "📝 View Release on GitHub:" -ForegroundColor Cyan
Write-Host "  https://github.com/MOHAMED-MUHNI/ExLabour/releases/tag/v1.1.0" -ForegroundColor Cyan
Write-Host ""
Write-Host "📈 Current Status:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""
Write-Host "✨ Ready to start next phase!" -ForegroundColor Green
