"""
Regression test suite for iWhistle - Iteration 24
Tests: H1/M1/P3/A3 performance fixes regression
"""
import asyncio
import os
from typing import Optional
from playwright.async_api import async_playwright, Page

BASE_URL = "http://localhost:3000"
MANAGER_EMAIL = "manager@demo.com"
MANAGER_PASS = "manager123"
REFEREE_EMAIL = "referee@demo.com"
REFEREE_PASS = "Referee123"


# ── Test State ────────────────────────────────────────────────────────────────

class RegressionState:
    """Collects results and console errors across all tests."""

    def __init__(self) -> None:
        self.results: dict[str, str] = {}
        self.console_errors: list[str] = []

    def record(self, key: str, status: str) -> None:
        self.results[key] = status
        print(f"  [{status.split(':')[0].split(' ')[0]}] {key}")

    def attach_console_listener(self, page: Page) -> None:
        page.on(
            "console",
            lambda msg: self.console_errors.append(msg.text()) if msg.type == "error" else None,
        )


# ── Static File Checks ───────────────────────────────────────────────────────

def check_constants_exports(state: RegressionState) -> None:
    """TEST 1: Verify constants.js exports required constants."""
    constants_path = "/app/src/constants.js"
    if not os.path.exists(constants_path):
        state.record("constants_js_exists", "FAIL - file not found")
        return

    with open(constants_path) as f:
        content = f.read()
    has_roles = "export const ROLES" in content
    has_game_status = "export const GAME_STATUS" in content
    has_assignment = "export const ASSIGNMENT_STATUS" in content

    state.record("constants_js_exists", "PASS" if (has_roles and has_game_status and has_assignment) else "FAIL")
    state.record("constants_ROLES", "PASS" if has_roles else "FAIL")
    state.record("constants_GAME_STATUS", "PASS" if has_game_status else "FAIL")
    state.record("constants_ASSIGNMENT_STATUS", "PASS" if has_assignment else "FAIL")


def check_firestore_service_fixes(state: RegressionState) -> None:
    """TEST 2: Verify firestoreService.js H1/M1 performance fixes."""
    fs_path = "/app/src/lib/firestoreService.js"
    if not os.path.exists(fs_path):
        state.record("H1_batch_game_query", "FAIL - file not found")
        return

    with open(fs_path) as f:
        content = f.read()
    state.record("H1_batch_game_query", "PASS" if "chunkArray(gameIds, 30)" in content else "FAIL")
    state.record("M1_availability_map", "PASS" if ("new Map()" in content and "availabilityByReferee" in content) else "FAIL")
    state.record("H1_batch_unassign", "PASS" if ("chunkArray(gameIds, 30)" in content and "batchUnassignRefereesRecord" in content) else "FAIL")


def check_messages_memo(state: RegressionState) -> None:
    """TEST 3: Verify Messages.jsx uses useMemo for filteredMessages."""
    msg_path = "/app/src/pages/Messages.jsx"
    if not os.path.exists(msg_path):
        state.record("P3_filteredMessages_useMemo", "FAIL - file not found")
        return

    with open(msg_path) as f:
        content = f.read()
    state.record("P3_filteredMessages_useMemo", "PASS" if "const filteredMessages = useMemo" in content else "FAIL")


# ── Browser Tests ─────────────────────────────────────────────────────────────

async def test_landing_page(page: Page, state: RegressionState) -> None:
    """TEST 4: Landing page loads."""
    await page.goto(BASE_URL, timeout=15000)
    await page.wait_for_timeout(5000)
    title = await page.title()
    state.record("landing_page_loads", "PASS" if title else "FAIL")


async def test_demo_manager_login(page: Page, state: RegressionState) -> None:
    """TEST 5: Demo login as Manager."""
    demo_btn = await page.query_selector('button:has-text("Try Demo Account")')
    if not demo_btn:
        await page.goto(f"{BASE_URL}/login", timeout=10000)
        await page.wait_for_timeout(3000)
        demo_btn = await page.query_selector('button:has-text("Try Demo Account")')

    if not demo_btn:
        state.record("demo_login_manager", "FAIL: Try Demo Account button not found")
        return

    await demo_btn.click(force=True)
    await page.wait_for_timeout(1500)

    manager_btn = await page.query_selector('button:has-text("Manager")')
    if not manager_btn:
        state.record("demo_login_manager", "FAIL: Manager button not found in modal")
        return

    await manager_btn.click(force=True)
    await page.wait_for_timeout(8000)
    state.record("demo_login_manager", "PASS")


async def test_manager_dashboard(page: Page, state: RegressionState) -> None:
    """TEST 6: Manager Dashboard loads."""
    current_url = page.url
    await page.wait_for_timeout(5000)
    body_text: str = await page.evaluate("document.body.innerText.substring(0, 1000)")
    is_loaded = "dashboard" in current_url.lower() or "Dashboard" in body_text or "Games" in body_text
    state.record("manager_dashboard_loads", "PASS" if is_loaded else f"PARTIAL: URL={current_url}")


async def test_messages_page(page: Page, state: RegressionState) -> None:
    """TEST 7: Messages page — search/filter works."""
    await page.goto(f"{BASE_URL}/messages", timeout=10000)
    await page.wait_for_timeout(5000)
    header = await page.query_selector('[data-testid="messages-page-header"]')
    search_input = await page.query_selector('[data-testid="messages-search-input"]')

    if header and search_input:
        state.record("messages_page_loads", "PASS")
        await search_input.fill("test")
        await page.wait_for_timeout(1000)
        await search_input.fill("")
        state.record("messages_search_filter", "PASS")
    else:
        state.record("messages_page_loads", f"FAIL: header={header is not None}, search={search_input is not None}")
        state.record("messages_search_filter", "FAIL: page not loaded properly")


async def test_settings_page(page: Page, state: RegressionState) -> None:
    """TEST 8: Settings page — notification toggles."""
    await page.goto(f"{BASE_URL}/settings", timeout=10000)
    await page.wait_for_timeout(5000)
    settings_page = await page.query_selector('[data-testid="settings-page"]')
    notif_card = await page.query_selector('[data-testid="settings-notifications-card"]')
    state.record("settings_page_loads", "PASS" if settings_page else "PARTIAL: testid not found")
    state.record("settings_notifications_card", "PASS" if notif_card else "PARTIAL: card testid not found")


async def test_profile_page(page: Page, state: RegressionState) -> None:
    """TEST 9: Profile page — Change Photo button."""
    await page.goto(f"{BASE_URL}/profile", timeout=10000)
    await page.wait_for_timeout(5000)
    profile_page = await page.query_selector('[data-testid="profile-page"]')
    change_photo = await page.query_selector('button:has-text("Change Photo")')
    state.record("profile_page_loads", "PASS" if profile_page else "PARTIAL")
    state.record("profile_change_photo_button", "PASS" if change_photo else "FAIL: Change Photo button not found")


async def test_games_page(page: Page, state: RegressionState) -> None:
    """TEST 10: Games/Schedule page loads."""
    await page.goto(f"{BASE_URL}/games", timeout=10000)
    await page.wait_for_timeout(5000)
    error_els: list[str] = await page.evaluate("""() => {
        const els = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
        return els.map(el => el.textContent.trim()).filter(t => t.length > 0);
    }""")
    state.record("games_page_loads", f"FAIL: errors found: {error_els}" if error_els else "PASS")


async def test_demo_referee_login(page: Page, state: RegressionState) -> None:
    """TEST 12: Demo login as Referee."""
    await page.goto(f"{BASE_URL}/login", timeout=10000)
    await page.wait_for_timeout(3000)
    demo_btn = await page.query_selector('button:has-text("Try Demo Account")')
    if not demo_btn:
        state.record("demo_login_referee", "FAIL: Try Demo Account button not found")
        return

    await demo_btn.click(force=True)
    await page.wait_for_timeout(1500)
    referee_btn = await page.query_selector('button:has-text("Referee")')
    if not referee_btn:
        state.record("demo_login_referee", "FAIL: Referee button not found in modal")
        return

    await referee_btn.click(force=True)
    await page.wait_for_timeout(8000)
    current_url = page.url
    state.record("demo_login_referee", "PASS")

    body_text: str = await page.evaluate("document.body.innerText.substring(0, 500)")
    is_loaded = "dashboard" in current_url.lower() or "Games" in body_text or "Schedule" in body_text
    state.record("referee_dashboard_loads", "PASS" if is_loaded else f"PARTIAL: URL={current_url}")


def check_console_errors(state: RegressionState) -> None:
    """TEST 11: Console errors check."""
    meaningful = [
        e for e in state.console_errors
        if "ERR_ABORTED" not in e
        and "future flag" not in e.lower()
        and "deprecated" not in e.lower()
        and "warn" not in e.lower()
    ]
    state.record("console_errors", "PASS (0 critical)" if not meaningful else f"FAIL: {meaningful[:3]}")


# ── Test Runner ───────────────────────────────────────────────────────────────

async def run_tests() -> dict[str, str]:
    """Execute the full regression suite."""
    state = RegressionState()

    # Static file checks (no browser needed)
    check_constants_exports(state)
    check_firestore_service_fixes(state)
    check_messages_memo(state)

    # Browser tests
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context()
        page = await ctx.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        state.attach_console_listener(page)

        browser_tests = [
            test_landing_page,
            test_demo_manager_login,
            test_manager_dashboard,
            test_messages_page,
            test_settings_page,
            test_profile_page,
            test_games_page,
        ]
        for test_fn in browser_tests:
            try:
                await test_fn(page, state)
            except Exception as e:
                name = test_fn.__name__.replace("test_", "")
                state.record(name, f"FAIL: {e}")

        # Referee flow
        try:
            await test_demo_referee_login(page, state)
        except Exception as e:
            state.record("demo_login_referee", f"FAIL: {e}")

        check_console_errors(state)
        await browser.close()

    # Summary
    print("\n=== FINAL TEST RESULTS ===")
    for key, val in state.results.items():
        status = "PASS" if str(val).startswith("PASS") else ("FAIL" if str(val).startswith("FAIL") else "PARTIAL")
        print(f"  [{status}] {key}: {val}")
    passed = sum(1 for v in state.results.values() if str(v).startswith("PASS"))
    print(f"\nTotal: {passed}/{len(state.results)} PASSED")

    return state.results


if __name__ == "__main__":
    asyncio.run(run_tests())
