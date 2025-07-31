@echo off
echo.
echo ========================================
echo    GROCERY PRODUCTS SEEDING SCRIPT
echo ========================================
echo.
echo This script will add all grocery products to your POS system
echo Categories include: Food Items, Beverages, Toiletries, etc.
echo.
echo Press any key to continue...
pause >nul

echo.
echo Running grocery products seeding script...
node scripts/seedGroceryProducts.cjs

echo.
echo ========================================
echo    SEEDING COMPLETED
echo ========================================
echo.
echo Check the output above for results
echo.
pause 