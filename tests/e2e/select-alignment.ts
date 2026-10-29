import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Checks text geometry without mutating the page; empty values and misalignment fail.
 * @param scope - Page or container whose visible selectors should be measured.
 * @returns Resolves after asserting selected and placeholder text are centred.
 */
export async function expectCenteredSelectText(
  scope: Page | Locator,
): Promise<void> {
  for (const trigger of await scope
    .locator('[data-slot="select-trigger"]:visible')
    .all()) {
    const offset = await trigger.evaluate((element) => {
      const value = element.querySelector('[data-slot="select-value"]');
      if (!value?.textContent?.trim())
        throw new Error('Selector has no visible value.');
      const range = document.createRange();
      range.selectNodeContents(value);
      const text = range.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return Math.abs(text.y + text.height / 2 - box.y - box.height / 2);
    });
    expect(
      offset,
      `Text centre in ${await trigger.getAttribute('aria-labelledby')}`,
    ).toBeLessThanOrEqual(1.5);
  }
}
