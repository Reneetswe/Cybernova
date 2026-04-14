# GitHub Deployment Guide

## Step-by-Step Instructions to Deploy CyberNova Analytics to GitHub

### Prerequisites
- Git installed on your computer
- GitHub account created
- Project is working locally

---

## Part 1: Prepare Your Project

### 1. Verify .gitignore exists
The `.gitignore` file has been created to exclude sensitive files like `.env`

**Important files that will NOT be uploaded:**
- `backend/.env` (contains database credentials and secrets)
- `__pycache__/` (Python cache files)
- `*.pyc` (Compiled Python files)

### 2. Remove sensitive data from tracked files

Make sure your `.env` file is in the `backend` folder and contains:
```env
DATABASE_URL=your_neon_connection_string
SECRET_KEY=your_secret_key
```

**⚠️ NEVER commit the `.env` file to GitHub!**

---

## Part 2: Initialize Git Repository

Open PowerShell in your project folder and run:

```powershell
# Navigate to project directory
cd "C:\Users\Reneetswe windows\CascadeProjects\cybernova"

# Initialize git repository
git init

# Add all files (respecting .gitignore)
git add .

# Create first commit
git commit -m "Initial commit: CyberNova Analytics full-stack application"
```

---

## Part 3: Create GitHub Repository

### Option A: Using GitHub Website

1. Go to https://github.com
2. Click the **"+"** icon in top right
3. Select **"New repository"**
4. Configure:
   - **Repository name**: `cybernova-analytics` (or your preferred name)
   - **Description**: "AI-Powered Cybersecurity Platform for Southern Africa"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (we already have one)
5. Click **"Create repository"**

### Option B: Using GitHub CLI (if installed)

```powershell
gh repo create cybernova-analytics --public --source=. --remote=origin
```

---

## Part 4: Push to GitHub

After creating the repository on GitHub, you'll see a URL like:
`https://github.com/YOUR_USERNAME/cybernova-analytics.git`

Run these commands:

```powershell
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/cybernova-analytics.git

# Rename branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

**If prompted for credentials:**
- Username: Your GitHub username
- Password: Use a Personal Access Token (not your password)

### Creating a Personal Access Token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "CyberNova Deployment"
4. Select scopes: `repo` (full control)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

---

## Part 5: Verify Upload

1. Go to your GitHub repository URL
2. You should see all your files except:
   - `.env` file (excluded by .gitignore)
   - `__pycache__` folders
   - Other ignored files

---

## Part 6: Set Up Repository Secrets (for CI/CD)

If you plan to use GitHub Actions for deployment:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these secrets:
   - `DATABASE_URL`: Your Neon connection string
   - `SECRET_KEY`: Your JWT secret key

---

## Part 7: Update README

Your README now includes:
- ✅ Setup instructions
- ✅ Tech stack documentation
- ✅ Deployment guides
- ✅ Troubleshooting section

---

## Part 8: Future Updates

When you make changes to your code:

```powershell
# Check what files changed
git status

# Add changed files
git add .

# Commit with a message
git commit -m "Description of changes"

# Push to GitHub
git push
```

---

## Common Git Commands

```powershell
# Check repository status
git status

# View commit history
git log --oneline

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Pull latest changes
git pull origin main

# View remote repositories
git remote -v
```

---

## Deployment Options After GitHub Upload

### 1. **Backend Deployment (Render)**
- Free tier available
- Automatic deployments from GitHub
- Built-in PostgreSQL support
- URL: https://render.com

### 2. **Frontend Deployment (Netlify)**
- Free tier available
- Automatic deployments from GitHub
- Custom domains
- URL: https://netlify.com

### 3. **Full-Stack Deployment (Railway)**
- Deploy both frontend and backend
- Free tier available
- URL: https://railway.app

---

## Security Checklist Before Pushing

- [ ] `.env` file is in `.gitignore`
- [ ] No hardcoded passwords in code
- [ ] No API keys in frontend code
- [ ] `.env.example` file created (without real credentials)
- [ ] README updated with setup instructions
- [ ] Database connection string not in any committed file

---

## Troubleshooting

### "Permission denied" error
- Use Personal Access Token instead of password
- Or set up SSH keys

### "Repository not found" error
- Check the repository URL is correct
- Verify you have access to the repository

### Files not uploading
- Check `.gitignore` - file might be excluded
- Run `git status` to see what's being tracked

### Large files error
- GitHub has 100MB file size limit
- Use Git LFS for large files

---

## Next Steps After GitHub Upload

1. **Add a LICENSE file** (MIT, Apache, etc.)
2. **Add GitHub Actions** for CI/CD
3. **Set up branch protection** rules
4. **Create issues** for future features
5. **Deploy to production** using Render/Netlify

---

## Support

If you encounter issues:
1. Check GitHub documentation: https://docs.github.com
2. Review error messages carefully
3. Ensure all prerequisites are met

**Your project is now ready for GitHub! 🚀**
