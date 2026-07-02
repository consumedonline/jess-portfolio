# Getting your site live — VS Code + Vercel

## Part 1 — Open it in VS Code

1. Install VS Code if you don't have it: [code.visualstudio.com](https://code.visualstudio.com) → download → install.
2. Open VS Code. Go to **File → Open Folder** and select your `ServiceDesignPortfolio` folder (the one with `index.html`, `style.css`, `script.js`).
3. In the left sidebar (Explorer), confirm you see all three files. If they're there, you're set.

## Part 2 — Preview it locally

Opening `index.html` by double-clicking works, but the cleanest way is a live-reloading local server:

1. In VS Code, go to the Extensions icon (left sidebar, looks like four squares).
2. Search **"Live Server"** by Ritwick Dey → click **Install**.
3. Back in the Explorer, right-click `index.html` → **Open with Live Server**.
4. Your browser opens automatically at something like `127.0.0.1:5500` showing the live site. Any edit you save in VS Code refreshes the browser instantly.

## Part 3 — Put it on GitHub (Vercel deploys from a Git repo)

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Click the **+** in the top right → **New repository**. Name it something like `jessica-portfolio`. Leave it public or private, don't add a README. Click **Create repository**.
3. Back in VS Code, open the built-in terminal: **Terminal → New Terminal**.
4. Run these commands one at a time (replace the URL in step 4 with the one GitHub shows you on the new repo page):

```
git init
git add .
git commit -m "First version of portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/jessica-portfolio.git
git push -u origin main
```

5. If asked to sign in, follow the prompt (VS Code will pop up a browser login).
6. Refresh your GitHub repo page — you should see your three files there.

## Part 4 — Deploy on Vercel (free Hobby plan)

1. Go to [vercel.com](https://vercel.com) → **Sign Up** → choose **Continue with GitHub** (easiest, links the two automatically).
2. Once logged in, click **Add New... → Project**.
3. Vercel will list your GitHub repos — find `jessica-portfolio` and click **Import**.
4. On the configuration screen, leave everything as default:
   - Framework Preset: **Other**
   - Build Command: leave blank
   - Output Directory: leave blank
5. Click **Deploy**. Wait ~30 seconds.
6. You'll get a live URL like `jessica-portfolio.vercel.app`. Click it — that's your site, live on the internet.

## Part 5 — Making future updates live

Every time you want to update the site:

1. Edit your files in VS Code and save.
2. Preview with Live Server to check it looks right.
3. In the terminal, run:

```
git add .
git commit -m "Describe what you changed"
git push
```

4. Vercel automatically redeploys within a minute — no need to log back into Vercel or click anything. Refresh your live URL to see the update.

## Part 6 — Moving your existing domain from Cargo to Vercel

You already own the domain and it's currently pointed at Cargo. This is just about telling the internet "send visitors to Vercel instead." Nothing about your domain ownership changes.

### ⚠️ Before you touch anything

**Do not cancel or unpublish your Cargo site yet.** Keep it running until Vercel is confirmed live on your domain (Part 6, step 5, green checkmark). If something's misconfigured mid-way, your live site stays up on Cargo while you fix it — worst case is nobody notices, instead of your site going dark.

**Check if you use email at this domain** (e.g. `you@jessicaissa.com` through Google Workspace, iCloud+, or Cargo's own email forwarding). If you do, you'll see records starting with **MX** in the DNS steps below — **leave every MX record exactly as it is.** We're only touching the records that control the *website*, not the ones that control *email*. If you're not sure whether you have custom email, it's safe to assume you might — just don't delete anything you don't recognize; only add the two records Vercel gives you.

### Step 1 — Get your site working on the free `.vercel.app` address first

Don't skip this. Confirm Parts 1–4 above are done and your `something.vercel.app` link works properly — click through a few project pages, toggle dark mode, check it on your phone. Only move on once that's solid.

### Step 2 — Tell Vercel about your domain

1. In your Vercel project, go to **Settings → Domains**.
2. Type in your domain exactly as people would type it — e.g. `jessicaissa.com` — and click **Add**.
3. Vercel will also ask about the `www.` version. Add `www.jessicaissa.com` too if you want both `jessicaissa.com` and `www.jessicaissa.com` to work (recommended — Vercel will auto-redirect one to the other).
4. Vercel now shows you a small table of DNS records — something like:

   | Type | Name | Value |
   |------|------|-------|
   | A | @ | `76.76.21.21` |
   | CNAME | www | `cname.vercel-dns.com` |

   **Keep this tab open** — you'll copy these exact values in Step 4. (Vercel occasionally updates the exact IP it hands out, so always use what *your* dashboard shows you, not the example above.)

### Step 3 — Log into wherever you bought the domain

This is **not** Cargo and **not** Vercel — it's whichever company you originally registered the domain through (GoDaddy, Namecheap, Squarespace Domains — the company Google Domains moved everyone to — or similar). If you're not sure, that's fine, it's usually wherever you get an annual renewal email/receipt for the domain itself.

Once logged in, find the domain and look for a section called one of these (varies by registrar):
- **DNS** / **DNS Management** / **Manage DNS**
- **Advanced DNS** (Namecheap)
- **DNS Settings** (GoDaddy — under the domain's "..." menu → **Manage DNS**)

### Step 4 — Remove Cargo's records, add Vercel's

1. In that DNS screen, look for any existing record with **Type = A** and **Name/Host = @** (or blank, or your bare domain). This is almost certainly the one pointing at Cargo. **Delete it.**
2. Look for any existing record with **Type = CNAME** and **Name/Host = www**. If it points somewhere Cargo-related (e.g. contains "cargocollective" or "cargo.site"), **delete it** too.
3. Leave anything with **Type = MX**, or **Type = TXT** untouched — those aren't website records.
4. Now **add** the two records Vercel showed you in Step 2:
   - Type **A**, Name **@**, Value = the IP Vercel gave you (e.g. `76.76.21.21`)
   - Type **CNAME**, Name **www**, Value = `cname.vercel-dns.com` (copy it exactly, including any trailing period if your registrar shows one)
5. Save / confirm the changes on the registrar's site.

### Step 5 — Wait, then verify

1. DNS changes usually take effect within 10–30 minutes, though registrars sometimes warn "up to 48 hours" — that's a worst case, not the norm.
2. Back in Vercel's **Settings → Domains** tab, refresh the page every so often. Once it's picked up the change, both domains will show a green checkmark next to them.
3. Visit `jessicaissa.com` in a normal browser tab (not the same tab you've had open the whole time — open a fresh one, or use private/incognito, so you're not looking at a cached version). It should now show your new Vercel-hosted site.

### Step 6 — Only now, retire Cargo

Once Step 5 shows your real domain loading the new site correctly:

1. Log into Cargo, and either unpublish the site or let the subscription lapse at renewal (your call — no rush, it's no longer doing anything since the domain no longer points at it).
2. Keep Cargo login details somewhere safe for a few weeks just in case, then you're done.
