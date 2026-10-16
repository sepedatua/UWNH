# Uncharted Waters: New Horizons — Work Breakdown Structure (WBS)

**Project Architecture:**
- **Frontend:** TypeScript + Vite + Pixi.js / HTML5 Canvas (World & Port Viewports) + Tailwind/CSS & React (RPG Menus, Dialogue, HUD)
- **Backend:** PHP 8.2+ REST API (Modular Controllers, PDO, Stateless Token / Session Auth)
- **Database:** MariaDB (Self-Hosted on Debian 13 Hetzner VPS)
- **Target Deployment:** Virtualmin LAMP Stack on Hetzner VPS (Zero cloud fees, zero WebSockets)

---

## Milestone 0: Bootstrap & "First Renderable Screen" (Sprint 1)
*Goal: Extract raw assets from the local DOS folder, initialize the Vite project, and immediately render a live retro viewport on screen.*

- [x] **Task 0.1: Asset Extraction Pipeline — Port & Map Graphics** (Completed)
- [x] **Task 0.2: Asset Extraction Pipeline — Portraits & Game Tables** (Completed)
- [x] **Task 0.3: Frontend Web Scaffolding & Canvas Viewport** (Completed)
- [x] **Task 0.4: First Renderable Screen — Static Port of Lisbon** (Completed)

---

## Milestone 1: Port Exploration & Interactive World (Sprint 2)
*Goal: Walk around Lisbon with a retro sprite, collide with obstacles, and enter building doors.*

- [x] **Task 1.1: Player Character Controller & Sprite Animation** (Completed)
  - 4-directional sailor walking animations (North, South, East, West).
  - Smooth grid-snapped step movement and alternative route pathfinding around obstacles.
- [x] **Task 1.2: Collision Detection & Building Trigger Zones** (Completed)
  - Authentic tilemap collision detection against walls, water, and static obstacles.
  - Interactive building door triggers for all 12 building types across all ports.
- [x] **Task 1.3: Port UI Overlay & Time Progression System** (Completed)
  - Retro HUD: Port name, regional allegiance, calendar date, 20-minute clock, ingots, and coins.
  - Step-based time ticking: walking 12 steps in town advances time by 20 minutes.
  - 4-phase day/night lighting palette (Morning, Midday, Evening dusk, Night) and dynamic NPC spawning/despawning.
- [x] **Task 1.4: Facility Door Transition & Interior Dialog Modal** (Completed)
  - Authentic parchment interior dialog modal with vendor portraits and speech bubbles.
  - Night operating hours enforced: daytime facilities lock at 8:00 PM; Pub, Lodge, and Harbor remain open 24/7. **[PLAYABLE MILESTONE: Walkable port with working door transitions!]**

---

## Milestone 2: Port Commerce, Shipyard & The Inn (Sprint 3)
*Goal: Complete the core merchant gameplay loop inside ports.*

- [x] **Task 2.1: Local Market Architecture & Trading UI** (Completed)
  - Built Market UI: Buy Goods, Sell Goods, Market Rate, and Invest.
  - Catalog of 31 authentic commodities (Food, Luxuries, Spices, Textiles, Arms, Minerals).
  - Accurate port specialty origin mappings and fleet hold capacity enforcement.
- [x] **Task 2.2: Dynamic Local Price Fluctuations (Single-Player & Multiplayer Engine)** (Completed)
  - Dynamic price index algorithm (50%–150%) with purchase inflation and sales depreciation.
  - Authentic geographic arbitrage pricing engine (e.g. Far East/Indian spices selling at high returns in Europe).
  - Single-Player mode isolation vs. real-time atomic sync with MySQL backend (`/mp/trade.php` and `/mp/invest.php`) in Multiplayer mode.
- [x] **Task 2.3: Shipyard Operations & Customization** (Completed)
  - Full Shipyard UI: Used Ships, Fleet Hull Repairs, Ship Remodeling, Sell, and Industrial Investment.
  - Interactive ship capacity reallocation sliders for Crew Quarters, Gun Ports, and Cargo Hold.
  - Port industry expansion that unlocks higher-tier historical ship hulls.
- [x] **Task 2.4: The Pub (Tavern) & Crew Recruitment** (Completed)
  - Full Pub UI: Recruit Crew, Dismiss Crew (frees cargo space & cuts food consumption), Treat Patrons.
  - Fleet morale management up to 100 with authentic tavern trade rumors.
  - Interactive 16th-century Sailor Dice Game (High-Low / 2d6) with wagers and payouts.
  - Waitress interactions and greetings.
- [x] **Task 2.5: The Lodge, Rest & Time Advancement** (Completed)
  - Full Lodge UI: Check In (Sleep until Morning), Rest until Night (8:00 PM), Port Info, and Traveler Gossip.
  - Smooth fade-to-black time advancement that updates calendar date and daily healing. **[PLAYABLE MILESTONE: Full trade & provisioning loop inside port!]**

---

## Milestone 3: Open Ocean Sailing Simulation (Sprint 4)
*Goal: Sail out of the harbor into the seamless 2160x1080 world map with winds, currents, and cylindrical wrap.*

- [x] **Task 3.1: Global World Map Chunking & Cylindrical Wrap** (Completed)
  - Loaded decoded global world map tiles (`WORLDMAP.LZW`).
  - Viewport camera rendering for the ocean world map with seamless horizontal cylindrical wrapping across 180° Meridian ($x = 0 \leftrightarrow 2160$).
  - Render coastlines, shoals, deep sea, and ice caps.
- [x] **Task 3.2: Wind & Ocean Current Simulation** (Completed)
  - Dynamic monthly and sector lookup from parsed `WINDCUR.DAT` matrix based on ship coordinates $(x, y)$.
  - Retro wind vane and ocean current needle indicator compass on sailing HUD.
- [x] **Task 3.3: Sailing Movement Physics & Rigging Model** (Completed)
  - Ship velocity equation accounting for heading vs. wind direction delta.
  - Square-rigged vs. Lateen-rigged sail efficiency factor and tacking ratings.
  - Ocean current vector drift and cargo hold weight friction.
- [x] **Task 3.4: Voyage Survival & Midnight Tick Engine** (Completed)
  - Daily consumption of Food and Water based on total crew headcount ($1 \text{ unit} / 10 \text{ crew} / \text{day}$).
  - Dehydration and starvation penalties when rations hit zero (morale loss, crew casualties).
  - Scurvy hazard evaluation for prolonged voyages ($> 30$ days).
  - Days-at-Sea counter and floating sea event/crisis toasts.
- [x] **Task 3.5: Port Arrival & Harbor Landing** (Completed)
  - Port entrance proximity detection across all 100 regular ports and 30 supply ports with cylindrical wrap tolerance.
  - Interactive Harbor Sighted HUD banner and one-click/keypress `[E]` harbor docking.
  - Seamless transition back into Port Walk mode and day-at-sea reset. **[PLAYABLE MILESTONE: You can sail between Lisbon, Seville, Ceuta, and beyond!]**
- [x] **Task 3.6: Authentic Koei UW2 Survival Systems — Fractional Sailors, Rations Adjustment, Scurvy Treatment & Coastal Anchorage Operations (Foraging & Field Hull Repairs)** (Completed)
  - **Fractional Sailors (Precision Accumulator):** Accurate Koei consumption rate ($0.1$ water and $0.1$ food per sailor per day at 100% rations) utilizing running state accumulators (`waterAccumulator`, `foodAccumulator`) so odd crew counts (e.g., 15 crew = 3 barrels every 2 days; 1 crew = 1 barrel every 10 days) deduct without punitive ceiling inflation.
  - **Rations Adjustment Widget:** Embedded interactive ration selector (20% Emergency to 100% Standard) directly inside the Provisions HUD panel (`Provisions.tsx`) with real-time remaining days calculation and morale consequence indicators.
  - **Scurvy Threshold & Lime Juice Remedy:** Updated scurvy trigger threshold to 50 consecutive days at sea (`dayAtSea >= 50`); automated administration of Lime Juice (`itemId: '44'`) from inventory to cure outbreaks and protect crew health.
  - **Coastal Shore Landing Party & Foraging:** Ability to drop anchor along non-port coastlines to organize a 6-hour shore expedition; crew-scaled yields for abundant fresh water, foraged food (small amount), and felled timber (small amount); 4-tile depletion radius (`foragedLocations`) to prevent localized farming.
  - **Low Cargo Storage Allocation Modal:** Interactive modal granting the captain total control to balance and confirm how much gathered water, food, and lumber to stow into ship holds within available fleet cargo capacity.
  - **Light Ship Repair on Shore (Careening):** Field emergency hull repair while anchored along calm coastlines; consumes cargo/foraged lumber ($1 \text{ Lumber} = 5 \text{ Durability points}$); capped at an 80% field repair ceiling (full 100% overhaul requires shipyard drydock).


---

## Milestone 4: Auth, Database & Multi-Slot Saves (Sprint 5)
*Goal: Allow users to log in with Google, manage multiple character slots, and isolate SP economies.*

- [x] **Task 4.1: Debian 13 VPS LAMP Database Setup** (Completed — `database/schema.sql` created)
- [x] **Task 4.2: Google One-Tap / OAuth Authentication Backend & UI** (Completed — `server/auth/google.php` & `GoogleAuthModal.tsx`)
- [x] **Task 4.3: Save Slot API & Payload Serialization** (Completed — `server/saves/list.php`, `save.php`, `load.php`, `delete.php`)
- [x] **Task 4.4: Main Menu & Save/Load Character Slot UI** (Completed — `SaveLoadModal.tsx` & `TopBar.tsx`)
- [x] **Task 4.5: Permadeath Handling for Endless Modes** (Completed — permadeath enforcement & badges in API and UI)

---

## Milestone 5: Combat Systems — Naval Battles & 1v1 Duels (Sprint 6)
*Goal: Turn-based hex grid fleet battles and the 1v1 captain fencing duel.*

- [x] **Task 5.1: Hex Grid Battle Arena & Unit Setup** (Completed)
  - Turn-based pointy-topped axial hex grid battle board rendered on Canvas (`BattleArena.tsx` & `hexUtils.ts`).
  - Deploys player fleet ships and enemy war fleet based on battle coordinates, mobility, and wind vectors.
- [x] **Task 5.2: Ship Maneuvers & Turn Queue** (Completed)
  - Axial distance calculations, movement points (MP) consumption with wind angle penalties.
  - 60-degree incremental ship rotation (heading determines broadside arcs and bow direction).
- [x] **Task 5.3: Cannon Fire & Damage Calculations** (Completed)
  - Cannon broadside targeting across port and starboard conical firing arcs.
  - Cannon types: Normal, Culverin (range 3), Carronade (close-range devastating smash).
  - Damage calculation for hull durability and crew casualties factoring Gunnery skill and distance decay.
  - Sunk ship conditions, floating damage texts, and battle chronicles.
- [x] **Task 5.4: Boarding Clash & Duel Invitation** (Completed)
  - Adjacent ship boarding melee: crew numbers, morale, and Captain Battle Level exchange casualties and capture enemy ships.
  - Flagship clash evaluates duel invitation: when player flagship and enemy flagship grapple, triggers the 1v1 Captain Sword Duel!
- [x] **Task 5.5: The 1v1 Captain Sword Duel Engine** (Completed)
  - Retro fencing stage modal with animated combatants and the 0–200 Tug-of-War Balance Meter (`SwordDuelModal.tsx` & `duelEngine.ts`).
  - Triangle of tactical stances:
    - Attacker: Thrust / Slash / Strike
    - Defender: Parry / Dodge / Block
  - Stance counter-advantages, weapon damage rating, armor mitigation, critical hits, and Swordsmanship bonuses.
  - Duel outcome: Defeating enemy commodore immediately concludes the naval battle with victory, awards plunder gold, piracy fame, and captured vessels! **[PLAYABLE MILESTONE: Full tactical naval battles and sword duels!]**


---

## Milestone 6: Quests, Romance, Palace & Scenarios (Sprint 7)
*Goal: Implement the 6 story campaigns, tavern waitresses, palace nobility, and adventure discoveries.*

- [x] **Task 6.1: Pub Waitress & Romance System** (Completed)
  - Populated 31 authentic historical waitresses mapped to ports (Carlotta in Lisbon, Monica in Seville, Fatima in Istanbul, Emma in London, Nicole in Amsterdam, Priya in Goa, O-Sen in Nagasaki, etc.).
  - Interactive Romance UI modal (`WaitressModal.tsx`): "Tell Stories" (Favor gain scaled by Adventure Fame) and "Give Gift" (500 G tip or cargo items, with favorite category affinity).
  - Unlocked Market intelligence at 40+ Favor (remote commodity trade secrets and arbitrage tips).
  - Unlocked Pirate Fleet intelligence at 80+ Favor (wanted pirate names, roaming coordinates, and fleets).
- [x] **Task 6.2: Palace Audience & 9 Nobility Ranks** (Completed)
  - Royal Palace entrance guard check in `actionsPalace.ts`: Commoners turned away (requires 500+ Fame); admitted commanders greeted with salutes.
  - Interactive Throne Room UI (`Palace.tsx`): Audience with European and Ottoman monarchs (King Manuel I, King Carlos I, King Henry VIII, Prince Maurice, Sultan Suleiman I, Doge Andrea Doria).
  - 9 Nobility Ranks (Page through Duke) with title conferral ceremonies and formal salutations.
  - Knight Rank (Rank 3) confers the Royal Tax Exemption Permit (0% purchase tariffs).
- [x] **Task 6.3: Royal Mission Generator** (Completed)
  - Implemented 4 royal commission archetypes: Pirate Hunt, Diplomatic Delivery, Procure Rare Commodity, and Reclaim Allied Port.
  - Successful execution grants +1 Nobility Rank promotion and thousands in gold bounties.
  - Abandonment penalty enforced: halves player Fame across all categories for royal dereliction of duty.
  - Emergency Royal Admiralty stipend for destitute commanders and defection between the 6 great powers.
- [x] **Task 6.4: Adventure Discoveries & Cartography Contracts** (Completed)
  - 17 legendary historical and mythological landmarks (Stonehenge, Great Pyramids, Great Wall, Moai, Aurora, Komodo Dragon, El Dorado, Moby Dick, Atlantis, etc.) with world coordinates.
  - Real-time exploration proximity detection and HUD exploration banner (`[🔍 Explore Landmark]`) in `SailingHUD.tsx` with `[F]` hotkey.
  - Full-screen `DiscoveryModal.tsx` displaying discovery rank, lore, historical significance, and fame gains.
  - Maritime Guild House (`Guild.tsx`): Antiquities Collector for cash bounties and Cartography Atlas charter submissions.
- [x] **Task 6.5: Scenario Scripting Engine (SP Scenario Mode)** (Completed)
  - Scenario Campaign Engine (`scenarioEngine.ts`) with multi-chapter storylines, dynamic live objective tracking, and milestone rewards for João Franco, Catalina Erantzo, and Ali Vezas.
  - In-game Quest Journal (`ScenarioJournalModal.tsx`) accessible via top bar and `[J]` keybinding, showing active chapter objectives, progress trackers, and First Mate strategic hints.
  - **Lisbon Prologue Lifecycle & Idempotency Safeguards:** Guarded João Franco's Lisbon prologue sequence (`getAvailableQuest.ts`) so that completing `harborFinal` permanently unlocks all standard port facilities (Pub, Shipyard, Market, Item Shop, Church, Harbor, Lodge, Bank, Guild) without repeating prologue conversations upon re-visiting Lisbon.
  - **Save/Load State Serialization:** Added `state.quests`, `scenarioChapter`, and related progress fields to save slot payloads (`SaveLoadModal.tsx`) with automatic legacy save migration and deduplication for duplicate officers (Rocco, Enrico), ships (Hermes II), and unique quest items (Aqua Tiara, Rapier). **[PLAYABLE MILESTONE: Authentic story campaigns, tavern romance, royal court audience, and world adventure discoveries!]**

---

## Milestone 7: Multiplayer Shared Living World (Sprint 8)
*Goal: Shared global economy, player ghost fleets, and national port influence in MP Endless Mode without WebSockets.*

- [x] **Task 7.1: Multiplayer Living Economy API** (Completed)
  - Created endpoints: `GET /server/mp/ports.php` and `POST /server/mp/trade.php` with atomic MariaDB transactions.
  - Dynamic commodity stock adjustments and real-time price index shifts (50%–150%) reflected across all MP captains.
  - Implemented periodic background economic normalization algorithm decaying artificial market spikes toward 100% over real-world hours.
- [x] **Task 7.2: Shared National Port Influence & Flag Flipping** (Completed)
  - Created `POST /server/mp/invest.php` and `GET /server/mp/influence.php` for economy and industry port funding.
  - Contested ports flip controlling national allegiance and flag globally once a nation's cumulative investments exceed rival powers.
  - Single-Player mode isolation maintained: SP campaigns retain independent port states without affecting or being affected by the live MP world.
- [x] **Task 7.3: Ghost Fleet Registry & Synchronous Check-In** (Completed)
  - Created `POST /server/mp/checkin.php` and `GET /server/mp/fleets.php` supporting live position, heading, ship composition, nationality, and bounty sync.
  - Cylindrical world X-coordinate wrap-around (0..2160) support for sector radar queries.
  - Automated guest fallback fleet generator ensuring lively waters even when testing solo or during low server traffic.
- [x] **Task 7.4: Ghost Fleet AI Navigation & Combat Encounters** (Completed)
  - Created client-side `ghostFleetManager.ts` featuring autonomous forward sailing, random heading shifts, periodic check-in pings (30s), and REST fleet polling (15s).
  - Integrated proximity radar interception prompt into `SailingHUD.tsx` (`[⚔️ Intercept Ghost Fleet (I)]`) with `[I]` keybinding to immediately engage nearby player ghost fleets in tactical hex combat.
- [x] **Task 7.5: Player Piracy & Bounty Hunting Board** (Completed)
  - Created `GET /server/mp/bounties.php` ranking the Top 10 Most Wanted pirate commanders in the shared world.
  - Implemented full Wanted Board tab in Maritime Guild House (`Guild.tsx`) displaying commander names, bounties, ships, and last known sector coordinates.
  - Country Info leaderboard in `Guild.tsx` showing real-time global port control tally per nation. **[PLAYABLE MILESTONE: Living shared multiplayer economy, ghost fleet radar & tactical encounters, and live bounty hunting board!]**

---

## Milestone 8: Admin Panel, Custom Ports & Production Deployment (Sprint 9)
*Goal: Admin userbase management, ability to add new ports via JSON, and final deployment to Hetzner LAMP.*

- [x] **Task 8.1: Port Extensibility System (`ports.json`)** (Completed)
  - Created declarative `ports.json` with 6 regional architectural archetypes (Mediterranean, Northern Europe, Ottoman/Islamic, Frontier Supply, East Asian, and New World Colonial).
  - Built `portRegistry.ts` featuring procedural archetype layout mapping (automatically generating 96x96 tilemaps, tilesets, and building door coordinates for custom ports).
  - Integrated 5 custom ports: Singapore (129), Honolulu (130), Galapagos (131), Cape Verde (132), and Sydney (133), fully integrated with sailing radar proximity docking, markets, and MariaDB economy up to port ID 500.
- [x] **Task 8.2: Web Admin Management Panel** (Completed)
  - Created `server/admin/users.php` and `AdminModal.tsx` in `TopBar.tsx`.
  - Full player account management, user search, role assignment, active ban toggling, and multi-slot save game statistics.
- [x] **Task 8.3: Audio Pipeline (Yoko Kanno's Soundtrack & Web Audio SFX Engine)** (Completed)
  - Built `soundManager.ts` featuring Web Audio API synthesis for authentic 16-bit sound effects without missing audio files (Naval Cannon blasts, Market Coin clinks, Ship Watch Bell chimes, Captain Duel Sword clashes, Ocean Waves, Victory Fanfare).
  - Streaming Yoko Kanno OGG soundtrack with dual playback modes: "CD Orchestrated Master" vs "16-Bit FM Synthesizer Emulation" (BiquadFilter retro curve & harmonic saturation).
  - Upgraded `Sound.tsx` with retro parchment audio settings panel, volume sliders (Master, Music, SFX), mute toggle, and SFX test palette.
- [x] **Task 8.4: Hetzner Debian 13 Production Deployment** (Completed)
  - Verified production Vite build (`npm run build`) compiling clean WASM tilemaps, OGG audio, and minified bundles in 1.05s.
  - Built comprehensive Virtualmin LAMP deployment automation package: `deploy/deploy.sh`, `deploy/setup_database.sh`, `deploy/virtualmin-apache.conf`, `deploy/virtualmin-nginx.conf`, `deploy/.htaccess`, and `deploy/DEPLOYMENT_GUIDE.md`.
  - Configured HTTP/2, gzip/deflate, SPA URL rewriting, security headers, and 1-year immutable caching for `.wasm`, `.ogg`, and `.webp` assets.

---

## Milestone 9: Fog of War, Nautical Cartography & Sea Weather Anomalies (Sprint 10)
*Goal: Authentic uncharted world exploration, 20x20 chunky sector cartography, viewport sepia parchment fog shroud, flagship Lookout duty, Telescope item, dynamic Heavy Fog weather anomalies, and interactive `[M]` World Atlas modal in both SP and MP.*

- [x] **Task 9.1: Sector Cartography & Exploration Bitmask Engine (`explorationManager.ts`)** (Completed)
  - Divided the 2160x1080 world into authentic 20x20 tile nautical sectors ($108 \times 54 = 5,832$ sectors total).
  - Track explored vs uncharted sectors persistently via compact Base64 bitmask in local state & save slots for Single Player, with server sync in MP.
  - Cartographer regional sea charts purchasable at Maritime Guild (Mediterranean, Northern Europe, Caribbean, Indian Ocean, Far East) and cartography contract atlas submission for gold/fame.
- [x] **Task 9.2: 16-Bit Tile-Aligned Jagged Fog of War Shroud & Flagship Lookout (`fogOfWarRenderer.ts`)** (Completed)
  - Render authentic retro 16-bit tile-aligned staircase jagged shroud adhering strictly to $32 \times 32$ world tiles.
  - Explored waters keep permanently revealed while sailing (charted ocean, coastlines, and ports stay uncovered).
  - Flagship officer role: "Lookout" (`lookout`), with line-of-sight multiplier based on Wisdom and Intuition (+15% to +50%).
  - Brass "Telescope" item in `itemData.ts` and item shops granting +30% sight horizon.
  - Hide enemy pirate sails, NPC merchants, and MP ghost fleets outside active line of sight.
- [x] **Task 9.3: Dynamic Heavy Fog Weather Anomalies (`seaWeather.ts`)** (Completed)
  - Historical fog corridors (Grand Banks of Newfoundland, English Channel, Cape Horn, Kuril Sea) with rare and memorable pacing (2-4% per sea day in cold zones; 0% in sunny waters like Mediterranean/Caribbean).
  - Enforces a 5-day recovery cooldown after fog clears before another weather anomaly can trigger.
  - Heavy fog collapses visual reveal radius to a 4.5 tile lantern cone, overlays translucent rolling cloud mist, and jams radar detection.

- [x] **Task 9.4: Interactive World Atlas Modal (`WorldAtlasModal.tsx`)** (Completed)
  - Fullscreen interactive Renaissance World Map accessible via `[M]` keybinding and TopBar button.
  - Render uncharted sectors as vintage sepia parchment with decorative cartography and sea monsters.
  - Explored sectors reveal coastlines, discovered ports, supply havens, landmarks, and current fleet position. **[PLAYABLE MILESTONE: Authentic retro Fog of War, Crow's Nest Lookout, Telescopes, and Heavy Fog sea hazards!]**

---

## Milestone 10: Port Autopilot Navigation & Maritime Course Plotting (Sprint 11)
*Goal: Interactive port course plotting on the [M] World Atlas, dynamic Macro-Grid A* nautical pathfinding with cylindrical X-wrap, arrival action toggles (direct harbor docking vs anchoring in roadstead), persistent safety advisory alerts (low provisions, corsairs, storms) without halting the helm, and real-time Sailing HUD navigation status.*

- [x] **Task 10.1: Macro-Grid A* Nautical Pathfinding Engine (`autopilotManager.ts`)** (Completed)
  - Implemented a 216x108 obstacle-free sea macro grid (10x10 tiles per cell, 23,328 nodes) with <3ms path solving.
  - Native cylindrical horizontal wrap-around ($0 \leftrightarrow 2160$) across Pacific and Atlantic seams.
  - Continuous waypoint smoothing, open-water corridor clearance, and coastal collision avoidance.
- [x] **Task 10.2: Interactive Atlas Course Plotter (`WorldAtlasModal.tsx`)** (Completed)
  - Clickable revealed/visited port pins on the 1080x540 World Atlas canvas with distance and voyage day estimates.
  - Vintage Renaissance Course Plotting Card modal with arrival mode toggle: `⚓ Enter Port Directly` (auto-dock into harbor) vs `🌊 Stay in Port Ocean` (drop anchor in roadstead outside port; food/water consumed normally).
  - Visual plotted golden dashed nautical route line drawn across the World Atlas map.
- [x] **Task 10.3: Autopilot Steer Loop, Simulation & Safety Advisory Alerts (`worldCharacters.ts` & `autopilotManager.ts`)** (Completed)
  - Steers flagship along plotted waypoints with natural time ticks, wind/current interactions, and Fog of War tile reveals.
  - Safety Advisory Alerts (Non-Halt Persistence): Sounds ship's bell alarm and presents prominent HUD warnings when supplies are critical (<5 days food/water), hostile corsairs are within 10 tiles, or sudden storms strike, while allowing autopilot to persistently maintain its course without stopping.
  - Instant manual helm override: tapping directional keys (W/A/S/D/Arrows) or Esc immediately cancels autopilot without penalty.
- [x] **Task 10.4: Sailing HUD Navigation Status Banner & Audio Feedback (`SailingHUD.tsx`)** (Completed)
  - Real-time navigation banner showing destination port, arrival mode, distance remaining, and `[⏹️ Disengage Helm]` button.
  - Audio cues: Watch bell chime upon course engagement, safety advisory alarm, and arrival fanfare.
- [x] **Task 10.5: Single-Instance Modal Architecture, Port Enforcement & Interactive World Map Zoom/Pan** (Completed)
  - Single Source of Truth: Consolidated `<WorldAtlasModal>` strictly to `TopBar.tsx`, eliminating duplicate modal stacks and dual 'M' listener ping-ponging.
  - Harbor/Sea Status Enforcement: Autopilot is strictly disabled when docked in port (`state.portId !== null`), with clear UI warnings and disabled course engagement button.
  - Live Flagship Synchronization: Continuously sync `state.fleets[1].position` in `worldCharacters.ts` and ensure all charted ports are guaranteed navigable in `autopilotManager.ts`.
  - Interactive Canvas Zoom & Pan:
    - Zoom scaling from $1.0\times$ (full world view) to $4.0\times$ (high-detail regional view) with smooth boundary clamping.
    - Mouse wheel zoom centered on cursor pointer, click-and-drag panning across charted and uncharted waters.
- [x] **Task 10.6: Coastal Clearance Routing, Anti-Stuck Deflection & Explored-Only Pathfinding Rule** (Completed)
  - Explored-Only Maritime Routing: Autopilot strictly paths through already revealed/charted waters (enforces Fog of War trade route progression; returns null and warns if unrevealed fog blocks passage).
  - Open-Sea Safety Weighting: Multi-tier cost matrix (1.0 for open ocean, 4.5 for coastal bottlenecks) so ships naturally favor wide open sea passages and avoid perilous 1-tile shallows like Bangka Strait.
  - Deepest-Water Waypoint Centroid: Waypoints placed on guaranteed water tiles with maximum land clearance rather than blind cell center coordinates.
  - Coastal Deflection & Anti-Stuck: Active collision detection in the steering loop with deflection heading adjustments and auto-disengage if wedged against shores.

- [x] **Task 10.7: Continuous Raycast Line-of-Sight Smoothing, Anti-Oscillation & Archipelago Clearance** (Completed)
  - Strict No-Corner-Cutting & Shared Water Boundary Checks (`hasSharedWaterBoundary`): Enforces standard grid navigation constraints preventing diagonal cutting across corner landmasses and peninsulas (such as slicing through northern Sumatra near Pasei).
  - Continuous Bresenham Raycasting (`hasWaterLineOfSight`): Validates every segment between candidate waypoints, eliminating diagonal island clipping across archipelagos (e.g. Mentawai Islands).
  - Reference-Aware Deepest-Water Centroids: Waypoints evaluate reachable line-of-sight from previous nodes, preventing waypoints from bifurcating across opposite sides of intervening island ridges.
  - Raycast String-Pulling Path Smoothing: Dynamically skips redundant intermediate collinear nodes up to 10 cells in clear ocean while preserving safe corner bends around capes and islands.
  - Anti-Oscillation Sustained Deflection: Replaced single-tick instantaneous velocity checks with 6-frame sustained deflection windows and decaying movement accumulators, preventing infinite beach crashing loops.
  - Net Progress Target Tracking: Monitors distance-to-waypoint progress across rolling time windows; triggers automatic fail-safe helm disengagement and ship's bell alarm if forward progress is blocked for $\ge 24$ ticks. **[PLAYABLE MILESTONE: Rock-solid archipelago navigation, zero island clipping, and anti-oscillation coastal evasion!]**

- [x] **Task 10.8: Manual Steering Priority & Clean Port Departure Navigation** (Completed)
  - Safe Flagship Captain Resolution: Fixed fatal unhandled `No captain was found for the provided ship` exception in `getCaptain(0)` / `worldPlayer.ts:updateSpeed()` when `state.mates[0].role` is `null` (the default for the protagonist in fresh games and saved files), which previously halted the game loop the instant a steering key was pressed.
  - Universal 130-Port Departure Clearance: Expanded `positionAdjacentToPort` with a 20-offset sorted candidate ring, eliminating port departure failures for all historically difficult ports (Luanda, Cairo, Belgrade, Mindanao, Ezo, Wanganui, Pasei), guaranteeing collision-free water tiles within immediate harbor docking distance.
  - Dual WASD & Arrow Key Support: Enhanced `input.ts` with transparent key normalization for `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and Numpad direction keys, alongside existing WASD controls.
  - Clean Autopilot Disengagement on Departure & Arrival: Explicitly clears autopilot course and resets stuck state in `setSail()` and `dock()`, ensuring manual helm responsiveness is 100% restored upon setting sail.
  - Window Blur Input Reset: Added `blur` listener in `input.ts` to clear stuck keys when the browser window or tab loses focus. **[PLAYABLE MILESTONE: Immediate, responsive manual steering with WASD and Arrow keys after setting sail from any port!]**

- [x] **Task 10.9: Guaranteed Harbor Docking, Multi-Step Hull Lookahead & Tangent-Bug Handedness Lock** (Completed)
  - Geometric Footprint Reconciliation: Reconciled continuous point-based path representation with $2 \times 2$ hull footprint and discrete 8-directional compass stepping.
  - Opportunistic Harbor Capture: Checks `portAdjacentAt(currentPos)` on every tick during the terminal approach; the instant the flagship enters the valid docking envelope, docking triggers immediately without circling.
  - Split Waypoint Capture Radii: Maintains `TRANSIT_WAYPOINT_RADIUS = 2.5` for smooth intermediate ocean turns while tightening terminal approach to `FINAL_WAYPOINT_RADIUS = 0.65`, completely eliminating offshore anchoring 3–4 tiles outside harbors.
  - Sub-Tile Snapping & Terminal Guidance: Uses `resolveValidDockPosition` to test integer-snapped coordinates and adjacent collision-free $2 \times 2$ water tiles against `portAdjacentAt()`, resolving sub-tile floating-point coordinate drift.
  - Verified `dock()` Result: Verifies `dock(dockPos) !== false` before declaring `"Fleet has safely docked"`; safely falls back to offshore anchor warning if harbor is genuinely obstructed.
  - Multi-Step 2x2 Hull Lookahead (`probeHeadingClearance`): Evaluates candidate compass headings up to 4 tiles ahead with diagonal corner-clipping checks to detect terrain before collisions occur.
  - Persistent Evasion Chirality Lock: Employs a Tangent-Bug handedness lock (`evasionChirality: -1 | 1`, 14 ticks) combined with a $180^\circ$ anti-reversal momentum penalty, permanently stopping $\pm 45^\circ$ ping-pong oscillation against headlands and islands.
  - Self-Healing Local BFS Detour (`tryInjectLocalBypassWaypoint`): Injects dynamic bounded BFS waypoints ($r \le 12$) around protruding headlands and bays when blocked, restoring forward progression autonomously.
  - Strictly Dockable Offsets (`VALID_DOCKING_OFFSETS`): Prioritizes 16 candidate offsets strictly satisfying $\Delta x \le 2, \Delta y \le 2, \Delta x + \Delta y \le 3$, guaranteeing 100% collision-free departure and docking across all 130 ports.

- [x] **Task 10.10: Java Sea & Sunda Corridor Navigation & Anti-Looping Architecture** (Completed)
  - Full-Resolution 100-Tile Macro Scanning: Eliminated micro-island blindspots in `initMacroGrid` (such as the island in cell `(154, 64)` above Sunda, which previously skipped odd coordinates and falsely classified coastal hazards as deep ocean `cellType = 1`).
  - Strict 2x2 Diagonal Corner-Clipping Prevention: Upgraded `canStep2x2` and `hasWaterLineOfSight` diagonal step validation with strict logical OR (`!clear(x+dx, y) || !clear(x, y+dy)`), ensuring flagship hulls never cut diagonally across land corners or peninsulas.
  - Boundary Portal & Corridor Bridging (`getSharedBoundaryPortal` & `findLocalCorridorPath`): Dynamic portal detection along shared cell boundaries with local A* corridor routing, creating collision-free waypoint stepping stones through complex archipelagos (Sunda Strait, Bangka Strait, and Riau Archipelago into Malacca).
  - Anti-Circling Vector Projection & Lookahead Waypoint Retirement: Replaced pure Euclidean waypoint radii with scalar projection ($t \ge 0.95$) and line-of-sight lookahead. If lateral cross-winds push the fleet past a transit waypoint or closer to the next waypoint, the obsolete waypoint is immediately retired, stopping 360-degree orbital looping and boxed circling in the Java Sea.
  - Deflection Angle Ceiling & Responsive Evasion Decaying: Clamped deflection search offsets strictly to $\le 90^\circ$ (offsets 1 and 2), eliminating 135°–180° backward loops, and immediately cleared evasion lock and chirality the instant the forward heading is clear. **[PLAYABLE MILESTONE: Unobstructed, loop-free autopilot navigation from Sunda to Pasei and Malacca through the Java Sea!]**

---

## Milestone 11: Living World — Maritime NPC Fleets & Sea Encounters (Sprint 12)
*Goal: Dynamic global regional spawning of authentic merchant convoys, pirates/corsairs, and battle fleets across all world oceans, realistic trade route navigation using the macro-grid pathfinder, live viewport sprite rendering, and interactive at-sea encounters (Hail/Parley for trade rumors, Privateering attack, and Pirate ambush).*

- [x] **Task 11.1: Global Regional Marine Ecosystem & Fleet Registry (`npcFleetData.ts` & `npcFleetManager.ts`)** (Completed)
  - Define regional fleet tables across all 8 authentic maritime basins:
    1. *Mediterranean & Black Sea*: Venetian/Genoese Galleasses, Portuguese/Spanish Caravels, Ottoman Dhows, Barbary Corsairs (Khayr ad-Din Barbarossa, Idreiss Reis).
    2. *Northern Europe & Baltic*: English War Galleons, Dutch Fluyts, Hanseatic Hoys.
    3. *West Africa & Cape Route*: Portuguese India Run Caravels/Naos, ivory/gold traders.
    4. *Caribbean & Spanish Main*: Spanish Silver Armadas, English Privateers, buccaneer sloops.
    5. *Indian Ocean & Arabian Sea*: Arab Dhows, Portuguese Malabar Armadas, Gujarati spice merchants.
    6. *Southeast Asia & Java Sea*: Sunda/Malacca spice junks, Javanese pinisi traders, Malacca Strait corsairs.
    7. *East Asia & Far East*: Ming Dynasty War Junks, Japanese Nanban trade barks, Wokou pirates.
    8. *Oceanic Deep Sea*: Long-haul exploratory expeditions and whaling vessels.
  - Fleet Archetypes:
    - **Merchant Convoys**: 1–3 vessels laden with regional commodities; peaceful, defense-only.
    - **Pirates & Corsairs**: Aggressive predators, high battle levels, armed galleons/sloops, hunting player and merchants.
    - **National Battle Fleets**: Heavily armed naval patrols enforcing territorial waters and escorting convoys.
  - Dynamic Regional Population Spawner:
    - Maintains 4–8 active NPC fleets in the player's active oceanic basin (radius ~150–200 tiles) with seamless despawn/recycle as the player voyages into new regions.
    - Dynamically synchronizes active fleets with `state.fleets` (`fleets['2']`, `fleets['3']`, etc.).

- [x] **Task 11.2: Autonomous Trade Route & Patrol AI Navigation (`npcFleetAI.ts` / `worldCharacters.ts`)** (Completed)
  - Commercial Route Guidance: Guides regional merchant fleets between authentic historical port pairs using macro-grid corridor pathfinding and vector waypoint tracking.
  - Harbor Arrival & Turnaround: Automatically detects arrival within $\le 3.5$ tiles of destination harbor, simulates commercial port calls, flips destination index ($0 \leftrightarrow 1$), and replots returning or continuing voyage.
  - Pirate & Predator AI State Machine:
    1. *Patrolling*: Prowls choke points and open sea corridors.
    2. *Pursuing*: Automatically detects player flagship within `PURSUIT_RADIUS = 18` tiles, transitions to `pursuing`, and steers directly toward player coordinates.
    3. *Abort & Recovery*: If player escapes $> 28$ tiles away (`PURSUIT_ABORT_RADIUS`), drops pursuit and resumes normal patrol.
  - Cylindrical Toroidal Seam Wrap: Vector calculations wrap seamlessly across $x = 0 \leftrightarrow 2160$, preventing infinite boundary wall-bumping.

- [x] **Task 11.3: Real-Time Viewport Rendering & Lookouts (`world.ts` & `worldCharacters.ts`)** (Completed)
  - Dynamic NPC Entity Reconciliation: `syncNpcEntities()` dynamically reconciles `state.fleets` with `characters.npcs()`, cleanly spawning and despawning `WorldNpc` ship entities without canvas reload.
  - Line of Sight Fog-of-War Integration: Renders authentic 8-directional `worldShips.png` vessel sprites, strictly respecting Fog of War line-of-sight checks (`isEntityWithinLineOfSight`) so ships remain hidden under uncharted shroud until illuminated.
  - Crow's Nest Lookout Announcements: When an NPC sail first crosses the visual horizon, triggers an audible ship's bell chime and displays a floating marine banner with relative compass bearing (e.g. *"🔭 Lookouts report: Sail sighted to the EAST! A Spanish merchant fleet."* or *"⚠️ PIRATE SIGHTED: Malacca Strait Raider bearing SOUTHWEST! Weapons ready!"*).

- [x] **Task 11.4: Interactive At-Sea Encounters — Hail, Trade Rumors & Privateering (`AtSeaEncounterModal.tsx` & `SailingHUD.tsx`)** (Completed)
  - Proximity Hailing Prompt: Automatically detects nearby NPC fleets within $\le 3.5$ tiles and renders `[💬 Hail Fleet (H)]` and `[⚔️ Attack (A)]` action controls.
  - Interactive At-Sea Parley Modal (`AtSeaEncounterModal.tsx`):
    - Displays captain portrait, flagship type, crew complement, and national allegiance flags.
    - Dialog bubble with regional rumors, historical trade trends, and market gossip.
    - **Inquire Trade Gossip**: Unlocks captain's trade secret revealing regional cargo commodities and foreign port arbitrage profit multipliers.
    - **Attack & Privateering Engagement**: Choosing "Attack" seamlessly engages the tactical hex grid arena (`BattleArena.tsx`) and sword duel engine (`SwordDuelModal.tsx`).

- [x] **Task 11.5: Pirate Ambush & Evasion Gameplay** (Completed)
  - Close-Quarters Ambush Interception: If a hostile pirate fleet closes to $\le 1.2$ tiles of the player flagship, triggers immediate combat ambush with ship's bell alarm.
  - Cargo Toss Evasion (`[💨 Toss Cargo to Evade]`): When actively pursued by corsairs, player can jettison 10 units of food or water; raiders pause to loot the floating provisions, resetting their AI state to `patrolling` and allowing player to slip away. **[PLAYABLE MILESTONE: Living ocean ecosystems with autonomous merchant trade routes, patrolling corsairs, visual lookout banners, parley dialogs, and dynamic sea combat!]**

---





