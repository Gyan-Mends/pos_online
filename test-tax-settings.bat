@echo off
echo Running Tax Settings Test...
cd /d %~dp0pos
node scripts/testTaxSettings.cjs
pause 