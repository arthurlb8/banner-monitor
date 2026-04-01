const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ============================================
// CONFIGURATION FOR GITHUB ACTIONS
// ============================================
const CONFIG = {
  referenceImages: [
    './reference-banners/metro-campaign.png',
    './reference-banners/obras-campaign.png',
    './reference-banners/policia-campaign.png'
  ],
  
  pagesPerSite: 2, // Reduced for faster GitHub Actions
  screenshotsPerPage: 2, // Only top + sidebar (skip full page)
  matchThreshold: 0.45,
  
  csvPath: './websites.csv',
  outputDir: './public/screenshots',
  dataDir: './public/data',
  
  timeout: 35000 // Timeout per page navigation
};

// ============================================
// PYTHON COMPARISON SCRIPT
// ============================================
function createPythonComparisonScript() {
  const pythonScript = `
import cv2
import numpy as np
import sys
import json

def compare_images(reference_path, screenshot_path, threshold=0.65):
    try:
        reference = cv2.imread(reference_path)
        screenshot = cv2.imread(screenshot_path)
        
        if reference is None or screenshot is None:
            return {"match_found": False, "confidence": 0, "method": "error"}
        
        ref_gray = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
        screen_gray = cv2.cvtColor(screenshot, cv2.COLOR_BGR2GRAY)
        
        results = []
        ref_h, ref_w = ref_gray.shape
        screen_h, screen_w = screen_gray.shape
        
        # Multi-scale template matching (tiny banners)
        scales = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1.0, 1.5]
        best_match = 0
        
        for scale in scales:
            scaled_ref = cv2.resize(ref_gray, None, fx=scale, fy=scale)
            s_h, s_w = scaled_ref.shape
            
            if s_h <= screen_h and s_w <= screen_w:
                result = cv2.matchTemplate(screen_gray, scaled_ref, cv2.TM_CCOEFF_NORMED)
                _, max_val, _, _ = cv2.minMaxLoc(result)
                best_match = max(best_match, max_val)
        
        if best_match >= threshold * 0.9:
            results.append({
                "match_found": True,
                "confidence": float(best_match),
                "method": "multiscale"
            })
        
        if results:
            return max(results, key=lambda x: x["confidence"])
        else:
            return {"match_found": False, "confidence": 0, "method": "none"}
    
    except Exception as e:
        return {"match_found": False, "confidence": 0, "method": "error"}

if __name__ == "__main__":
    reference_path = sys.argv[1]
    screenshot_path = sys.argv[2]
    threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.65
    
    result = compare_images(reference_path, screenshot_path, threshold)
    print(json.dumps(result))
`;

  fs.writeFileSync('./compare_images.py', pythonScript);
  return './compare_images.py';
}

async function findBannerInScreenshot(screenshotPath, pythonScriptPath) {
  const matches = [];
  
  for (const refImage of CONFIG.referenceImages) {
    if (!fs.existsSync(refImage)) continue;
    
    try {
      const command = `python ${pythonScriptPath} "${refImage}" "${screenshotPath}" ${CONFIG.matchThreshold}`;
      const { stdout } = await execAsync(command);
      const result = JSON.parse(stdout.trim());
      
      if (result.match_found) {
        matches.push({
          referenceImage: path.basename(refImage),
          confidence: result.confidence,
          method: result.method
        });
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  return matches;
}

// ============================================
// SITE VERIFICATION
// ============================================
async function verifySite(browser, site, pythonScriptPath) {
  const results = {
    siteName: site.name,
    siteUrl: site.url,
    status: 'pending',
    bannersFound: 0,
    screenshots: []
  };
  
  console.log(`🔍 ${site.name}`);
  
  let page = null;
  
  try {
    page = await browser.newPage();
    const urlsToCheck = [site.url];
    
    // Try to get article links
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
      
      const links = await page.$$eval('a[href]', (anchors, base) => {
        return anchors
          .map(a => a.href)
          .filter(href => {
            const url = new URL(base);
            return href && href.includes(url.hostname) && !href.includes('#');
          })
          .slice(0, 3);
      }, site.url);
      
      urlsToCheck.push(...links);
    } catch (e) {
      // Continue with homepage only
    }
    
    const uniqueUrls = [...new Set(urlsToCheck)].slice(0, CONFIG.pagesPerSite);
    
    for (let i = 0; i < uniqueUrls.length; i++) {
      const url = uniqueUrls[i];
      
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
        await page.waitForTimeout(2000);

        const siteDirName = site.name.replace(/[^a-z0-9]/gi, '_');
        const siteDir = path.join(CONFIG.outputDir, siteDirName);
        if (!fs.existsSync(siteDir)) {
          fs.mkdirSync(siteDir, { recursive: true });
        }

        const screenshots = [];
        const timestamp = Date.now();
        const viewportHeight = 1000;
        const viewportWidth = 1920;

        // Get total page height
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const maxScroll = Math.min(pageHeight, 6000); // Cap at 6000px to keep scan time reasonable
        const sections = Math.ceil(maxScroll / viewportHeight);

        // Scroll through the page and screenshot each section
        for (let s = 0; s < sections; s++) {
          const scrollY = s * viewportHeight;
          await page.evaluate(y => window.scrollTo(0, y), scrollY);
          await page.waitForTimeout(800); // Wait for lazy-loaded ads/images

          const sectionName = `page_${i + 1}_section_${s + 1}_${timestamp}.png`;
          const sectionPath = path.join(siteDir, sectionName);
          await page.screenshot({
            path: sectionPath,
            clip: { x: 0, y: scrollY, width: viewportWidth, height: Math.min(viewportHeight, pageHeight - scrollY) }
          });
          screenshots.push({ name: sectionName, path: sectionPath });
        }

        // Check each section for matches
        let allMatches = [];
        let matchImage = null;
        for (const screenshot of screenshots) {
          const matches = await findBannerInScreenshot(screenshot.path, pythonScriptPath);
          if (matches.length > 0) {
            // Deduplicate: only keep new reference images not already matched
            for (const m of matches) {
              const alreadyFound = allMatches.some(
                existing => existing.referenceImage === m.referenceImage
              );
              if (!alreadyFound) {
                allMatches.push(m);
                if (!matchImage) matchImage = screenshot.name;
              }
            }
          }
        }

        if (allMatches.length > 0) {
          console.log(`   ✅ Found ${allMatches.length} banner(s) across ${sections} sections`);
          results.bannersFound += allMatches.length;

          results.screenshots.push({
            url,
            image: matchImage,
            matches: allMatches
          });
        }
        
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message.substring(0, 50)}`);
      }
    }
    
    results.status = results.bannersFound > 0 ? 'found' : 'not_found';
    console.log(`   ${results.bannersFound > 0 ? '✅' : '❌'} ${results.bannersFound} banner(s)`);
    
  } catch (error) {
    results.status = 'error';
  } finally {
    if (page) {
      try { await page.close(); } catch (e) {}
    }
  }
  
  return results;
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('🚀 Netlify Banner Verification');
  console.log(`📅 ${new Date().toUTCString()}\n`);
  
  // Create directories
  [CONFIG.outputDir, CONFIG.dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  const pythonScriptPath = createPythonComparisonScript();
  
  const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf-8');
  const sites = parse(csvContent, { columns: true, skip_empty_lines: true });
  
  console.log(`📊 Scanning ${sites.length} sites\n`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const allResults = [];
  
  for (let i = 0; i < sites.length; i++) {
    console.log(`[${i + 1}/${sites.length}] ${sites[i].name}`);
    const result = await verifySite(browser, sites[i], pythonScriptPath);
    allResults.push(result);
  }
  
  await browser.close();
  
  // Save results
  const resultsData = {
    lastUpdated: new Date().toISOString(),
    totalSites: allResults.length,
    sitesWithBanners: allResults.filter(r => r.bannersFound > 0).length,
    totalBanners: allResults.reduce((sum, r) => sum + r.bannersFound, 0),
    sites: allResults
  };
  
  fs.writeFileSync(
    path.join(CONFIG.dataDir, 'results.json'),
    JSON.stringify(resultsData, null, 2)
  );
  
  console.log('\n✅ Complete!');
  console.log(`📊 ${resultsData.sitesWithBanners}/${resultsData.totalSites} sites with banners`);
  console.log(`📁 Data: ${CONFIG.dataDir}/results.json`);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
