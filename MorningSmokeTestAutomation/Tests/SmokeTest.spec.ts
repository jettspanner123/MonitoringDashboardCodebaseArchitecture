import { test, expect, type Response } from '@playwright/test';
import SmokePageConfigurationService from "../Configurations/SmokePageConfiguration";
import ApplicationDateTimeHelper from "../Helpers/ApplicationDateTimeHelper";
import ApplicationDatabaseService from "../Services/DatabaseServices/ApplicationDatabaseService";
import TestRunIdHelper from "../Helpers/TestRunIdHelper";
import SmokeEnvironmentHelper from "../Helpers/SmokeEnvironmentHelper";
import SmokeCheckFailureClassifier from "../Helpers/SmokeCheckFailureClassifier";

const MAX_INDEXING_STALENESS_MINUTES = 30;

for (const pageConfig of SmokePageConfigurationService.current.getSmokePageConfiguration(
  SmokeEnvironmentHelper.current.resolveCurrentEnvironment()
)) {
  test(`Smoke: ${pageConfig.name}`, async ({ page }) => {
    // This suite intentionally has no per-test cap — several of these pages
    // are known to take a long, variable amount of time to load or produce
    // their results, and we'd rather wait for the real element than fail on
    // an arbitrary clock. Individual waits below use pageConfig.timeoutMs
    // (defaulting to 0 - Playwright's "no timeout" convention) so fast,
    // simple pages can still fail within a bounded time instead of hanging
    // forever on a genuinely dead environment.
    test.setTimeout(0);
    const testRunId = TestRunIdHelper.current.read();

    const openStartedAt = Date.now();
    let statusCode: number | null = null;

    // Open the page we're testing. Pages with no expectedResultSelector
    // (page-load-only checks, e.g. FCS) have nothing further to wait on, so
    // their PageLoadCheck row is written here, right away. Pages that do
    // have one defer writing their row until the content check below
    // finishes, so the row reflects the true final outcome rather than
    // just "the page opened".
    if (pageConfig.recordPageLoadCheck) {
      let pageOpenFailure: { message: string; technicalReason: string | null } | null = null;

      try {
        const response = await page.goto(pageConfig.url, { timeout: pageConfig.timeoutMs ?? 0 });
        statusCode = response?.status() ?? null;

        if (!(response?.ok() ?? true)) {
          pageOpenFailure = { message: `Page responded with HTTP ${statusCode}.`, technicalReason: null };
        }
      } catch (gotoError) {
        const technicalReason = gotoError instanceof Error ? gotoError.message : String(gotoError);
        pageOpenFailure = { message: 'Failed opening the page.', technicalReason };
      }

      if (pageOpenFailure) {
        await ApplicationDatabaseService.current.recordPageLoadCheck({
          testRunId,
          pageName: pageConfig.name,
          success: false,
          message: pageOpenFailure.message,
          technicalReason: pageOpenFailure.technicalReason,
          statusCode,
          durationMs: Date.now() - openStartedAt,
        });
        throw new Error(pageOpenFailure.message);
      }

      if (!pageConfig.expectedResultSelector) {
        await ApplicationDatabaseService.current.recordPageLoadCheck({
          testRunId,
          pageName: pageConfig.name,
          success: true,
          message: `Page loaded successfully${statusCode ? ` (HTTP ${statusCode}).` : '.'}`,
          technicalReason: null,
          statusCode,
          durationMs: Date.now() - openStartedAt,
        });
      }
    } else {
      await page.goto(pageConfig.url, { timeout: pageConfig.timeoutMs ?? 0 });
    }

    // If a button is configured, wait for it to show up and click it.
    if (pageConfig.buttonSelector) {
      const button = page.locator(pageConfig.buttonSelector);
      await button.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });
      await button.click();
    }

    // If a search box is configured, type the search term in and submit it.
    if (pageConfig.searchInputSelector && pageConfig.searchTerm) {
      const searchInput = page.locator(pageConfig.searchInputSelector);
      await searchInput.waitFor({ state: 'visible', timeout: pageConfig.timeoutMs ?? 0 });
      await searchInput.fill(pageConfig.searchTerm);
      if (pageConfig.searchButtonSelector) {
        const searchButton = page.locator(pageConfig.searchButtonSelector);
        await searchButton.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }
    }

    // Check that the page actually produced the expected outcome — either a
    // specific number of matching items, or one visible element (optionally
    // with a minimum number shown inside it). Pages with no
    // expectedResultSelector (page-load-only checks) skip this section
    // entirely - their PageLoadCheck row was already written above.
    let resultCount = 0;

    if (pageConfig.expectedResultSelector) {
      const resultLocator = page.locator(pageConfig.expectedResultSelector);

      try {
        if (pageConfig.expectedCount !== undefined) {
          await expect(resultLocator).toHaveCount(pageConfig.expectedCount, { timeout: pageConfig.timeoutMs ?? 0 });
          resultCount = pageConfig.expectedCount;

          // If configured, parse every state row of the queue-status table and
          // write them all to the shared QueueStatusCheck table.
          if (pageConfig.recordQueueStatusCheck && pageConfig.queueStatusTableSelector) {
            const rows = await page
              .locator(`${pageConfig.queueStatusTableSelector} tr`)
              .evaluateAll((trs) =>
                trs
                  // Skip the header row — it has <th>s, no <td>s.
                  .filter((tr) => tr.querySelector('td'))
                  .map((tr) => {
                    const cells = Array.from(tr.querySelectorAll('td'));
                    return {
                      state: cells[0]?.querySelector('a')?.textContent?.trim() ?? cells[0]?.textContent?.trim() ?? '',
                      lessThan10Min: cells[1]?.textContent?.trim() ?? '',
                      lessThan1Hour: cells[2]?.textContent?.trim() ?? '',
                      lessThan4Hours: cells[3]?.textContent?.trim() ?? '',
                      greaterThan4Hours: cells[4]?.textContent?.trim() ?? '',
                    };
                  })
              );

            await ApplicationDatabaseService.current.recordQueueStatusChecks(
              rows.map((row) => ({ testRunId, pageName: pageConfig.name, ...row }))
            );
          }
        } else {
          await resultLocator.waitFor({ state: 'visible', timeout: pageConfig.timeoutMs ?? 0 });

          if (pageConfig.minResultCount !== undefined) {
            await expect
              .poll(async () => Number((await resultLocator.textContent())?.trim() ?? '0'), {
                timeout: pageConfig.timeoutMs ?? 0,
              })
              .toBeGreaterThan(pageConfig.minResultCount);
          }

          resultCount = Number((await resultLocator.textContent())?.trim() ?? '0');
        }

        if (pageConfig.recordPageLoadCheck) {
          await ApplicationDatabaseService.current.recordPageLoadCheck({
            testRunId,
            pageName: pageConfig.name,
            success: true,
            message: `Page loaded successfully${statusCode ? ` (HTTP ${statusCode}).` : '.'}`,
            technicalReason: null,
            statusCode,
            durationMs: Date.now() - openStartedAt,
          });
        }
      } catch (contentError) {
        if (pageConfig.recordPageLoadCheck) {
          const { message, technicalReason } = SmokeCheckFailureClassifier.current.classify(contentError, pageConfig.timeoutMs);
          await ApplicationDatabaseService.current.recordPageLoadCheck({
            testRunId,
            pageName: pageConfig.name,
            success: false,
            message,
            technicalReason,
            statusCode,
            durationMs: Date.now() - openStartedAt,
          });
        }
        throw contentError;
      }
    }

    // If an info icon is configured, hover it, read its tooltip out loud
    // (in the console), and flag whether the indexing time it reports is
    // recent or stale — just informational, doesn't fail the test.
    if (pageConfig.hoverInfoSelector && pageConfig.hoverTooltipSelector) {
      const infoIcon = page.locator(pageConfig.hoverInfoSelector).first();
      await infoIcon.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });
      await infoIcon.hover();

      const tooltip = page.locator(pageConfig.hoverTooltipSelector);
      await tooltip.waitFor({ state: 'visible', timeout: pageConfig.timeoutMs ?? 0 });
      const tooltipText = (await tooltip.textContent())?.trim() ?? '';
      console.log(`[${pageConfig.name}] Info tooltip contents:`, tooltipText);

      const indexingTime = ApplicationDateTimeHelper.current.parseTimeOfDay(tooltipText);
      if (indexingTime) {
        const machineTime = new Date();
        const diffMinutes = ApplicationDateTimeHelper.current.minutesOfDayDiff(indexingTime, machineTime);
        const isFresh = diffMinutes <= MAX_INDEXING_STALENESS_MINUTES;
        const formattedIndexingTime = indexingTime.toLocaleTimeString();
        const freshnessMessage = isFresh
          ? `Indexing time ${formattedIndexingTime} is fresh (${diffMinutes.toFixed(1)}m from now, threshold ${MAX_INDEXING_STALENESS_MINUTES}m).`
          : `Indexing time ${formattedIndexingTime} is stale (${diffMinutes.toFixed(1)}m from now, threshold ${MAX_INDEXING_STALENESS_MINUTES}m).`;

        console.log(`${isFresh ? '✅' : '❌'} [${pageConfig.name}] ${freshnessMessage}`);

        if (pageConfig.recordIndexingFreshnessCheck) {
          await ApplicationDatabaseService.current.recordIndexingFreshnessCheck({
            testRunId,
            resultCount,
            indexTime: indexingTime,
            machineTime,
            timeDifference: diffMinutes,
            isFresh,
            message: freshnessMessage,
          });
        }
      }
    }

    // If configured, click the button that opens a menu once results are in
    // (e.g. the compass nav icon).
    if (pageConfig.postResultsClickSelector) {
      const postResultsButton = page.locator(pageConfig.postResultsClickSelector);
      await postResultsButton.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });
      await postResultsButton.click();
    }

    // Go through each menu item we're told to check, one at a time. Each one
    // opens in a new tab ("popup") — we treat that open as its own
    // page-load-equivalent check: timed, and recorded to the same shared
    // PageLoadCheck table as the main pages (using the popup's own name),
    // so it shows up as its own "Page Load" card on the dashboard.
    for (const popupCheck of pageConfig.popupChecks ?? []) {
      const popupOpenStartedAt = Date.now();

      // The popup's own initial-navigation response can already be loading
      // by the time the 'page' event fires (Playwright's own docs call this
      // out explicitly), so a listener attached on the popup itself *after*
      // we get the reference can miss it. Attaching on the context instead,
      // before the click, means nothing is missed - we just have to pick
      // the right response (the popup's own) out of whatever came in.
      const navigationResponses: Response[] = [];
      const captureNavigationResponse = (response: Response): void => {
        try {
          if (response.request().isNavigationRequest() && !response.frame().parentFrame()) {
            navigationResponses.push(response);
          }
        } catch {
          // response.frame() can throw "Frame for this navigation request
          // is not available" when the response arrives before Playwright
          // has finished resolving its Frame object (a known race on
          // iframe-heavy pages) - just skip this response rather than
          // crash the whole popup check.
        }
      };
      page.context().on('response', captureNavigationResponse);

      let popup;
      let popupOpenFailure: { message: string; technicalReason: string } | null = null;

      try {
        // If this item needs the menu's own search box filled in first,
        // reveal it (if needed) and type the filter term into it.
        if (popupCheck.compassSearchInputSelector && popupCheck.compassSearchTerm) {
          if (popupCheck.compassSearchIconSelector) {
            const searchIcon = page.locator(popupCheck.compassSearchIconSelector);
            await searchIcon.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });
            await searchIcon.click();
          }

          const compassSearchInput = page.locator(popupCheck.compassSearchInputSelector);
          await compassSearchInput.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });
          await compassSearchInput.fill(popupCheck.compassSearchTerm, { force: true });
        }

        const menuItem = page.locator(popupCheck.menuItemSelector).first();
        await menuItem.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });

        [popup] = await Promise.all([
          page.context().waitForEvent('page', { timeout: pageConfig.timeoutMs ?? 0 }),
          menuItem.click(),
        ]);
        await popup.waitForLoadState('load', { timeout: pageConfig.timeoutMs ?? 0 });
      } catch (openError) {
        const technicalReason = openError instanceof Error ? openError.message : String(openError);
        popupOpenFailure = { message: 'Failed opening the page.', technicalReason };
      } finally {
        page.context().off('response', captureNavigationResponse);
      }

      if (popupOpenFailure) {
        await ApplicationDatabaseService.current.recordPageLoadCheck({
          testRunId,
          pageName: popupCheck.name,
          success: false,
          message: popupOpenFailure.message,
          technicalReason: popupOpenFailure.technicalReason,
          statusCode: null,
          durationMs: Date.now() - popupOpenStartedAt,
        });
        throw new Error(popupOpenFailure.message);
      }

      if (!popup) {
        // Unreachable - popupOpenFailure would have thrown above if popup
        // assignment failed. Narrows the type for the block below.
        throw new Error(`Popup never opened for "${popupCheck.name}".`);
      }

      // Confirm the new tab actually shows the expected content, or at
      // least that it navigated somewhere real. A popup whose backing
      // service isn't started commonly renders a Tomcat-style "HTTP Status
      // 404 - Not Found" page instead of ever producing the expected
      // element, which would otherwise hang this wait until the timeout
      // with a confusing generic failure - detect it explicitly up front so
      // it fails fast with a clear reason instead.
      const notFoundHeading = popup.locator('h1', { hasText: /HTTP Status 404/i }).first();

      try {
        if (popupCheck.expectedElementSelector) {
          await Promise.race([
            popup.locator(popupCheck.expectedElementSelector).first().waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 }),
            notFoundHeading.waitFor({ state: 'visible', timeout: pageConfig.timeoutMs ?? 0 }).then(() => {
              throw new Error(`${SmokeCheckFailureClassifier.NOT_FOUND_ERROR_PREFIX}: Popup rendered an HTTP Status 404 error page.`);
            }),
          ]);
        } else {
          if (await notFoundHeading.isVisible().catch(() => false)) {
            throw new Error(`${SmokeCheckFailureClassifier.NOT_FOUND_ERROR_PREFIX}: Popup rendered an HTTP Status 404 error page.`);
          }
          expect(popup.url()).not.toBe('about:blank');
        }

        const popupResponse = navigationResponses.find((response) => response.frame() === popup!.mainFrame()) ?? null;
        const statusCode = popupResponse?.status() ?? null;
        await ApplicationDatabaseService.current.recordPageLoadCheck({
          testRunId,
          pageName: popupCheck.name,
          success: true,
          message: `Popup opened successfully${statusCode ? ` (HTTP ${statusCode}).` : '.'}`,
          technicalReason: null,
          statusCode,
          durationMs: Date.now() - popupOpenStartedAt,
        });

        // Close the new tab if we're told we're done with it.
        if (popupCheck.closePopupAfterCheck) {
          await popup.close();
        }
      } catch (contentError) {
        const { message, technicalReason } = SmokeCheckFailureClassifier.current.classify(contentError, pageConfig.timeoutMs);
        await ApplicationDatabaseService.current.recordPageLoadCheck({
          testRunId,
          pageName: popupCheck.name,
          success: false,
          message,
          technicalReason,
          statusCode: null,
          durationMs: Date.now() - popupOpenStartedAt,
        });
        throw contentError;
      }
    }
  });
}
