# GitHub Push Script for Campus Guardian SOS App
# Run this after creating your GitHub repository

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "campus-guardian-sos"
)

$env:PATH = "C:\Program Files\Git\bin;$env:PATH"

Write-Host "🚀 Setting up GitHub repository..." -ForegroundColor Green
Write-Host ""

# Navigate to project directory
$projectPath = "H:\backup\another one\sos_app\prompty-web-builder-main"
Set-Location $projectPath

# Repository URL
$repoUrl = "https://github.com/$GitHubUsername/$RepoName.git"

Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
Write-Host ""

# Check if remote already exists
$existingRemote = git remote get-url origin -q 2>$null
if ($existingRemote) {
    Write-Host "⚠️  Remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
    $response = Read-Host "Do you want to replace it? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git remote remove origin
        Write-Host "✅ Removed existing remote" -ForegroundColor Green
    } else {
        Write-Host "❌ Aborted. Please remove the remote manually or use a different name." -ForegroundColor Red
        exit 1
    }
}

# Add remote
Write-Host "📡 Adding remote repository..." -ForegroundColor Cyan
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote added successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add remote" -ForegroundColor Red
    exit 1
}

# Verify remote
Write-Host ""
Write-Host "🔍 Verifying remote configuration..." -ForegroundColor Cyan
git remote -v

# Push to GitHub
Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "You may be prompted for your GitHub credentials." -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "🌐 View your repository at: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Common issues:" -ForegroundColor Red
    Write-Host "   1. Repository doesn't exist on GitHub - create it first at https://github.com/new" -ForegroundColor Yellow
    Write-Host "   2. Authentication failed - use a Personal Access Token instead of password" -ForegroundColor Yellow
    Write-Host "   3. Repository name mismatch - check the repository name" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 To create a Personal Access Token:" -ForegroundColor Cyan
    Write-Host "   Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   Generate new token (classic) with 'repo' scope" -ForegroundColor White
}

