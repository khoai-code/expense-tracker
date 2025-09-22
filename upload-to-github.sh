#!/bin/bash

echo "🚀 GitHub Upload Helper"
echo "====================="
echo ""

echo "📋 STEP-BY-STEP INSTRUCTIONS:"
echo ""

echo "1️⃣ CREATE GITHUB REPOSITORY:"
echo "   • Go to https://github.com"
echo "   • Click '+' → 'New repository'"
echo "   • Name: expense-tracker"
echo "   • Make it PUBLIC"
echo "   • DON'T add README (we have code already)"
echo "   • Click 'Create repository'"
echo ""

echo "2️⃣ GET YOUR REPOSITORY URL:"
echo "   Your repository URL will be:"
echo "   https://github.com/YOUR_USERNAME/expense-tracker"
echo ""

echo "3️⃣ CONNECT YOUR CODE TO GITHUB:"
echo "   Replace YOUR_USERNAME with your actual GitHub username:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "4️⃣ EXAMPLE:"
echo "   If your username is 'john123', run:"
echo "   git remote add origin https://github.com/john123/expense-tracker.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "✅ AFTER UPLOAD:"
echo "   • Your code will be on GitHub"
echo "   • Go to vercel.com"
echo "   • Import your GitHub repository"
echo "   • Add environment variables"
echo "   • Deploy!"
echo ""

echo "🔑 Environment Variables for Vercel:"
echo "NEXT_PUBLIC_SUPABASE_URL=https://qvuarxsilushtbzaijtq.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2dWFyeHNpbHVzaHRiemFpanRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTkzNjEsImV4cCI6MjA3MzQ5NTM2MX0.HpGk8zGpe8COujKPUhvxUDVN0CqgrwcZUWV7Hxk4EFc"