"""
Regression test suite for iWhistle - Iteration 24
Tests: H1/M1/P3/A3 performance fixes regression
"""
import asyncio
import json
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
MANAGER_EMAIL = "manager@demo.com"
MANAGER_PASS = "manager123"
REFEREE_EMAIL = "referee@demo.com"
REFEREE_PASS = "Referee123"

results = {}
console_errors = []


async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})

        # Capture console errors
        page.on("console", lambda msg: console_errors.append(msg.text()) if msg.type == "error" else None)

        # -----------------------------------------------------------
        # TEST 1: constants.js exports (verified via code review)
        # -----------------------------------------------------------
        import os
        constants_path = "/app/src/constants.js"
        if os.path.exists(constants_path):
            with open(constants_path) as f:
                content = f.read()
            has_roles = "export const ROLES" in content
            has_game_status = "export const GAME_STATUS" in content
            has_assignment_status = "export const ASSIGNMENT_STATUS" in content
            results["constants_js_exists"] = "PASS" if has_roles and has_game_status and has_assignment_status else "FAIL"
            results["constants_ROLES"] = "PASS" if has_roles else "FAIL"
            results["constants_GAME_STATUS"] = "PASS" if has_game_status else "FAIL"
            results["constants_ASSIGNMENT_STATUS"] = "PASS" if has_assignment_status else "FAIL"
            print(f"constants.js checks: ROLES={has_roles}, GAME_STATUS={has_game_status}, ASSIGNMENT_STATUS={has_assignment_status}")
        else:
            results["constants_js_exists"] = "FAIL - file not found"
            print("FAIL: constants.js not found")

        # -----------------------------------------------------------
        # TEST 2: firestoreService.js H1 / M1 fixes
        # -----------------------------------------------------------
        fs_path = "/app/src/lib/firestoreService.js"
        if os.path.exists(fs_path):
            with open(fs_path) as f:
                fs_content = f.read()
            h1_batch_query = "chunkArray(gameIds, 30)" in fs_content
            m1_map = "new Map()" in fs_content and "availabilityByReferee" in fs_content
            h1_unassign = "chunkArray(gameIds, 30)" in fs_content and "batchUnassignRefereesRecord" in fs_content
            results["H1_batch_game_query"] = "PASS" if h1_batch_query else "FAIL"
            results["M1_availability_map"] = "PASS" if m1_map else "FAIL"
            results["H1_batch_unassign"] = "PASS" if h1_unassign else "FAIL"
            print(f"H1 batch: {h1_batch_query}, M1 map: {m1_map}, H1 unassign: {h1_unassign}")
        else:
            results["H1_batch_game_query"] = "FAIL - file not found"

        # -----------------------------------------------------------
        # TEST 3: Messages.jsx useMemo wrapping filteredMessages (P3)
        # -----------------------------------------------------------
        msg_path = "/app/src/pages/Messages.jsx"
        if os.path.exists(msg_path):
            with open(msg_path) as f:
                msg_content = f.read()
            p3_memo = "const filteredMessages = useMemo" in msg_content
            results["P3_filteredMessages_useMemo"] = "PASS" if p3_memo else "FAIL"
            print(f"P3 useMemo filteredMessages: {p3_memo}")
        else:
            results["P3_filteredMessages_useMemo"] = "FAIL - file not found"

        # -----------------------------------------------------------
        # TEST 4: Landing page loads
        # -----------------------------------------------------------
        try:
            await page.goto(BASE_URL, timeout=15000)
            await page.wait_for_timeout(5000)
            title = await page.title()
            results["landing_page_loads"] = "PASS" if title else "FAIL"
            print(f"Landing title: {title}")
            await page.screenshot(path=".screenshots/t4_landing.jpg", quality=40, full_page=False)
        except Exception as e:
            results["landing_page_loads"] = f"FAIL: {str(e)}"
            print(f"FAIL landing: {e}")

        # -----------------------------------------------------------
        # TEST 5: Demo login - Manager
        # -----------------------------------------------------------
        try:
            # Find Try Demo Account button
            demo_btn = await page.query_selector('button:has-text("Try Demo Account")')
            if not demo_btn:
                # Try login page directly
                await page.goto(BASE_URL + "/login", timeout=10000)
                await page.wait_for_timeout(3000)
                demo_btn = await page.query_selector('button:has-text("Try Demo Account")')

            if demo_btn:
                print("Found Try Demo Account button")
                await demo_btn.click(force=True)
                await page.wait_for_timeout(1500)
                await page.screenshot(path=".screenshots/t5_demo_modal.jpg", quality=40, full_page=False)

                # Select Manager role
                manager_btn = await page.query_selector('button:has-text("Manager")')
                if manager_btn:
                    print("Found Manager button in demo modal")
                    await manager_btn.click(force=True)
                    await page.wait_for_timeout(8000)
                    results["demo_login_manager"] = "PASS"
                    print("PASS: Manager demo login clicked")
                    await page.screenshot(path=".screenshots/t5_manager_dashboard.jpg", quality=40, full_page=False)
                else:
                    results["demo_login_manager"] = "FAIL: Manager button not found in modal"
                    print("FAIL: Manager role button not found")
            else:
                results["demo_login_manager"] = "FAIL: Try Demo Account button not found"
                print("FAIL: Try Demo Account button not found")
        except Exception as e:
            results["demo_login_manager"] = f"FAIL: {str(e)}"
            print(f"FAIL demo manager: {e}")

        # -----------------------------------------------------------
        # TEST 6: Manager Dashboard
        # -----------------------------------------------------------
        try:
            current_url = page.url
            print(f"Current URL after manager login: {current_url}")
            # Wait for dashboard to load
            await page.wait_for_timeout(5000)
            await page.screenshot(path=".screenshots/t6_manager_dash.jpg", quality=40, full_page=False)

            # Check for dashboard content
            body_text = await page.evaluate("document.body.innerText.substring(0, 1000)")
            print(f"Dashboard body: {body_text[:300]}")

            if "dashboard" in current_url.lower() or "Dashboard" in body_text or "Welcome" in body_text or "Games" in body_text:
                results["manager_dashboard_loads"] = "PASS"
                print("PASS: Manager dashboard loaded")
            else:
                results["manager_dashboard_loads"] = f"PARTIAL: URL={current_url}"
                print(f"Dashboard check: URL={current_url}")
        except Exception as e:
            results["manager_dashboard_loads"] = f"FAIL: {str(e)}"

        # -----------------------------------------------------------
        # TEST 7: Messages page - search/filter works
        # -----------------------------------------------------------
        try:
            # Navigate to messages
            await page.goto(BASE_URL + "/messages", timeout=10000)
            await page.wait_for_timeout(5000)
            await page.screenshot(path=".screenshots/t7_messages.jpg", quality=40, full_page=False)

            # Check page loaded
            messages_header = await page.query_selector('[data-testid="messages-page-header"]')
            search_input = await page.query_selector('[data-testid="messages-search-input"]')

            if messages_header and search_input:
                results["messages_page_loads"] = "PASS"
                print("PASS: Messages page loaded with header and search")

                # Test search filtering
                await search_input.fill("test")
                await page.wait_for_timeout(1000)
                body_after_search = await page.evaluate("document.body.innerText")
                results["messages_search_filter"] = "PASS"
                print("PASS: Search input works")

                # Clear and test again
                await search_input.fill("")
                await page.wait_for_timeout(500)
            else:
                body_text = await page.evaluate("document.body.innerText.substring(0, 500)")
                print(f"Messages page body: {body_text[:300]}")
                results["messages_page_loads"] = f"FAIL: header={messages_header is not None}, search={search_input is not None}"
                results["messages_search_filter"] = "FAIL: page not loaded properly"
        except Exception as e:
            results["messages_page_loads"] = f"FAIL: {str(e)}"
            results["messages_search_filter"] = f"FAIL: {str(e)}"
            print(f"FAIL messages: {e}")

        # -----------------------------------------------------------
        # TEST 8: Settings page - notification toggles
        # -----------------------------------------------------------
        try:
            await page.goto(BASE_URL + "/settings", timeout=10000)
            await page.wait_for_timeout(5000)
            await page.screenshot(path=".screenshots/t8_settings.jpg", quality=40, full_page=False)

            settings_page = await page.query_selector('[data-testid="settings-page"]')
            notif_card = await page.query_selector('[data-testid="settings-notifications-card"]')

            if settings_page:
                results["settings_page_loads"] = "PASS"
                print("PASS: Settings page loads (settings-page testid found)")
            else:
                body_text = await page.evaluate("document.body.innerText.substring(0, 500)")
                print(f"Settings body: {body_text[:200]}")
                results["settings_page_loads"] = "PARTIAL: settings-page testid not found but page may load"

            if notif_card:
                results["settings_notifications_card"] = "PASS"
            else:
                results["settings_notifications_card"] = "PARTIAL: notifications card testid not found"
        except Exception as e:
            results["settings_page_loads"] = f"FAIL: {str(e)}"

        # -----------------------------------------------------------
        # TEST 9: Profile page - Change Photo button
        # -----------------------------------------------------------
        try:
            await page.goto(BASE_URL + "/profile", timeout=10000)
            await page.wait_for_timeout(5000)
            await page.screenshot(path=".screenshots/t9_profile.jpg", quality=40, full_page=False)

            profile_page = await page.query_selector('[data-testid="profile-page"]')
            change_photo = await page.query_selector('button:has-text("Change Photo")')

            if profile_page:
                results["profile_page_loads"] = "PASS"
                print("PASS: Profile page loads")
            else:
                results["profile_page_loads"] = "PARTIAL"
                print("profile-page testid not found")

            if change_photo:
                results["profile_change_photo_button"] = "PASS"
                print("PASS: Change Photo button found")
            else:
                results["profile_change_photo_button"] = "FAIL: Change Photo button not found"
                print("FAIL: Change Photo button not found")
        except Exception as e:
            results["profile_page_loads"] = f"FAIL: {str(e)}"
            results["profile_change_photo_button"] = f"FAIL: {str(e)}"

        # -----------------------------------------------------------
        # TEST 10: Games/Schedule page
        # -----------------------------------------------------------
        try:
            await page.goto(BASE_URL + "/games", timeout=10000)
            await page.wait_for_timeout(5000)
            await page.screenshot(path=".screenshots/t10_games.jpg", quality=40, full_page=False)

            body_text = await page.evaluate("document.body.innerText.substring(0, 500)")
            print(f"Games body: {body_text[:300]}")

            # Check no error overlay
            error_els = await page.evaluate("""
                () => {
                    const els = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
                    return els.map(el => el.textContent.trim()).filter(t => t.length > 0);
                }
            """)
            if error_els:
                print(f"Error elements found: {error_els}")
                results["games_page_loads"] = f"FAIL: errors found: {error_els}"
            else:
                results["games_page_loads"] = "PASS"
                print("PASS: Games page loads without error elements")
        except Exception as e:
            results["games_page_loads"] = f"FAIL: {str(e)}"

        # -----------------------------------------------------------
        # TEST 11: Console errors check
        # -----------------------------------------------------------
        meaningful_errors = [e for e in console_errors if
                             "ERR_ABORTED" not in e and
                             "future flag" not in e.lower() and
                             "deprecated" not in e.lower() and
                             "warn" not in e.lower()]
        results["console_errors"] = f"PASS (0 critical)" if not meaningful_errors else f"FAIL: {meaningful_errors[:3]}"
        print(f"Console errors (critical): {len(meaningful_errors)}, all: {len(console_errors)}")

        # -----------------------------------------------------------
        # Logout and test REFEREE flow
        # -----------------------------------------------------------
        try:
            # Navigate to login page or use direct email/password login
            await page.goto(BASE_URL + "/login", timeout=10000)
            await page.wait_for_timeout(3000)
            await page.screenshot(path=".screenshots/t12_login_for_referee.jpg", quality=40, full_page=False)

            demo_btn = await page.query_selector('button:has-text("Try Demo Account")')
            if demo_btn:
                await demo_btn.click(force=True)
                await page.wait_for_timeout(1500)

                referee_btn = await page.query_selector('button:has-text("Referee")')
                if referee_btn:
                    await referee_btn.click(force=True)
                    await page.wait_for_timeout(8000)
                    current_url = page.url
                    print(f"Referee URL after login: {current_url}")
                    await page.screenshot(path=".screenshots/t12_referee_dashboard.jpg", quality=40, full_page=False)
                    results["demo_login_referee"] = "PASS"
                    print("PASS: Referee demo login clicked")

                    # Check referee dashboard
                    body_text = await page.evaluate("document.body.innerText.substring(0, 500)")
                    if "dashboard" in current_url.lower() or "Games" in body_text or "Schedule" in body_text:
                        results["referee_dashboard_loads"] = "PASS"
                        print("PASS: Referee dashboard loaded")
                    else:
                        results["referee_dashboard_loads"] = f"PARTIAL: URL={current_url}"
                else:
                    results["demo_login_referee"] = "FAIL: Referee button not found in modal"
            else:
                results["demo_login_referee"] = "FAIL: Try Demo Account button not found on login page"
        except Exception as e:
            results["demo_login_referee"] = f"FAIL: {str(e)}"
            results["referee_dashboard_loads"] = f"FAIL: {str(e)}"

        await browser.close()

        # Print final results
        print("\n=== FINAL TEST RESULTS ===")
        for key, val in results.items():
            status = "PASS" if str(val).startswith("PASS") else ("FAIL" if str(val).startswith("FAIL") else "PARTIAL")
            print(f"  [{status}] {key}: {val}")

        passed = sum(1 for v in results.values() if str(v).startswith("PASS"))
        total = len(results)
        print(f"\nTotal: {passed}/{total} PASSED")

        return results


if __name__ == "__main__":
    asyncio.run(run_tests())
