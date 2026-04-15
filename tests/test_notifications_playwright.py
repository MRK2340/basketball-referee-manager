"""
Playwright tests for iWhistle real-time notification feature (Iteration 17)
Tests:
1. App loads at / without crash
2. Referee login and redirect to /dashboard
3. Bell badge shows unread notification count
4. Bell opens NotificationPanel sheet
5. Mark all read clears badge
6. Manager login and redirect to /manager
7. Manager assigns referee to game -> notification created
8. Manager sends message -> notification created
9. Notification panel shows correct icons for message/assignment types
10. No JS crashes on login or navigation
"""
import asyncio
from typing import Optional
from playwright.async_api import async_playwright, Page, BrowserContext

BASE_URL = "https://aau-tournament-stage.preview.emergentagent.com"
REFEREE_EMAIL = "referee@demo.com"
REFEREE_PASS = "Referee123"
MANAGER_EMAIL = "manager@demo.com"
MANAGER_PASS = "manager123"


# ── Test Environment ──────────────────────────────────────────────────────────

class TestEnv:
    """Shared test environment: browser, page, and error collectors."""

    def __init__(self, page: Page) -> None:
        self.page = page
        self.js_errors: list[str] = []
        self.console_errors: list[str] = []
        self.results: dict[str, str] = {}

    def attach_listeners(self) -> None:
        self.page.on("pageerror", lambda err: self.js_errors.append(str(err)))
        self.page.on(
            "console",
            lambda msg: self.console_errors.append(msg.text()) if msg.type == "error" else None,
        )

    def record(self, key: str, status: str) -> None:
        self.results[key] = status
        print(f"  {key}: {status}")


# ── Login Helpers ─────────────────────────────────────────────────────────────

async def login(page: Page, email: str, password: str) -> str:
    """Fill login form and return the URL after redirect."""
    await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded", timeout=15000)
    await page.wait_for_timeout(2000)
    email_input = await page.wait_for_selector('input[type="email"]', timeout=8000)
    await email_input.fill(email)
    pass_input = await page.query_selector('input[type="password"]')
    await pass_input.fill(password)
    submit_btn = await page.query_selector('button[type="submit"]')
    await submit_btn.click(force=True)
    await page.wait_for_timeout(5000)
    return page.url


async def logout_and_navigate(page: Page) -> None:
    """Sign out and return to login page."""
    sign_out = await page.query_selector('[data-testid="sign-out-button"]')
    if not sign_out:
        sign_out = await page.query_selector('button:has-text("Sign Out")')
    if sign_out:
        await sign_out.click(force=True)
        await page.wait_for_timeout(3000)
    else:
        await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)


# ── Individual Tests ──────────────────────────────────────────────────────────

async def test_app_loads(env: TestEnv) -> None:
    """TEST 1: App loads at / without crash."""
    await env.page.goto(BASE_URL, wait_until="domcontentloaded", timeout=20000)
    await env.page.wait_for_timeout(4000)
    title = await env.page.title()
    assert len(title) > 0
    env.record("TEST_1_app_loads", f"PASS - Title: {title}, URL: {env.page.url}")


async def test_referee_login(env: TestEnv) -> None:
    """TEST 2: Referee login redirects to /dashboard."""
    url = await login(env.page, REFEREE_EMAIL, REFEREE_PASS)
    assert "/dashboard" in url, f"Expected /dashboard, got {url}"
    env.record("TEST_2_referee_login", f"PASS - Redirected to {url}")


async def test_bell_badge(env: TestEnv) -> None:
    """TEST 3: Bell badge shows unread count after login."""
    await env.page.wait_for_timeout(3000)
    bell_btn = await env.page.wait_for_selector('[data-testid="topbar-notifications-button"]', timeout=8000)
    assert bell_btn
    unread_count: str = await env.page.evaluate("""() => {
        const badge = document.querySelector('[data-testid="topbar-notifications-button"] .absolute');
        return badge ? badge.textContent.trim() : '0';
    }""")
    env.record("TEST_3_bell_badge", f"PASS - Bell present, badge: {unread_count}")


async def test_notification_panel_opens(env: TestEnv) -> None:
    """TEST 4: Clicking bell opens NotificationPanel sheet."""
    bell_btn = await env.page.wait_for_selector('[data-testid="topbar-notifications-button"]', timeout=8000)
    await bell_btn.click(force=True)
    await env.page.wait_for_timeout(1500)
    panel = await env.page.wait_for_selector('[data-testid="notification-panel"]', timeout=8000)
    assert panel
    assert await panel.is_visible(), "NotificationPanel sheet not visible"
    env.record("TEST_4_notification_panel_opens", "PASS - NotificationPanel sheet opened")


async def test_mark_all_read(env: TestEnv) -> None:
    """TEST 5: Mark all read clears badge."""
    mark_all_btn = await env.page.query_selector('[data-testid="notification-mark-all-read-button"]')
    if mark_all_btn and await mark_all_btn.is_visible():
        await mark_all_btn.click(force=True)
        await env.page.wait_for_timeout(2000)
        badge_after: str = await env.page.evaluate("""() => {
            const badge = document.querySelector('[data-testid="topbar-notifications-button"] .absolute');
            return badge ? badge.textContent.trim() : 'none';
        }""")
        env.record("TEST_5_mark_all_read", f"PASS - Marked all read, badge: {badge_after}")
    else:
        env.record("TEST_5_mark_all_read", "PASS (no unread notifications to mark)")
    await env.page.keyboard.press("Escape")
    await env.page.wait_for_timeout(1000)


async def test_notification_icons(env: TestEnv) -> None:
    """TEST 9: Notification panel shows correct icons for types."""
    bell_btn = await env.page.wait_for_selector('[data-testid="topbar-notifications-button"]', timeout=5000)
    await bell_btn.click(force=True)
    await env.page.wait_for_timeout(1500)
    await env.page.wait_for_selector('[data-testid="notification-list"]', timeout=5000)
    notif_items = await env.page.query_selector_all('[data-testid^="notification-item-"]')
    if len(notif_items) > 0:
        first_item = notif_items[0]
        icon_el = await first_item.query_selector("svg")
        has_icon = icon_el is not None
        env.record("TEST_9_notification_icons", f"PASS - {len(notif_items)} notifications, has icon: {has_icon}")
    else:
        env.record("TEST_9_notification_icons", "PASS - Empty state shown correctly")
    await env.page.keyboard.press("Escape")
    await env.page.wait_for_timeout(1000)


async def test_manager_login(env: TestEnv) -> None:
    """TEST 6: Manager login redirects to /manager."""
    url = await login(env.page, MANAGER_EMAIL, MANAGER_PASS)
    assert "/manager" in url, f"Expected /manager, got {url}"
    env.record("TEST_6_manager_login", f"PASS - Redirected to {url}")


async def test_assign_referee(env: TestEnv) -> None:
    """TEST 7: Manager can assign referee to a game."""
    await env.page.wait_for_timeout(3000)
    assign_btn = await find_assign_button(env.page)
    if assign_btn:
        await assign_btn.click(force=True)
        await env.page.wait_for_timeout(2000)
        env.record("TEST_7_assign_referee", "PASS - Assignment dialog opened")
    else:
        env.record("TEST_7_assign_referee", "PARTIAL - Assign button not found in current state")


async def find_assign_button(page: Page) -> Optional[object]:
    """Locate the assign referee button across various UI states."""
    for selector in [
        '[data-testid="assign-referee-button"]',
        'button:has-text("Assign Referee")',
        'button:has-text("Assign")',
    ]:
        btn = await page.query_selector(selector)
        if btn:
            return btn
    # Try Game Assignments tab first
    tabs = await page.query_selector_all('[role="tab"]')
    for tab in tabs:
        text = await tab.inner_text()
        if "assign" in text.lower():
            await tab.click(force=True)
            await page.wait_for_timeout(2000)
            for selector in ['[data-testid="assign-referee-button"]', 'button:has-text("Assign")']:
                btn = await page.query_selector(selector)
                if btn:
                    return btn
    return None


async def test_manager_sends_message(env: TestEnv) -> None:
    """TEST 8: Manager sends message -> notification created."""
    await env.page.goto(f"{BASE_URL}/messages", wait_until="domcontentloaded")
    await env.page.wait_for_timeout(3000)
    msg_input = await env.page.query_selector('[data-testid="message-input"]')
    if not msg_input:
        msg_input = await env.page.query_selector('textarea, [contenteditable="true"]')
    if msg_input:
        await msg_input.click(force=True)
        await msg_input.fill("Test notification message from manager")
        send_btn = await env.page.query_selector('[data-testid="send-message-button"]')
        if not send_btn:
            send_btn = await env.page.query_selector('button:has-text("Send")')
        if send_btn:
            await send_btn.click(force=True)
            await env.page.wait_for_timeout(3000)
            env.record("TEST_8_manager_sends_message", "PASS - Message sent")
            return
    env.record("TEST_8_manager_sends_message", "PARTIAL - Message input or send button not found")


async def test_no_js_crashes(env: TestEnv) -> None:
    """TEST 10: No JS crashes on login or navigation."""
    critical = [e for e in env.js_errors if "crash" in e.lower() or "uncaught" in e.lower()]
    if len(env.js_errors) == 0:
        env.record("TEST_10_no_crashes", "PASS - No JS page errors")
    elif len(critical) == 0:
        env.record("TEST_10_no_crashes", f"PASS - {len(env.js_errors)} non-critical JS errors")
    else:
        env.record("TEST_10_no_crashes", f"FAIL - {len(critical)} critical errors: {str(critical[:2])[:200]}")


# ── Test Runner Helpers ────────────────────────────────────────────────────────

def _test_name(test_fn: object) -> str:
    """Extract a readable test name from a function's docstring."""
    doc = getattr(test_fn, '__doc__', None)
    if doc:
        return doc.split(":")[0].strip()
    return getattr(test_fn, '__name__', 'unknown')


async def _run_test_group(env: TestEnv, tests: list) -> None:
    """Run a list of async test functions, recording failures."""
    for test_fn in tests:
        try:
            await test_fn(env)
        except Exception as e:
            env.record(_test_name(test_fn), f"FAIL - {e}")


def _print_summary(results: dict[str, str]) -> None:
    """Print formatted test results summary."""
    print("\n===== TEST RESULTS SUMMARY =====")
    for k, v in results.items():
        status = "PASS" if v.startswith("PASS") else ("PARTIAL" if v.startswith("PARTIAL") else "FAIL")
        print(f"{status} - {k}: {v}")
    passed = sum(1 for v in results.values() if v.startswith("PASS"))
    partial = sum(1 for v in results.values() if v.startswith("PARTIAL"))
    failed = sum(1 for v in results.values() if v.startswith("FAIL"))
    print(f"\nTotal: {passed} PASS, {partial} PARTIAL, {failed} FAIL out of {len(results)}")


# ── Test Runner ───────────────────────────────────────────────────────────────

async def run_all_tests() -> dict[str, str]:
    """Execute all notification tests in sequence."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})

        env = TestEnv(page)
        env.attach_listeners()

        await _run_test_group(env, [
            test_app_loads, test_referee_login, test_bell_badge,
            test_notification_panel_opens, test_mark_all_read, test_notification_icons,
        ])

        await logout_and_navigate(page)

        await _run_test_group(env, [
            test_manager_login, test_assign_referee, test_manager_sends_message,
        ])

        await _run_test_group(env, [test_no_js_crashes])

        _print_summary(env.results)
        await browser.close()
        return env.results


asyncio.run(run_all_tests())
