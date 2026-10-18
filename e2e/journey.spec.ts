import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('all ten lifecycle decisions explain alternatives and preserve the live incident',async({page})=>{
 await page.setViewportSize({width:390,height:850});await page.goto('./#guided-path');
 await expect(page.locator('.journey-stages button')).toHaveCount(10);
 for(let i=0;i<10;i++){
  await expect(page.locator('#journey-progress')).toContainText(`Stage ${i+1} of 10`);
  await page.locator('#journey-options button').first().click();await expect(page.locator('#journey-feedback')).toBeVisible();
  const first=await page.locator('#journey-feedback').textContent();await page.locator('#journey-options button').nth(1).click();expect(await page.locator('#journey-feedback').textContent()).not.toEqual(first);
  await expect(page.locator('#journey-deeper')).toHaveAttribute('href',/.+/);
  if(i<9)await page.locator('#journey-next').click();
 }
 await expect(page.locator('#journey-progress')).toContainText('10 decisions explored');await expect(page.locator('#journey-next')).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);
 await page.locator('#prepare').click();await expect(page.locator('#records tr')).toHaveCount(3);
});
