# Troubleshooting Guide

## Common Issues and Solutions

### 1. Application Won't Start

#### Issue: `pnpm` command not found
**Solution**: 
- Use `npm` instead of `pnpm`
- Run: `npm install` then `npm run dev`

#### Issue: PowerShell execution policy error
**Solution**: 
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: Dependencies not installed
**Solution**: 
```bash
npm install
```

### 2. Development Server Issues

#### Issue: Port already in use
**Solution**: 
- Kill existing processes on port 5173
- Or use a different port: `npm run dev -- --port 3000`

#### Issue: TypeScript errors
**Solution**: 
- Make sure `src/vite-env.d.ts` includes environment variable types
- Check that all dependencies are properly installed

### 3. Supabase Connection Issues

#### Issue: "Local Storage" showing instead of "Cloud Sync"
**Solutions**: 
1. Check that `.env` file exists in project root
2. Verify environment variables are correctly set:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart development server after creating/modifying `.env`

#### Issue: Database errors
**Solutions**: 
1. Execute the SQL schema in Supabase SQL Editor
2. Check Supabase project is active and accessible
3. Verify API key permissions

### 4. Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 5. Project Structure Quick Reference

```
src/
├── components/          # UI components
│   ├── ui/             # shadcn/ui components
│   └── *.tsx           # Custom components
├── hooks/              # React hooks
├── lib/                # Utilities (Supabase config)
├── pages/              # Route components
├── types/              # TypeScript types
└── utils/              # Helper functions
```

### 6. Environment Setup

1. **Required**: Node.js v18+
2. **Package Manager**: npm (recommended) or pnpm
3. **Environment File**: `.env` in project root
4. **Database**: Supabase (with SQL schema executed)

### 7. Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)
- [ ] Application accessible at http://localhost:5173
- [ ] Connection status shows "Cloud Sync" (if Supabase configured)
- [ ] No TypeScript errors in console
- [ ] Database tables created in Supabase

### 8. Getting Help

If you continue to experience issues:
1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Ensure Supabase project is properly configured
4. Check network connectivity