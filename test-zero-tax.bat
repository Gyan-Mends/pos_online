@echo off
echo Running Zero Tax Test...
cd /d %~dp0
node scripts/testZeroTax.cjs
pause 