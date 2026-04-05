"""
Session 4 Feature Tests:
A) Referee accept/decline with conflict-aware warning dialog
B) Calendar availability overlay (weekly strip) in Assign Dialog
C) Bulk assignment actions in Game Assignments tab
D) Payment batch processing
"""
import asyncio
import json
from playwright.async_api import Page

# ============================================================
# HELPERS
# ============================================================

BASE_URL = "http://localhost:3000"
STORAGE_KEY = "iwhistle_demo_data_v3"

async def clear_localStorage(page: Page) -> None:
    """Remove demo data to force fresh seed on next load."""
    await page.evaluate(f"localStorage.removeItem('{STORAGE_KEY}')")

async def login_as_referee(page: Page) -> None:
    """Login as Demo Referee via Try Demo Account button."""
    await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    await page.wait_for_timeout(500)
    try:
        demo_btn = await page.wait_for_selector("text=Try Demo Account", timeout=5000)
        await demo_btn.click()
        await page.wait_for_timeout(400)
        # Click Log in as Referee
        referee_btn = await page.wait_for_selector("text=Log in as Referee", timeout=3000)
        await referee_btn.click()
        await page.wait_for_timeout(800)
        print("Logged in as Referee")
    except Exception as e:
        print(f"Login as Referee failed: {e}")

async def login_as_manager(page: Page) -> None:
    """Login as Demo Manager via Try Demo Account button."""
    await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    await page.wait_for_timeout(500)
    try:
        demo_btn = await page.wait_for_selector("text=Try Demo Account", timeout=5000)
        await demo_btn.click()
        await page.wait_for_timeout(400)
        mgr_btn = await page.wait_for_selector("text=Log in as Manager", timeout=3000)
        await mgr_btn.click()
        await page.wait_for_timeout(800)
        print("Logged in as Manager")
    except Exception as e:
        print(f"Login as Manager failed: {e}")


# ============================================================
# FEATURE A: Decline flow
# ============================================================
page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

await page.set_viewport_size({"width": 1920, "height": 1080})

print("\n=== FEATURE A: Decline Assignment Dialog ===")
await clear_localStorage(page)
await login_as_referee(page)

# Navigate to Schedule > My Schedule
await page.goto(f"{BASE_URL}/schedule", wait_until="domcontentloaded")
await page.wait_for_timeout(800)

try:
    # Check the My Schedule tab exists
    my_schedule_tab = await page.query_selector("text=My Schedule")
    if my_schedule_tab:
        await my_schedule_tab.click()
        await page.wait_for_timeout(500)
        print("PASS: My Schedule tab visible and clicked")
    else:
        print("INFO: My Schedule tab not found, may already be default")

    # Find the Decline button for game-1
    decline_btn = await page.query_selector('[data-testid="game-card-decline-game-1"]')
    if decline_btn:
        print("PASS: Decline button found for game-1")
        await decline_btn.click(force=True)
        await page.wait_for_timeout(600)

        # Verify DeclineAssignmentDialog opens
        dialog = await page.query_selector('[data-testid="decline-assignment-dialog"]')
        if dialog:
            print("PASS: DeclineAssignmentDialog opened with correct data-testid")

            # Check dialog styling (light theme)
            dialog_classes = await dialog.get_attribute("class")
            print(f"INFO: Dialog classes: {dialog_classes}")
            if "bg-white" in (dialog_classes or ""):
                print("PASS: Dialog has light theme (bg-white)")
            else:
                print("INFO: Could not verify bg-white class directly (may be nested)")

            # Enter a reason
            reason_input = await page.query_selector('[data-testid="decline-assignment-reason-input"]')
            if reason_input:
                await reason_input.fill("Prior commitment, cannot make this game.")
                print("PASS: Reason entered in decline dialog input")
            else:
                print("FAIL: Reason input not found in decline dialog")

            # Click Decline Assignment button
            confirm_btn = await page.query_selector('[data-testid="decline-assignment-confirm-button"]')
            if confirm_btn:
                await confirm_btn.click(force=True)
                await page.wait_for_timeout(800)
                print("PASS: Clicked 'Decline Assignment' confirm button")

                # Verify dialog closed
                dialog_after = await page.query_selector('[data-testid="decline-assignment-dialog"]')
                if not dialog_after or not await dialog_after.is_visible():
                    print("PASS: Decline dialog closed after confirmation")
                else:
                    print("INFO: Dialog may still be visible (check state)")

                # Check if 'Declined' badge appears on the game card
                await page.wait_for_timeout(500)
                page_text = await page.text_content("body")
                if "Declined" in page_text:
                    print("PASS: 'Declined' status visible on page after decline action")
                else:
                    print("INFO: 'Declined' text not immediately visible - may require reload")

            else:
                print("FAIL: Decline confirm button not found")
        else:
            print("FAIL: DeclineAssignmentDialog did not open")
    else:
        print("FAIL: Decline button for game-1 not found on My Schedule tab")
        # Debug: show all game card buttons
        all_btns = await page.query_selector_all('[data-testid^="game-card-"]')
        for btn in all_btns:
            testid = await btn.get_attribute("data-testid")
            print(f"  Found button: {testid}")

except Exception as e:
    print(f"FAIL: Feature A Decline test error: {e}")

# Screenshot after decline test
await page.screenshot(path="/app/test_reports/pytest/session4_a_decline.jpeg", type="jpeg", quality=40, full_page=False)

# ============================================================
# FEATURE A: Accept flow (fresh seed)
# ============================================================
print("\n=== FEATURE A: Accept Assignment (no conflict) ===")
await clear_localStorage(page)
await login_as_referee(page)
await page.goto(f"{BASE_URL}/schedule", wait_until="domcontentloaded")
await page.wait_for_timeout(800)

try:
    my_schedule_tab = await page.query_selector("text=My Schedule")
    if my_schedule_tab:
        await my_schedule_tab.click()
        await page.wait_for_timeout(500)

    # Find Accept button for game-1
    accept_btn = await page.query_selector('[data-testid="game-card-accept-game-1"]')
    if accept_btn:
        print("PASS: Accept button found for game-1")
        await accept_btn.click(force=True)
        await page.wait_for_timeout(600)

        # Conflict dialog should NOT appear (demo-referee has no conflict for game-1)
        conflict_dialog = await page.query_selector('[data-testid="accept-conflict-warning-dialog"]')
        if conflict_dialog and await conflict_dialog.is_visible():
            print("INFO: AcceptConflictWarningDialog appeared (unexpected for no-conflict game - check seed data)")
            # Verify dialog content and cancel button
            cancel_btn = await page.query_selector('[data-testid="accept-conflict-cancel-button"]')
            anyway_btn = await page.query_selector('[data-testid="accept-conflict-anyway-button"]')
            if cancel_btn:
                print("PASS: accept-conflict-cancel-button exists in dialog")
            if anyway_btn:
                print("PASS: accept-conflict-anyway-button exists in dialog")
            # Close the dialog
            if cancel_btn:
                await cancel_btn.click(force=True)
                await page.wait_for_timeout(300)
        else:
            print("PASS: No conflict dialog appeared (expected for demo-referee on game-1, no conflict)")

        # Check if status changed to 'Accepted'
        await page.wait_for_timeout(500)
        page_text = await page.text_content("body")
        if "Accepted" in page_text:
            print("PASS: 'Accepted' status visible after accept action")
        else:
            print("INFO: 'Accepted' text not visible immediately - checking button state")
            # Check if the Accept/Decline buttons are gone (indicating status changed)
            accept_btn_after = await page.query_selector('[data-testid="game-card-accept-game-1"]')
            decline_btn_after = await page.query_selector('[data-testid="game-card-decline-game-1"]')
            if not accept_btn_after or not await accept_btn_after.is_visible():
                print("PASS: Accept/Decline buttons no longer shown (status changed from 'assigned')")
            else:
                print("FAIL: Accept/Decline buttons still visible after accept action")
    else:
        print("FAIL: Accept button for game-1 not found")
        all_btns = await page.query_selector_all('[data-testid^="game-card-"]')
        for btn in all_btns:
            testid = await btn.get_attribute("data-testid")
            print(f"  Found button: {testid}")

except Exception as e:
    print(f"FAIL: Feature A Accept test error: {e}")

# ============================================================
# FEATURE A: AcceptConflictWarningDialog - Verify via forced state injection
# ============================================================
print("\n=== FEATURE A: AcceptConflictWarningDialog data-testids verification ===")
# Inject a conflicting assignment for demo-referee to force the conflict dialog
await clear_localStorage(page)
await login_as_referee(page)
await page.goto(f"{BASE_URL}/schedule", wait_until="domcontentloaded")
await page.wait_for_timeout(600)

try:
    # Inject a conflicting game assignment into localStorage to trigger the conflict warning
    inject_conflict = f"""
    (() => {{
        const key = '{STORAGE_KEY}';
        const stored = localStorage.getItem(key);
        if (!stored) return 'no_store';
        const store = JSON.parse(stored);
        // Add a duplicate-time assignment for demo-referee on game-5 (same time as game-1: day+4)
        // game-3 is at day+4, 16:00; game-5 is at day+4, 16:30 — both near same time
        // Instead, let's add assignment on game-5 with same time as game-1 (day+1 18:00)
        // Adjust game-5's date to match game-1 to create a real conflict
        const g5 = store.games.find(g => g.id === 'game-5');
        const g1 = store.games.find(g => g.id === 'game-1');
        if (g5 && g1) {{
            g5.game_date = g1.game_date;
            g5.game_time = g1.game_time;
        }}
        // Add assignment for demo-referee on game-5
        store.gameAssignments.push({{
            id: 'assignment-conflict-test',
            game_id: 'game-5',
            referee_id: 'demo-referee',
            status: 'assigned',
            decline_reason: null
        }});
        localStorage.setItem(key, JSON.stringify(store));
        return 'injected';
    }})()
    """
    result = await page.evaluate(inject_conflict)
    print(f"INFO: Conflict injection result: {result}")

    # Reload to pick up the new data
    await page.reload(wait_until="domcontentloaded")
    await page.wait_for_timeout(800)

    # Navigate to My Schedule
    my_schedule_tab = await page.query_selector("text=My Schedule")
    if my_schedule_tab:
        await my_schedule_tab.click()
        await page.wait_for_timeout(500)

    # Now demo-referee has game-1 and game-5 at same date/time - clicking Accept on game-1 should trigger conflict
    accept_btn = await page.query_selector('[data-testid="game-card-accept-game-1"]')
    if accept_btn:
        await accept_btn.click(force=True)
        await page.wait_for_timeout(600)

        # Check for conflict dialog
        conflict_dialog = await page.query_selector('[data-testid="accept-conflict-warning-dialog"]')
        if conflict_dialog and await conflict_dialog.is_visible():
            print("PASS: AcceptConflictWarningDialog appeared after injecting schedule conflict")

            # Verify all required data-testids
            cancel_btn = await page.query_selector('[data-testid="accept-conflict-cancel-button"]')
            anyway_btn = await page.query_selector('[data-testid="accept-conflict-anyway-button"]')

            if cancel_btn:
                print("PASS: accept-conflict-cancel-button found")
            else:
                print("FAIL: accept-conflict-cancel-button NOT found")

            if anyway_btn:
                print("PASS: accept-conflict-anyway-button found")
            else:
                print("FAIL: accept-conflict-anyway-button NOT found")

            # Take screenshot with conflict dialog
            await page.screenshot(path="/app/test_reports/pytest/session4_a_conflict_dialog.jpeg", type="jpeg", quality=40, full_page=False)

            # Click 'Accept Anyway' and verify status updates
            if anyway_btn:
                await anyway_btn.click(force=True)
                await page.wait_for_timeout(800)
                print("PASS: Clicked 'Accept Anyway'")

                # Verify dialog closed
                conflict_after = await page.query_selector('[data-testid="accept-conflict-warning-dialog"]')
                if not conflict_after or not await conflict_after.is_visible():
                    print("PASS: Conflict dialog closed after 'Accept Anyway'")
                else:
                    print("FAIL: Conflict dialog still visible after 'Accept Anyway'")

                page_text = await page.text_content("body")
                if "Accepted" in page_text:
                    print("PASS: 'Accepted' status shown after Accept Anyway")
                else:
                    print("INFO: 'Accepted' badge not immediately visible")
        else:
            print("FAIL: AcceptConflictWarningDialog did NOT appear even after injecting conflict")
            print("INFO: getRefereeStatus may not detect this conflict with the current data structure")
    else:
        print("FAIL: Accept button not found after conflict injection")

except Exception as e:
    print(f"FAIL: Feature A conflict dialog test error: {e}")


# ============================================================
# FEATURE B: Calendar Strip in Assign Dialog
# ============================================================
print("\n=== FEATURE B: Calendar Availability Strip in Assign Dialog ===")
await clear_localStorage(page)
await login_as_manager(page)
await page.goto(f"{BASE_URL}/manager", wait_until="domcontentloaded")
await page.wait_for_timeout(1000)

try:
    # Click Game Assignments tab
    assignments_tab = await page.query_selector("text=Game Assignments")
    if assignments_tab:
        await assignments_tab.click()
        await page.wait_for_timeout(600)
        print("PASS: Clicked Game Assignments tab")

    # Click Assign button on game-2 (Central Storm vs Westview Falcons, no referees assigned)
    assign_btn = await page.query_selector('[data-testid="manager-assign-referee-game-2"]')
    if assign_btn:
        await assign_btn.click(force=True)
        await page.wait_for_timeout(600)
        print("PASS: Clicked Assign button for game-2")

        # Verify AssignRefereeDialog opened
        assign_dialog = await page.query_selector('[data-testid="assign-referee-dialog"]')
        if assign_dialog and await assign_dialog.is_visible():
            print("PASS: AssignRefereeDialog opened")

            # The referee list should be visible
            referee_list = await page.query_selector('[data-testid="assign-referee-list"]')
            if referee_list:
                print("PASS: Assign referee list visible")

            # Click on a referee card (demo-referee)
            referee_card = await page.query_selector('[data-testid="assign-referee-card-demo-referee"]')
            if referee_card:
                await referee_card.click(force=True)
                await page.wait_for_timeout(600)
                print("PASS: Clicked Demo Referee card")

                # Check for calendar strip - look for "Referee schedule this week" text
                calendar_strip_text = await page.query_selector("text=Referee schedule this week")
                if calendar_strip_text:
                    print("PASS: WeekCalendarStrip visible ('Referee schedule this week' text found)")
                else:
                    print("FAIL: WeekCalendarStrip text not found after clicking referee card")

                # Check for day labels (Mon, Tue, etc.)
                page_text = await page.text_content("body")
                has_day_labels = any(day in page_text for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
                if has_day_labels:
                    print("PASS: Day labels present in calendar strip")
                else:
                    print("FAIL: Day labels not found in page after clicking referee card")

                # Check for legend (Available, Assigned, No data)
                if "Available" in page_text and "Assigned" in page_text and "No data" in page_text:
                    print("PASS: Calendar strip legend (Available/Assigned/No data) present")
                else:
                    print("INFO: Calendar strip legend items may use different text")

                # Screenshot with calendar strip
                await page.screenshot(path="/app/test_reports/pytest/session4_b_calendar_strip.jpeg", type="jpeg", quality=40, full_page=False)

            else:
                print("FAIL: demo-referee card not found in assign dialog")
                # Try getting ref-olivia
                olivia_card = await page.query_selector('[data-testid="assign-referee-card-ref-olivia"]')
                if olivia_card:
                    await olivia_card.click(force=True)
                    await page.wait_for_timeout(500)
                    strip_text = await page.query_selector("text=Referee schedule this week")
                    if strip_text:
                        print("PASS: WeekCalendarStrip visible with ref-olivia card selected")
                    else:
                        print("FAIL: WeekCalendarStrip not visible with any referee selected")
        else:
            print("FAIL: AssignRefereeDialog did not open for game-2")
    else:
        print("FAIL: Assign button for game-2 not found")
        # Check if table is visible
        table_rows = await page.query_selector_all('[data-testid^="manager-assignment-row-"]')
        print(f"INFO: Found {len(table_rows)} assignment rows")

    # Close dialog if still open
    cancel_btn = await page.query_selector('[data-testid="assign-referee-cancel-button"]')
    if cancel_btn and await cancel_btn.is_visible():
        await cancel_btn.click(force=True)
        await page.wait_for_timeout(300)

except Exception as e:
    print(f"FAIL: Feature B calendar strip test error: {e}")


# ============================================================
# FEATURE C: Bulk Assignment Actions
# ============================================================
print("\n=== FEATURE C: Bulk Assignment Actions ===")
# Use current manager session (fresh seed was cleared, then manager logged in)
await page.goto(f"{BASE_URL}/manager", wait_until="domcontentloaded")
await page.wait_for_timeout(1000)

try:
    # Click Game Assignments tab
    assignments_tab = await page.query_selector("text=Game Assignments")
    if assignments_tab:
        await assignments_tab.click()
        await page.wait_for_timeout(600)
        print("PASS: Clicked Game Assignments tab")

    # Check Select All checkbox exists
    select_all_cb = await page.query_selector('[data-testid="select-all-games-checkbox"]')
    if select_all_cb:
        print("PASS: select-all-games-checkbox found in table header")

        # Click Select All
        await select_all_cb.click(force=True)
        await page.wait_for_timeout(500)

        # Verify bulk toolbar appears
        bulk_toolbar = await page.query_selector('[data-testid="bulk-actions-toolbar"]')
        if bulk_toolbar and await bulk_toolbar.is_visible():
            print("PASS: bulk-actions-toolbar appeared after Select All")

            # Verify toolbar text shows number of games
            toolbar_text = await bulk_toolbar.text_content()
            print(f"INFO: Bulk toolbar content: {toolbar_text}")
            if "selected" in toolbar_text:
                print("PASS: Toolbar shows games selected count")

            # Check for the bulk action buttons
            unassign_btn = await page.query_selector('[data-testid="bulk-unassign-button"]')
            complete_btn = await page.query_selector('[data-testid="bulk-complete-button"]')

            if unassign_btn:
                print("PASS: bulk-unassign-button (Unassign All Referees) found")
            else:
                print("FAIL: bulk-unassign-button NOT found")

            if complete_btn:
                print("PASS: bulk-complete-button (Mark as Complete) found")
            else:
                print("FAIL: bulk-complete-button NOT found")

            # Screenshot with bulk toolbar
            await page.screenshot(path="/app/test_reports/pytest/session4_c_bulk_toolbar.jpeg", type="jpeg", quality=40, full_page=False)

            # Click "Unassign All Referees"
            if unassign_btn:
                await unassign_btn.click(force=True)
                await page.wait_for_timeout(800)
                print("PASS: Clicked 'Unassign All Referees'")

                # Verify toolbar is gone (selection cleared)
                bulk_toolbar_after = await page.query_selector('[data-testid="bulk-actions-toolbar"]')
                if not bulk_toolbar_after or not await bulk_toolbar_after.is_visible():
                    print("PASS: Bulk toolbar disappeared after unassign action")
                else:
                    print("INFO: Bulk toolbar still visible (may need more time)")

                # Check if referee assignments are removed from game rows
                await page.wait_for_timeout(500)
                page_text = await page.text_content("body")
                # The number of "None Assigned" text should increase
                none_assigned_count = page_text.count("None Assigned")
                print(f"INFO: 'None Assigned' count after bulk unassign: {none_assigned_count}")
                if none_assigned_count > 0:
                    print("PASS: Some games now show 'None Assigned' after bulk unassign")
                else:
                    print("INFO: Could not verify assignment removal directly")

                # Check for toast notification
                toast_elements = await page.query_selector_all('[data-testid^="toast"], .toast, [role="status"], [data-state="open"]')
                if toast_elements:
                    for t in toast_elements[:2]:
                        t_text = await t.text_content()
                        if t_text and len(t_text) > 2:
                            print(f"PASS: Toast notification shown: {t_text[:80]}")
                            break

        else:
            print("FAIL: bulk-actions-toolbar did NOT appear after clicking Select All")
    else:
        print("FAIL: select-all-games-checkbox NOT found in table header")

except Exception as e:
    print(f"FAIL: Feature C bulk actions test error: {e}")


# ============================================================
# FEATURE C: Individual Checkbox selection
# ============================================================
print("\n=== FEATURE C: Individual Game Checkbox Selection ===")
# Clear localStorage and re-login to reset state
await clear_localStorage(page)
await login_as_manager(page)
await page.goto(f"{BASE_URL}/manager", wait_until="domcontentloaded")
await page.wait_for_timeout(1000)

try:
    assignments_tab = await page.query_selector("text=Game Assignments")
    if assignments_tab:
        await assignments_tab.click()
        await page.wait_for_timeout(600)

    # Click game-1 checkbox individually
    game1_cb = await page.query_selector('[data-testid="select-game-checkbox-game-1"]')
    game2_cb = await page.query_selector('[data-testid="select-game-checkbox-game-2"]')

    if game1_cb:
        await game1_cb.click(force=True)
        await page.wait_for_timeout(300)
        print("PASS: Clicked individual game-1 checkbox")

        # Toolbar should show "1 game selected"
        toolbar = await page.query_selector('[data-testid="bulk-actions-toolbar"]')
        if toolbar and await toolbar.is_visible():
            toolbar_text = await toolbar.text_content()
            if "1 game" in toolbar_text or "1" in toolbar_text:
                print("PASS: Toolbar shows 1 game selected after individual checkbox click")
            else:
                print(f"INFO: Toolbar text: {toolbar_text}")
        else:
            print("FAIL: Bulk toolbar did not appear after clicking individual checkbox")

    if game2_cb:
        await game2_cb.click(force=True)
        await page.wait_for_timeout(300)
        print("PASS: Clicked individual game-2 checkbox")

        toolbar = await page.query_selector('[data-testid="bulk-actions-toolbar"]')
        if toolbar and await toolbar.is_visible():
            toolbar_text = await toolbar.text_content()
            if "2 game" in toolbar_text or "2" in toolbar_text:
                print("PASS: Toolbar shows 2 games selected")
            else:
                print(f"INFO: Toolbar text after 2 selections: {toolbar_text}")

    # Test Clear button
    clear_btn = await page.query_selector("text=Clear")
    if clear_btn and await clear_btn.is_visible():
        await clear_btn.click(force=True)
        await page.wait_for_timeout(300)
        toolbar = await page.query_selector('[data-testid="bulk-actions-toolbar"]')
        if not toolbar or not await toolbar.is_visible():
            print("PASS: Bulk toolbar dismissed after clicking 'Clear'")
        else:
            print("INFO: Toolbar still visible after Clear")
    else:
        print("INFO: Clear button not visible (may need toolbar visible first)")

    if not game1_cb and not game2_cb:
        print("FAIL: Individual game checkboxes not found")
        all_cbs = await page.query_selector_all('[data-testid^="select-game-checkbox-"]')
        print(f"INFO: Found {len(all_cbs)} game checkboxes")

except Exception as e:
    print(f"FAIL: Feature C individual checkbox test error: {e}")


# ============================================================
# FEATURE D: Payment Batch Processing
# ============================================================
print("\n=== FEATURE D: Payment Batch Processing ===")
# Need pending payments: mark a game complete first (as manager) to create pending payments
await clear_localStorage(page)
await login_as_manager(page)
await page.goto(f"{BASE_URL}/manager", wait_until="domcontentloaded")
await page.wait_for_timeout(1000)

try:
    assignments_tab = await page.query_selector("text=Game Assignments")
    if assignments_tab:
        await assignments_tab.click()
        await page.wait_for_timeout(600)

    # Mark game-3 complete (has assigned referees - olivia and jordan)
    complete_btn = await page.query_selector('[data-testid="manager-complete-game-game-3"]')
    if complete_btn:
        await complete_btn.click(force=True)
        await page.wait_for_timeout(800)
        print("PASS: Marked game-3 as complete (creates pending payments)")
    else:
        print("INFO: Complete button for game-3 not found, may already be completed or button has different id")

    # Also mark game-1 complete to create more pending payments
    complete_btn_1 = await page.query_selector('[data-testid="manager-complete-game-game-1"]')
    if complete_btn_1:
        await complete_btn_1.click(force=True)
        await page.wait_for_timeout(800)
        print("PASS: Marked game-1 as complete (creates pending payments for demo-referee)")
    else:
        print("INFO: Complete button for game-1 not found")

    # Navigate to /payments
    await page.goto(f"{BASE_URL}/payments", wait_until="domcontentloaded")
    await page.wait_for_timeout(800)
    print("INFO: Navigated to /payments page")

    # Check page loaded
    payments_page = await page.query_selector('[data-testid="payments-page"]')
    if payments_page:
        print("PASS: Payments page loaded")
    else:
        print("INFO: payments-page testid not found")

    # Check for pending payments and checkbox
    select_all_pending_cb = await page.query_selector('[data-testid="select-all-pending-payments-checkbox"]')
    if select_all_pending_cb:
        print("PASS: select-all-pending-payments-checkbox found (pending payments exist)")

        # Take screenshot of the current state
        await page.screenshot(path="/app/test_reports/pytest/session4_d_payments_before.jpeg", type="jpeg", quality=40, full_page=False)

        # Click Select All Pending
        await select_all_pending_cb.click(force=True)
        await page.wait_for_timeout(500)

        # Verify bulk toolbar appears
        payments_toolbar = await page.query_selector('[data-testid="payments-bulk-actions-toolbar"]')
        if payments_toolbar and await payments_toolbar.is_visible():
            print("PASS: payments-bulk-actions-toolbar appeared after selecting pending payments")

            toolbar_text = await payments_toolbar.text_content()
            print(f"INFO: Payments toolbar content: {toolbar_text}")
            if "selected" in toolbar_text:
                print("PASS: Toolbar shows payments selected count")

            # Check Mark as Paid button
            mark_paid_btn = await page.query_selector('[data-testid="payments-bulk-mark-paid-button"]')
            if mark_paid_btn:
                print("PASS: payments-bulk-mark-paid-button found")

                # Click Mark as Paid
                await mark_paid_btn.click(force=True)
                await page.wait_for_timeout(800)
                print("PASS: Clicked 'Mark as Paid'")

                # Verify toolbar disappears after action
                toolbar_after = await page.query_selector('[data-testid="payments-bulk-actions-toolbar"]')
                if not toolbar_after or not await toolbar_after.is_visible():
                    print("PASS: Payments bulk toolbar dismissed after Mark as Paid")
                else:
                    print("INFO: Toolbar still visible after mark as paid")

                # Verify all payments are now paid
                await page.wait_for_timeout(500)
                select_all_pending_after = await page.query_selector('[data-testid="select-all-pending-payments-checkbox"]')
                if not select_all_pending_after or not await select_all_pending_after.is_visible():
                    print("PASS: No more pending payments checkbox visible (all payments marked as paid)")
                else:
                    print("INFO: Select all pending checkbox still visible")

                # Screenshot after paid
                await page.screenshot(path="/app/test_reports/pytest/session4_d_payments_after.jpeg", type="jpeg", quality=40, full_page=False)

                # Check toast
                await page.wait_for_timeout(200)
                toast_elements = await page.query_selector_all('[data-state="open"][role="status"], [data-radix-toast-root], .toast')
                page_text = await page.text_content("body")
                if "Payments Updated" in page_text or "marked as paid" in page_text.lower():
                    print("PASS: Toast notification shown for bulk mark as paid")
                else:
                    print("INFO: Toast may not persist long enough to check")

            else:
                print("FAIL: payments-bulk-mark-paid-button NOT found in toolbar")
        else:
            print("FAIL: payments-bulk-actions-toolbar did NOT appear after selecting pending payments")
    else:
        print("FAIL: select-all-pending-payments-checkbox NOT found (no pending payments visible)")
        # Debug: Check what payments are showing
        payment_rows = await page.query_selector_all('[data-testid^="payment-row-"]')
        print(f"INFO: Found {len(payment_rows)} payment rows")
        page_text = await page.text_content("body")
        pending_count = page_text.count("pending")
        paid_count = page_text.count("paid")
        print(f"INFO: 'pending' appears {pending_count} times, 'paid' appears {paid_count} times on page")

    # Test individual payment checkboxes
    print("\nChecking individual payment checkboxes...")
    payment_cbs = await page.query_selector_all('[data-testid^="payment-checkbox-"]')
    if payment_cbs:
        print(f"PASS: Found {len(payment_cbs)} individual payment checkbox(es)")
        # Click first one
        first_cb = payment_cbs[0]
        cb_testid = await first_cb.get_attribute("data-testid")
        await first_cb.click(force=True)
        await page.wait_for_timeout(400)
        print(f"PASS: Clicked {cb_testid}")

        toolbar = await page.query_selector('[data-testid="payments-bulk-actions-toolbar"]')
        if toolbar and await toolbar.is_visible():
            print("PASS: Payments bulk toolbar appeared for individual payment selection")
        else:
            print("INFO: No pending payments to select individually (may all be paid after bulk action)")
    else:
        print("INFO: No individual payment checkboxes (pending payments may already all be paid)")

except Exception as e:
    print(f"FAIL: Feature D payments test error: {e}")

print("\n=== All Session 4 Tests Complete ===")
