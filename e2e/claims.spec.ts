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
