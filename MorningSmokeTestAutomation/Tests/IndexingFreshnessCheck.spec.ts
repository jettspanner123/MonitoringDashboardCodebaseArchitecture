import { test, expect } from '@playwright/test';
import SmokePageConfigurationService from "../Configurations/SmokePageConfiguration";
import ApplicationDateTimeHelper from "../Helpers/ApplicationDateTimeHelper";
import ApplicationDatabaseService from "../Services/DatabaseServices/ApplicationDatabaseService";
import TestRunIdHelper from "../Helpers/TestRunIdHelper";
import SmokeEnvironmentHelper from "../Helpers/SmokeEnvironmentHelper";

const MAX_INDEXING_STALENESS_MINUTES = 30;

// Isolated from SmokeTest.spec.ts on purpose - this one is meant to run on
// its own cadence (e.g. every 30 minutes via Task Scheduler), not once per
// full-suite run. Tagged so the existing test:*/test:headed:* scripts can
// --grep-invert it out and this one gets its own --grep'd scripts instead.
test('Indexing Freshness check', { tag: '@indexing-freshness' }, async ({ page }) => {
  // No per-test cap - matches SmokeTest.spec.ts's own convention for this
  // same page (waits for the real element, not an arbitrary clock).
  test.setTimeout(0);
  const testRunId = TestRunIdHelper.current.read();

  const pageConfig = SmokePageConfigurationService.current
    .getSmokePageConfiguration(SmokeEnvironmentHelper.current.resolveCurrentEnvironment())
    .find((p) => p.name === '3DSpace search');

  if (!pageConfig || !pageConfig.searchInputSelector || !pageConfig.searchTerm || !pageConfig.expectedResultSelector
    || !pageConfig.hoverInfoSelector || !pageConfig.hoverTooltipSelector) {
    throw new Error('3DSpace search page configuration is missing a field this check depends on.');
  }

  await page.goto(pageConfig.url, { timeout: pageConfig.timeoutMs ?? 0 });

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

  const resultLocator = page.locator(pageConfig.expectedResultSelector);
  await resultLocator.waitFor({ state: 'visible', timeout: pageConfig.timeoutMs ?? 0 });
  if (pageConfig.minResultCount !== undefined) {
    await expect
      .poll(async () => Number((await resultLocator.textContent())?.trim() ?? '0'), { timeout: pageConfig.timeoutMs ?? 0 })
      .toBeGreaterThan(pageConfig.minResultCount);
  }
  const resultCount = Number((await resultLocator.textContent())?.trim() ?? '0');

  const infoIcon = page.locator(pageConfig.hoverInfoSelector).first();
  await infoIcon.waitFor({ state: 'attached', timeout: pageConfig.timeoutMs ?? 0 });
  await infoIcon.hover();

  const tooltip = page.locator(pageConfig.hoverTooltipSelector);
  await tooltip.waitFor({ state: 'visible', timeout: pageConfig.timeoutMs ?? 0 });
  const tooltipText = (await tooltip.textContent())?.trim() ?? '';

  const indexingTime = ApplicationDateTimeHelper.current.parseTimeOfDay(tooltipText);
  if (!indexingTime) {
    throw new Error(`Could not parse an indexing time out of the tooltip: "${tooltipText}"`);
  }

  const machineTime = new Date();
  const diffMinutes = ApplicationDateTimeHelper.current.minutesOfDayDiff(indexingTime, machineTime);
  const isFresh = diffMinutes <= MAX_INDEXING_STALENESS_MINUTES;
  const formattedIndexingTime = indexingTime.toLocaleTimeString();
  const message = isFresh
    ? `Indexing time ${formattedIndexingTime} is fresh (${diffMinutes.toFixed(1)}m from now, threshold ${MAX_INDEXING_STALENESS_MINUTES}m).`
    : `Indexing time ${formattedIndexingTime} is stale (${diffMinutes.toFixed(1)}m from now, threshold ${MAX_INDEXING_STALENESS_MINUTES}m).`;

  await ApplicationDatabaseService.current.recordIndexingFreshnessCheck({
    testRunId,
    resultCount,
    indexTime: indexingTime,
    machineTime,
    timeDifference: diffMinutes,
    isFresh,
    message,
  });
});
