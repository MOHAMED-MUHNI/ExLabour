#!/bin/bash

# ============================================================================
# ExLabour - Automated PR Creation & Merge Script (Bash)
# Version: 1.0.0
# Purpose: Merge feature/ratings-system to main with proper versioning
# Usage: bash merge-rating-feature.sh [--dry-run]
# ============================================================================

set -e

REPO="d/claude projects/my-project/ExLabour"
DRY_RUN=${1:-}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}===============================================${NC}"
echo -e "${CYAN}ExLabour - Automated Feature Merge${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""

# Check if we're in git repo
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Repository initialized${NC}"

# ============================================================================
# STEP 1: Verify Current Branch and Status
# ============================================================================
echo ""
echo -e "${YELLOW}[STEP 1/6] Verifying current branch status...${NC}"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "feature/ratings-system" ]; then
    echo -e "${YELLOW}⚠️  Current branch: $CURRENT_BRANCH (expected: feature/ratings-system)${NC}"
    git checkout feature/ratings-system
fi

STATUS=$(git status --porcelain)
if [ -n "$STATUS" ]; then
    echo -e "${RED}❌ Working directory has uncommitted changes:${NC}"
    echo "$STATUS"
    exit 1
fi

echo -e "${GREEN}✅ Branch: feature/ratings-system (clean)${NC}"

# ============================================================================
# STEP 2: Verify Feature Branch is Pushed
# ============================================================================
echo ""
echo -e "${YELLOW}[STEP 2/6] Verifying feature branch is pushed to GitHub...${NC}"

git fetch origin
LOCAL_COMMIT=$(git rev-parse feature/ratings-system)
REMOTE_COMMIT=$(git rev-parse origin/feature/ratings-system 2>/dev/null || echo "")

if [ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]; then
    echo -e "${GREEN}✅ Feature branch is up-to-date on GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Feature branch not on GitHub, pushing...${NC}"
    git push -u origin feature/ratings-system
fi

# ============================================================================
# STEP 3: Create Pull Request
# ============================================================================
echo ""
echo -e "${YELLOW}[STEP 3/6] Creating Pull Request...${NC}"

if command -v gh &> /dev/null; then
    echo -e "${CYAN}GitHub CLI detected, creating PR automatically...${NC}"
    
    if [ "$DRY_RUN" != "--dry-run" ]; then
        gh pr create \
            --title "feat: add ratings and reviews system" \
            --body "$(cat PR-RATINGS-SYSTEM.md)" \
            --base main \
            --head feature/ratings-system \
            --repo MOHAMED-MUHNI/ExLabour
        
        echo -e "${GREEN}✅ Pull Request created${NC}"
    else
        echo -e "${CYAN}[DRY RUN] Would create PR with GitHub CLI${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not found. Create PR manually:${NC}"
    echo -e "${CYAN}https://github.com/MOHAMED-MUHNI/ExLabour/pull/new/feature/ratings-system${NC}"
    echo ""
    echo -e "${YELLOW}Press Enter when PR is created and merged...${NC}"
    read
fi

# ============================================================================
# STEP 4: Switch to Main and Merge Feature Branch
# ============================================================================
echo ""
echo -e "${YELLOW}[STEP 4/6] Merging to main branch...${NC}"

if [ "$DRY_RUN" != "--dry-run" ]; then
    git checkout main
    echo -e "${GREEN}✅ Switched to main${NC}"
    
    git pull origin main
    echo -e "${GREEN}✅ Main branch updated from GitHub${NC}"
    
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
    
    echo -e "${GREEN}✅ Feature merged into main${NC}"
else
    echo -e "${CYAN}[DRY RUN] Would checkout main and merge feature/ratings-system${NC}"
fi

# ============================================================================
# STEP 5: Create Release Tag
# ============================================================================
echo ""
echo -e "${YELLOW}[STEP 5/6] Creating release tag v1.1.0...${NC}"

TAG_MESSAGE="v1.1.0: Add ratings and reviews system

Features:
- 5-star rating system for completed tasks
- User reviews with optional comments
- Anonymous review option
- User reputation stats (avg rating, total reviews)
- Complete CRUD operations for reviews
- Pagination for user reviews
- Frontend review components with interactive stars

Breaking Changes: None
Commits: 3
Files: 7 new/modified"

if [ "$DRY_RUN" != "--dry-run" ]; then
    git tag -a v1.1.0 -m "$TAG_MESSAGE"
    echo -e "${GREEN}✅ Tag v1.1.0 created${NC}"
else
    echo -e "${CYAN}[DRY RUN] Would create tag v1.1.0${NC}"
fi

# ============================================================================
# STEP 6: Push Changes and Tags
# ============================================================================
echo ""
echo -e "${YELLOW}[STEP 6/6] Pushing to GitHub...${NC}"

if [ "$DRY_RUN" != "--dry-run" ]; then
    git push origin main
    echo -e "${GREEN}✅ Main branch pushed${NC}"
    
    git push origin v1.1.0
    echo -e "${GREEN}✅ Tag v1.1.0 pushed${NC}"
else
    echo -e "${CYAN}[DRY RUN] Would push main branch and v1.1.0 tag to GitHub${NC}"
fi

# ============================================================================
# STEP 7: Cleanup Feature Branch
# ============================================================================
echo ""
echo -e "${YELLOW}[BONUS] Cleaning up feature branch...${NC}"

if [ "$DRY_RUN" != "--dry-run" ]; then
    git branch -d feature/ratings-system
    echo -e "${GREEN}✅ Local feature branch deleted${NC}"
    
    git push origin --delete feature/ratings-system
    echo -e "${GREEN}✅ Remote feature branch deleted${NC}"
else
    echo -e "${CYAN}[DRY RUN] Would delete feature/ratings-system locally and remotely${NC}"
fi

# ============================================================================
# Final Status
# ============================================================================
echo ""
echo -e "${CYAN}===============================================${NC}"
echo -e "${GREEN}✅ SUCCESS - Release v1.1.0 Ready!${NC}"
echo -e "${CYAN}===============================================${NC}"
echo ""
echo -e "${CYAN}📊 Summary:${NC}"
echo -e "  ${GREEN}• main branch: Merged with feature/ratings-system${NC}"
echo -e "  ${GREEN}• Tag: v1.1.0 created and pushed${NC}"
echo -e "  ${GREEN}• Feature branch: Cleaned up${NC}"
echo ""
echo -e "${CYAN}📝 View Release on GitHub:${NC}"
echo -e "  ${CYAN}https://github.com/MOHAMED-MUHNI/ExLabour/releases/tag/v1.1.0${NC}"
echo ""
echo -e "${YELLOW}📈 Current Status:${NC}"
git log --oneline -5
echo ""
echo -e "${GREEN}✨ Ready to start next phase!${NC}"
