# Automated Release Scripts

Professional scripts to automate the PR merge and release process.

## 📋 Scripts

### `merge-rating-feature.ps1` (Windows/PowerShell)
**Status:** Production-ready
**Requirements:** Git, PowerShell 5.0+, (optional) GitHub CLI

```powershell
# Run with full automation
.\scripts\merge-rating-feature.ps1

# Preview what will be done (dry run)
.\scripts\merge-rating-feature.ps1 -DryRun

# Skip manual PR creation
.\scripts\merge-rating-feature.ps1 -SkipPR
```

### `merge-rating-feature.sh` (Linux/macOS/Bash)
**Status:** Production-ready
**Requirements:** Git, Bash 4.0+, (optional) GitHub CLI

```bash
# Run with full automation
bash scripts/merge-rating-feature.sh

# Preview what will be done (dry run)
bash scripts/merge-rating-feature.sh --dry-run
```

## 🎯 What They Do

Both scripts perform the following steps automatically:

1. **Verify Branch Status** - Check that feature branch is clean and up-to-date
2. **Verify Remote** - Ensure feature branch is pushed to GitHub
3. **Create PR** - Use GitHub CLI to create PR (or manual instructions)
4. **Checkout Main** - Switch to main branch
5. **Merge Feature** - Merge feature branch with proper commit message
6. **Create Tag** - Create semantic version tag (v1.1.0)
7. **Push Changes** - Push merged code and tag to GitHub
8. **Cleanup** - Delete feature branch locally and remotely

## 💡 Before Running

✅ Ensure you're in the repository root:
```bash
cd d:\claude\ projects\my-project\ExLabour
```

✅ Current branch should be `feature/ratings-system`

✅ No uncommitted changes

✅ All changes are already pushed to GitHub

## 🔐 Safety Features

- ✅ Script stops on any error
- ✅ Dry-run mode to preview changes
- ✅ Checks for uncommitted changes
- ✅ Verifies GitHub connectivity
- ✅ Uses `--no-ff` flag to preserve branch history

## 📝 GitHub CLI Setup (Optional)

To enable automatic PR creation, install GitHub CLI:

**Windows:**
```powershell
choco install gh  # or install manually from https://github.com/cli/cli
```

**macOS:**
```bash
brew install gh
```

**Linux:**
```bash
type -p curl >/dev/null || sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y
```

Then authenticate:
```bash
gh auth login
```

## 🚀 Quick Start

```powershell
# Windows
cd "d:\claude projects\my-project\ExLabour"
.\scripts\merge-rating-feature.ps1 -DryRun
# Review output, then run without -DryRun
.\scripts\merge-rating-feature.ps1
```

```bash
# macOS/Linux
cd "/path/to/ExLabour"
bash scripts/merge-rating-feature.sh --dry-run
# Review output, then run without --dry-run
bash scripts/merge-rating-feature.sh
```

## 📊 Expected Output

```
===============================================
ExLabour - Automated Feature Merge
===============================================

[STEP 1/6] Verifying current branch status...
✅ Branch: feature/ratings-system (clean)

[STEP 2/6] Verifying feature branch is pushed to GitHub...
✅ Feature branch is up-to-date on GitHub

[STEP 3/6] Creating Pull Request...
✅ Pull Request created

[STEP 4/6] Merging to main branch...
✅ Switched to main
✅ Main branch updated from GitHub
✅ Feature merged into main

[STEP 5/6] Creating release tag v1.1.0...
✅ Tag v1.1.0 created

[STEP 6/6] Pushing to GitHub...
✅ Main branch pushed
✅ Tag v1.1.0 pushed

[BONUS] Cleaning up feature branch...
✅ Local feature branch deleted
✅ Remote feature branch deleted

===============================================
✅ SUCCESS - Release v1.1.0 Ready!
===============================================
```

## 🔍 Manual Alternative

If you prefer to do it manually:

```bash
# Checkout main
git checkout main
git pull origin main

# Merge with --no-ff to preserve branch history
git merge --no-ff feature/ratings-system -m "Merge pull request #1: Add ratings and reviews system"

# Create tag
git tag -a v1.1.0 -m "v1.1.0: Add ratings and reviews system"

# Push both
git push origin main
git push origin v1.1.0

# Cleanup
git branch -d feature/ratings-system
git push origin --delete feature/ratings-system
```

## 📞 Troubleshooting

**Script fails at "Create PR":**
- Install GitHub CLI, or manually create PR at:
  https://github.com/MOHAMED-MUHNI/ExLabour/pull/new/feature/ratings-system

**"Working directory has uncommitted changes":**
```bash
git stash
# Then run script again
```

**"Permission denied" (macOS/Linux):**
```bash
chmod +x scripts/merge-rating-feature.sh
```

**"Not in a git repository":**
Make sure you're in the ExLabour root directory:
```bash
cd "d:\claude projects\my-project\ExLabour"
```

## ✨ Success Indicators

After running the script successfully:

- ✅ Local `feature/ratings-system` branch is deleted
- ✅ Remote `feature/ratings-system` branch is deleted
- ✅ `main` branch contains merged code
- ✅ `v1.1.0` tag is created and pushed
- ✅ GitHub shows release page at `/releases/tag/v1.1.0`

## 🎓 Learning Resources

- [Git Branching Strategy](https://git-scm.com/docs/git-merge#:~:text=no-ff)
- [Semantic Versioning](https://semver.org/)
- [GitHub CLI Docs](https://cli.github.com/manual/)
