import {test,expect} from '@playwright/test';
test('key rotation does not erase a copied key; actual attacker decryption, re-encrypt and retirement remain honest',async({page})=>{
 await page.goto('./');await page.locator('#prepare').click();await expect(page.locator('#records tr')).toHaveCount(3);
 await page.locator('#rotate').click();await expect(page.locator('#active-key')).toContainText('Key B');
 await page.locator('#capture').click();await page.locator('#attack').click();
 await expect(page.locator('#outcome')).toContainText('AUTHENTICATED — CONFIDENTIALITY LOST');
 await expect(page.locator('#attack-result')).toContainText('Fictional record for Aisle-17 (epoch 1)');
 await expect(page.locator('#negative-claim')).toContainText('does not prove the key was kept confidential');
 await page.locator('#reencrypt').click();await expect(page.locator('#records tr').first()).toContainText('epoch 2');
 await page.locator('#retire').click();await page.locator('#attack').click();await expect(page.locator('#outcome')).toContainText('CONFIDENTIALITY LOST');
 await page.locator('#reset').click();await expect(page.locator('#active-key')).toContainText('None');
});
test('tampering really fails cryptographic authentication',async({page})=>{
 await page.goto('./');await page.locator('#prepare').click();await page.locator('#tamper').click();
 await expect(page.locator('#outcome')).toContainText('TAMPERING REJECTED');
});

test('migration without a historical capture reports the observed custody', async ({ page }) => {
  await page.goto('./');
  await page.locator('#prepare').click();
  await page.locator('#rotate').click();
  await page.locator('#reencrypt').click();
  await expect(page.locator('#outcome')).toContainText('No external key and ciphertext copy was captured');
  await expect(page.locator('#capture')).toBeDisabled();
  await expect(page.locator('#stolen-key')).toHaveText('None');
  await page.locator('#retire').click();
  await expect(page.locator('#timeline')).toContainText('No external key and ciphertext copy was captured');
  await expect(page.locator('#outcome')).toContainText('No external key and ciphertext copy was captured');
});
test('a reset while rotation is pending cannot publish the previous result', async ({ page }) => {
  await page.goto('./');
  await page.locator('#prepare').click();
  await expect(page.locator('#rotate')).toBeEnabled();
  await page.evaluate(async () => {
    const generate = crypto.subtle.generateKey.bind(crypto.subtle);
    let release!: () => void;
    const hold = new Promise<void>(resolve => { release = resolve; });
    let finish!: () => void;
    const generated = new Promise<void>(resolve => { finish = resolve; });
    Object.defineProperty(crypto.subtle, 'generateKey', { configurable: true,
      value: async (...args: Parameters<SubtleCrypto['generateKey']>) => {
        await hold;
        const key = await generate(...args);
        finish();
        return key;
      },
    });
    document.querySelector<HTMLButtonElement>('#rotate')!.click();
    document.querySelector<HTMLButtonElement>('#reset')!.click();
    release();
    await generated;
    // Allow the old action to finish its promise chain and publish any result.
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  });
  await expect(page.locator('#outcome')).toContainText('Reset complete');
  await expect(page.locator('#active-key')).toHaveText('None');
  await expect(page.locator('#records')).toContainText('No data yet');
  await expect(page.locator('#prepare')).toBeEnabled();
});
