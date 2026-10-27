# Maintenance Stage 3 — complete copy for review

Updated: 2026-10-27 (Pacific)
Status: **approved Stage 3 copy preserved below.** [Stage 4](maintenance-stage-4.md) supplies 25 explicit bespoke overrides; [Stage 5](maintenance-stage-5.md) supplies two elite overrides and retires their interim on-site referrals. Original tables remain the historical snapshot. Await final network review.

Add `zzz` comments anywhere. They will be preserved verbatim, with resolutions alongside them. This document is the review source, not a sample gallery or an authorization to implement later stages.

## 1. Scope and reading key

This is the complete Stage 3 shop-copy set: every profile, facilities description, diagnosis/service/repair passage, directory summary and description, displayed shop/directory/organization name, emergency/referral string, location substitution and receiving/account mapping. Existing authored businesses are reproduced in full, not replaced by links. The **49 shared sets and 15 retained authored sets** appear once each; every site selects exactly one set below. There is no random prose pool or unspecified local variant. Stage 1’s broad planning-family labels are refined into the explicit shared sets and local variants here; scopes, service terms and referral catchments are unchanged.

Stage 3 now provides **57 basic mechanics, 90 professional workshops, Nell’s Rest as the one full-service pilot, two existing elites, and nine emergency-only locations**. Those numbers are review metadata, not player text. The 150 staffed sites include 84 new staffed facilities beyond Stage 2; 25 existing Wells fallback accounts become professional workshops. All 63 original accounts and the three pilot accounts remain. Coronal is nonselectable and excluded.

Future full-service/elite locations receive modest professional service in this stage, except the already established pilot and elite shops. Their proposed business names below can be used now, but do not grant future capabilities. Cadiz keeps its existing C-quality work until Stage 4. No new NPC names, mission contacts, shipping providers, access grants, cave mechanics or populated ruins are introduced.

**Substitution:** `{place}` is the exact physical-location display name in the first column of the location table. It is the only narrative substitution. Names and organization labels are literal values in that table, not generated from an unreviewed naming rule. `[person]…[/person]` in retained copy is existing emphasis markup; the tags themselves are not shown to players. Directory descriptions equal the selected profile unless a retained set explicitly supplies a separate description. Emergency-only entries have no diagnosis, service or repairs screen; their em dashes mean “not displayed”, not missing copy.

The stable ID tables are not player text. Shared station berths and city aliases use one shop/account and the same physical-location wording. Service is available only after legitimate local arrival; this directory does not make any receiving entrance public. The nine emergency-only sites remain unstaffed. Technical help at research cells and the lone-operator beacon uses the existing personnel, not an invented settlement or visiting mechanic company.

The unchanged numerical quote renderer, component/fault catalog, equipment catalog and transaction/error UI are outside this authoring pass: no new wording there is authorized. All shared service-entry labels and all referral/emergency wording used by this pass are reproduced in section 2. The family sections contain every shop-specific prose field those existing screens consume.

## 2. Shared interaction copy

### Shop navigation (retained)

| Use | Literal player text |
|---|---|
| Facilities heading | Facilities |
| Rate heading | Labor rate |
| Inspection action | Diagnostic Inspection |
| Service action | Service |
| Repairs action | Repairs and Replacements |
| Equipment action | Equipment |
| Exit | Back to Local Directory |
| Referral action | Where can I get more advanced work done? |
| Referral action detail | Ask for workshop directions. No inspection or fee required. |
| Referral title | WORKSHOP DIRECTIONS |
| Referral return | Back to Service Desk |
| Referral footer | Enter/Space: return |
| Shop footer | W/S or ↑↓: select   Enter/Space: choose   Esc: start menu |
| Inspection detail — pending | Full-rig inspection and written report. |
| Inspection detail — completed | Diagnostic inspection already completed. |
| Service detail — inspection required | This shop must inspect the rig before accepting service work. |
| Service detail — available, no credit | Order service by system or for all installed equipment. |
| Service detail — available, credit remaining | Order service by system or for all installed equipment. Service credit will be deducted when work is authorized. |
| Service detail — no work needed | All systems are already maintained. |
| Repairs detail — inspection required | This shop must inspect the rig before accepting repair or replacement work. |
| Repairs detail — available, no credit | Review faulted components and available work. |
| Repairs detail — available, credit remaining | Review faulted components and available work. Service credit will be deducted when work is authorized. |
| Repairs detail — no work needed | No actionable faults are present. |
| Equipment detail | Purchase and install rig equipment. |
| Exit detail | Leave the service desk. |

### Referral variants

- **R1 — normal recommendation:** For more advanced work, go to {name}.
- **R2 — additional elite recommendation:** Or, of course, you can go to {name}. They handle the most demanding work.
- **R3 — future specialist service at the current location:** For more advanced work, ask for the specialist service at {name}.

`{name}` is fully expanded in every referral row below. Each line is followed by the exact physical path printed in that row. R3 is the only new shared interaction sentence: it avoids directing someone to their current counter as though it were a different destination. It applies only to the future Rochefort and Svarog specialist services. Existing elites give no upward referral. Other shops give a primary and an elite alternative unless the primary is already elite. The network uses approved practical catchments, not measured fastest-trip claims; naming future facilities is explicitly allowed. No hidden fault diagnosis or repair guarantee is inserted into advice.

### Emergency restart (retained after the grounded-only review)

| Use | Literal player text |
|---|---|
| Action | Emergency restart |
| Enabled detail | Restore basic operation without a repair bill. |
| Disabled detail | Available only when damage grounds the rig. |
| Confirmation title | EMERGENCY RESTART |
| Confirmation paragraph 1 | Run the emergency checklist and reset damaged systems needed for basic operation. This costs no credits or work time. It preserves your installed parts. |
| Confirmation paragraph 2 | Flight clearances and atmospheric equipment requirements still apply. |
| Confirm action | Run emergency restart — free |
| Cancel action | Cancel |
| Confirmation footer | Enter/Space: choose |
| Receipt | Departure-critical systems restarted. No charge. |
| Save failure | Emergency restart could not be saved. |

The button is enabled only for actual damage-caused grounding; lesser operating restrictions do not qualify. The removed routine-maintenance disclaimer stays removed. This wording does not change the accepted minimum-HP recovery, payment, persistence or equipment rules.

## 3. Complete shared copy sets

New prose states the work each shop can do; facility capability remains governed by the reviewed terms. The Wells side-trade set is explicitly reused only at its 23 mapped House-side locations. Institutional Coimbra/Covenant sites use their separate sets. Commune, Merren, science-cell, beacon, Pandemonium and Warren exceptions are all supplied in full.

### F01 — Arkfall professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop keeps incoming tools and removed assemblies in separate, labelled trays. A technician clears a bench for your rig’s work order and checks the handling instructions before accepting any parts.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and record the findings against the rig. Any removed assembly stays with its identification tag.”

**Service:** “Choose the systems you want serviced. We’ll clean, adjust and test them, keeping the used materials with the work record.”

**Repairs:** “The estimate identifies the repair or replacement for each item. We’ll keep the assemblies separated through the job and check them before release.”

### F02 — Glitterfield professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} keeps rugged tools within easy reach and its measuring equipment behind clean covers. A fitter brushes mineral grit from a seat for you while the parts clerk lays out the day’s work slips.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “Tell us what changed on the last run. We’ll check the rig and put the findings beside the available work and parts.”

**Service:** “Dust gets into the small adjustments first. We’ll clean the working surfaces, renew their protection and set the selected systems.”

**Repairs:** “We’ll measure the worn pieces before we order the job. The estimate shows which parts we can repair and which assemblies we can exchange.”

### F03 — New Canaan Field professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** A shelf of visiting captains’ job folders faces the service counter at {place}. Behind it, tools hang in outlined spaces above a row of workbenches. The clerk finds a clear section of the schedule and opens a folder for your rig.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig and write up the options. You choose the work after you’ve seen the findings and the estimate.”

**Service:** “Select the systems and we’ll put them through cleaning, adjustment and testing. The work time is included in the estimate.”

**Repairs:** “We handle standard repairs and fitted replacements. Let’s match the proposed parts to the rig before you authorize the order.”

### F04 — Belt mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** You ask around at {place} and find a worker taking small rig jobs alongside the usual maintenance work. A portable tool case opens beside your rig; a handwritten list gives the available reclaimed assemblies.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Run me through the symptoms. I’ll check what I can reach and give you a price for the work I can do.”

**Service:** “Pick the systems. I’ll clean the contacts, work through the lubrication points and set the adjustments.”

**Repairs:** “We can do the straightforward repair or fit one of these replacement assemblies. Look over the estimate before I start.”

### F05 — Sahra professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop counter stands beside sealed cupboards of fittings and service compounds. A mechanic sets a tray of inspected seals on the bench, and the clerk offers you a work sheet with space for each system.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig, including its seals and working clearances. You’ll have the findings and an itemized estimate.”

**Service:** “Choose the systems for service. We’ll clean the working surfaces, refresh the protective compounds and check the adjustments under load.”

**Repairs:** “The work sheet lists the repair and exchange options we can offer. We’ll check the selected parts against the rig before fitting them.”

### F06 — Sahra mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a worker who maintains field equipment brings a compact tool chest to the rig. Small fittings sit in screw-top jars, and the larger reclaimed parts are listed on a folded sheet.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Show me where the trouble started. I can make the basic checks and price the work within reach of these tools.”

**Service:** “We’ll clear the dust, clean the contacts and go through the selected systems one at a time.”

**Repairs:** “I can handle a simple repair or exchange the assembly. The parts and labor are on the estimate.”

### F07 — Hartwell professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} has a broad cleaning bench between the parts counter and the service area. Removed fittings wait beneath covers while a fitter checks a finished assembly against its job sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig as it arrived, then separate the findings from the proposed work. Tell us about anything that changed during the approach.”

**Service:** “Choose the systems and we’ll work through their cleaning, lubrication and adjustments. Each serviced assembly gets its checks before release.”

**Repairs:** “The estimate covers the repair we can carry out or the replacement we can fit. We’ll record the selected parts on the job sheet.”

### F08 — Camps mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a worker agrees to look at the rig between local equipment jobs. A roll of hand tools spreads across a cleared bench; spare fittings and reclaimed modules occupy the shelf underneath.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Let’s start with what the rig was doing when the trouble appeared. I’ll make the basic checks and price the work I can handle.”

**Service:** “Choose the systems. I’ll clean them up, renew the compounds and set the straightforward adjustments.”

**Repairs:** “Simple repairs are bench work. For an exchange, we’ll match the replacement to the rig and agree the price before taking the old assembly out.”

### F09 — Pike professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop’s parts bins are indexed by assembly rather than by the company that last owned them. A fitter checks a batch of returned housings while the service clerk draws up a new job sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect your installed systems and identify the work we can offer. Previous owners’ paint does not substitute for a measurement.”

**Service:** “Choose the systems and we’ll clean, protect and adjust them. The service sheet follows the rig through each check.”

**Repairs:** “The estimate names the repair or the replacement assembly. We’ll verify fit and operation before the job is signed off.”

### F10 — Kuznia professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} assigns each rig a numbered work sheet. Fitters collect tools against the sheet and return the measured values with the completed job. A receiving clerk opens a new entry for your visit.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “The inspection follows the system list. You’ll receive the findings and the work we can complete with this workshop’s equipment.”

**Service:** “Select the systems for service. The assigned fitter will record the adjustments and the final checks on the work sheet.”

**Repairs:** “We’ll book the selected repair or assembly exchange against this order. Parts and labor are listed before authorization.”

### F11 — Kalyna professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the service counter separates the workshop’s incoming equipment from its clean parts shelves. A technician wipes down a returned tool case while the clerk lays out the rig maintenance form.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll check the installed systems and write up the findings. Any equipment we remove stays labelled with the rig’s order.”

**Service:** “Choose the systems. We’ll clean the working surfaces, renew the service protection and verify the adjustments.”

**Repairs:** “The estimate identifies the work and the replacement grade where an exchange is needed. We’ll test the fitted assembly before release.”

### F12 — Svarog professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The visiting-rig workbench at {place} faces racks of standard fittings and workshop gauges. A fitter sets aside a production drawing to look over your rig while the clerk prepares an itemized order.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll check the rig against its own specifications and list the repairs and exchanges this workshop can undertake.”

**Service:** “Select the systems. We’ll work through the service points, set the clearances and test the adjustments.”

**Repairs:** “The estimate is for the work on this rig. We’ll verify the selected assembly’s fit and grade before it leaves the parts rack.”

### F13 — Tessera professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** Clean trays of connectors and ceramic insulators line the workshop at {place}. The technician finishes checking a tool’s calibration mark, then turns a labelled work mat toward your rig’s service sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll check the installed systems and distinguish the findings from the proposed work. Each removed piece gets its own labelled space.”

**Service:** “Choose the systems and we’ll clean the interfaces, renew their protection and set the adjustments. We test each completed section.”

**Repairs:** “We can carry out the standard repair or fit the selected replacement. The estimate records the parts, their grade and the work time.”

### F14 — Acheron professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, covered instrument cases share the workshop shelves with sealed fittings and protective compounds. The service clerk checks the rig’s arrival details while a technician prepares a clean inspection bench.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig and its exposed fittings, then give you the findings and the available work options.”

**Service:** “Select the systems. We’ll clean their working surfaces, refresh the protective treatments and check the adjustments.”

**Repairs:** “The estimate sets out the repair or exchange we can perform here. We’ll verify the selected parts and test the assembly after fitting.”

### F15 — Hearth mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** A local maintenance worker at {place} agrees to inspect the rig with a portable set of tools. Small parts are sorted into reused boxes; the available replacement modules are listed separately.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Tell me what you noticed. I’ll run the basic checks and mark the work I can do with the equipment here.”

**Service:** “Choose the systems. I can clean the service points, renew the compounds and set the accessible adjustments.”

**Repairs:** “We can tackle the straightforward repair or exchange the assembly. Check the parts and labor on the estimate before you decide.”

### F16 — Balor professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} stores its measuring tools in insulated cases beside the service benches. A fitter checks a set of heat-marked couplings while the receiving clerk opens a work order for your rig.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and check the stressed fittings. The findings come with the work and replacement options available here.”

**Service:** “Choose the systems for cleaning, protective treatment and adjustment. We’ll test the finished work before returning the rig.”

**Repairs:** “The estimate lists the repair or replacement and its grade. We’ll measure the mounting points and check the assembly under load.”

### F17 — Dahai professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, labelled trays divide the workshop’s incoming fittings from its tested parts. A technician checks seals under a bright bench lamp while the service clerk sets out a fresh system checklist.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig and trace the symptoms through the installed systems. You’ll receive the findings before choosing any work.”

**Service:** “Select the systems and we’ll clean, protect and adjust them. Seal condition and electrical contacts are on the service checklist.”

**Repairs:** “We can carry out the listed standard repairs or fit the selected replacement. The estimate includes the grade and fitting time.”

### F18 — Celeste professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} keeps a clean measuring bench beside racks of standard rig assemblies. The clerk marks your place on the work board while a fitter returns a checked tool to its case.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect each installed system and set out the findings beside the available repair and exchange options.”

**Service:** “Choose the systems. We’ll renew the protective treatments, set the working clearances and test the adjustments.”

**Repairs:** “Authorize the repair or replacement shown on the estimate. We’ll check fit, alignment and operation before signing off the work.”

### F19 — Gaia professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop counter displays a clear labor schedule beside samples of standard fittings. Behind it, a technician reviews a completed job sheet with a colleague before calling you forward.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig and give you an itemized finding. You can choose the work once you’ve seen the estimate.”

**Service:** “Select the systems and we’ll book their service checks, adjustments and final tests. The estimate includes the time the rig will be here.”

**Repairs:** “The work order identifies the repair or fitted replacement. We’ll record the parts used and check the result before release.”

### F20 — Stellar skim professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the rig workshop keeps replacement fittings in sealed drawers beneath a board of system diagrams. A technician finishes checking a protective enclosure and gives your service order a fresh numbered sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig’s installed systems and write up the findings. The work options and available replacement grades are listed alongside them.”

**Service:** “Select the systems for service. We’ll clean the contacts, renew the protective treatments and test the adjustments.”

**Repairs:** “We can complete the standard work on this estimate or fit the selected assembly. Each finished job gets an operating check.”

### F21 — Barataria professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The small workshop at {place} shares its parts shelves with the station’s instrument maintenance bench. A technician moves a covered instrument aside and lays out the standard rig service sheets.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig with the workshop’s standard equipment and give you the findings and the work we can offer.”

**Service:** “Choose the systems. We’ll clean the service points, renew their protection and check the adjustments.”

**Repairs:** “The estimate covers the standard repair or replacement assembly. We’ll test the finished work before returning the rig.”

### F22 — Reach mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a worker brings over the tools used to keep the local equipment running. Reclaimed fittings are kept by size in small boxes, with a short list of larger assemblies available for exchange.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Let’s check the symptoms against what the rig is doing. I can run the basic tests and price the work within reach of these tools.”

**Service:** “Pick the systems and I’ll go through the service points, clean the contacts and set the simple adjustments.”

**Repairs:** “I can handle the straightforward repair or fit an exchange assembly. The estimate gives you the parts and the labor before we begin.”

### F23 — EDF expedition professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The visiting-rig maintenance desk at {place} sits beside the base technical section’s work board. Tools are signed out to numbered jobs, and a technician checks your rig’s particulars before assigning a service sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and return a consolidated finding. The report lists the civilian rig work this section can complete.”

**Service:** “Select the systems. The technical section will record the service work and operating checks against this job number.”

**Repairs:** “The estimate identifies the repair or replacement and the fitting time. Authorize the order and we’ll test the completed work before release.”

### F24 — Thule mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, you find a resident who takes small maintenance jobs between work for local households. A portable tool chest opens beside the rig, and a ruled notebook lists reclaimed parts and their asking prices.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Tell me what happened on the run. I’ll make the basic checks and write down the work I can do.”

**Service:** “Choose the systems. I’ll clean the service points, renew the compounds and set the adjustments.”

**Repairs:** “We can do the straightforward repair or fit the listed replacement. Look over the estimate before I take anything apart.”

### F25 — Thule professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop keeps household machinery and visiting rigs on separate work sheets. A technician clears the rig bench while the clerk sorts a small delivery of labelled replacement fittings.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and put the findings beside the work options. You choose what goes onto the order.”

**Service:** “Select the systems and we’ll work through cleaning, protection and adjustment. Each serviced assembly gets its operating checks.”

**Repairs:** “The estimate lists the repair or fitted replacement and the time required. We’ll verify the selected parts before starting.”

### F26 — Beira professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The licensed workshop at {place} has a neat row of workbenches beneath the concession’s posted terms. A journeyman checks a returned assembly while the clerk opens a numbered sheet for your rig.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll examine the installed systems and enter the findings on the work sheet. The available repairs and replacement grades follow.”

**Service:** “Select the systems for service. The responsible fitter will record the adjustments and final checks.”

**Repairs:** “The estimate identifies the work we can undertake and the parts required. We’ll inspect the completed assembly before release.”

### F27 — Wells mechanic

**Directory summary:** Ask around the hangars for unofficial repairs and parts.

**Profile:** Finding a mechanic in the Wells begins with asking the right dockhand, freight serf, or kitchen runner. A message eventually returns with a time and place. Sometimes it leads to a borrowed shed behind the proper shipyards; sometimes a mechanic pushes a tool cart directly to your rig. The serf who appears is different every time, gives no name, and carries mismatched tools whose ownership marks rarely agree. There is no Guild certificate. Replacement parts arrive wrapped in old livery, with serial plates polished smooth and provenance left out of the price.

**Facilities:** Unlicensed, low-quality frontier repairs and discreetly sourced replacement parts

**Diagnosis:** “Friend of a friend said you needed someone to look.” Today’s mechanic wears a house servant’s coat beneath stained coveralls and keeps one eye on the passage. “I’ll tell you what I find, what I can handle, and who might have the parts.”

**Service:** The mechanic lays out a collection of mismatched tools on a folded grain sack. “I’ll grease what needs grease, tighten what needs tightening, and finish before my shift-master counts heads.”

**Repairs:** “The part exists. A man I know knows the man who can get it out of stores.” The mechanic lowers his voice. “You’re paying for the part, the hands it passes through, and everyone’s silence. Once it is here, I can put it where the old one was.”

### F28 — Calatrava professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop’s bench lamps illuminate sealed gauges, cleaned valve bodies and a tidy parts ledger. A journeyman closes a pressure-test record before accepting your rig’s service sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and check the seals and working clearances. The report sets out the work we can perform here.”

**Service:** “Choose the systems. We’ll clean, protect and adjust them, then enter the final readings on the service sheet.”

**Repairs:** “We can undertake the repair or exchange shown on the estimate. The selected parts are checked before fitting and tested afterward.”

### F29 — Thronehold professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The civilian workshop at {place} keeps its labor schedule and accepted work orders in view of the receiving counter. A senior fitter reviews a set of measurements while the clerk offers you a fresh job sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig and prepare the findings with the available work options. The estimate comes before authorization.”

**Service:** “Select the systems and we’ll record their service checks, adjustments and final tests on this order.”

**Repairs:** “The job sheet specifies the repair or replacement we can complete. We’ll verify the selected parts and test the finished assembly.”

### F30 — Tinto professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the rig workshop separates its clean measuring bench from the racks of heavy fittings. The clerk sets your order beside a tray of inspected couplings while a fitter returns from the work floor.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll check the installed systems and measure the stressed fittings. You’ll receive the findings and an itemized estimate.”

**Service:** “Choose the systems. We’ll clean the service points, renew the protective treatments and set the working clearances.”

**Repairs:** “We can carry out the standard repair or fit the selected replacement. The estimate records the part grade and the fitting work.”

### F31 — Hydra professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} keeps its tools in numbered drawers and its reference diagrams behind clear covers. A technician finishes an equipment check before opening the inspection sheet for your rig.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig against its installed specifications and record the findings. The report lists the work available here.”

**Service:** “Select the systems. We’ll renew their protection, check the adjustments and document the operating tests.”

**Repairs:** “The estimate identifies the repair or replacement assembly. We’ll check its fit and operation before the job is signed off.”

### F32 — Almaden professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop’s workbenches face closed cupboards of cleaned fittings and service compounds. A fitter checks the labels on a removed assembly while the clerk opens your rig’s job record.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and check the exposed fittings. The findings and work options will be on the same report.”

**Service:** “Choose the systems for service. We’ll clean the working surfaces, renew their protection and verify the adjustments.”

**Repairs:** “The estimate lists the repair or the selected replacement. We’ll check the mounting points and test the completed assembly.”

### F33 — Cadiz professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} posts its work schedule beside a counter of sample fittings. Parts arrive against individual orders, and the clerk checks each one against the rig description before passing it to the fitters.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect your rig and write up the findings with the available work. You choose the items after reviewing the estimate.”

**Service:** “Select the systems. We’ll book their service work and record the checks and adjustments on your order.”

**Repairs:** “The estimate names the repair or replacement, its grade and its fitting time. We’ll verify the completed work before release.”

### F34 — Coimbra professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The visiting-rig bench at {place} is part of the site’s technical service area. A Daedalus technician closes an equipment ticket and opens a separate job record for your rig; tested spares are stored in labelled drawers.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and attach the findings to this job record. The available work and parts are listed separately for authorization.”

**Service:** “Select the systems and we’ll record their service checks and adjustments. The completed work stays with this rig’s job record.”

**Repairs:** “We can perform the listed standard repair or fit the selected assembly. The estimate covers the parts and the operating checks after installation.”

### F35 — Coimbra mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a site technician makes room beside the ordinary equipment maintenance bench. A portable set of rig tools and a short stock list cover the basic work available to visiting crews.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Tell me the symptoms. I’ll make the basic checks and record the work I can handle with this equipment.”

**Service:** “Choose the systems. I’ll clean the service points, renew their protection and set the straightforward adjustments.”

**Repairs:** “We can do the simple repair or exchange the assembly. The estimate lists the available parts and the fitting work.”

### F36 — Marisma professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the rig workshop keeps seals and service compounds in labelled cupboards beside the parts counter. A technician checks a temperature-marked assembly against its job sheet before turning to your order.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and check the seals and working clearances. You’ll have the findings and the available work options.”

**Service:** “Select the systems. We’ll clean, protect and adjust them, then check their operation before release.”

**Repairs:** “The estimate specifies the repair or replacement we can complete here. We’ll verify the selected assembly’s fit and grade before installation.”

### F37 — Oathmark professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The rig workshop at {place} keeps standard assemblies beside racks of measuring fixtures. A journeyman marks the result of a fitting check on the work sheet while the clerk prepares a new order for you.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the rig and measure the relevant interfaces. The findings will distinguish the work available here from the replacement options.”

**Service:** “Choose the systems and we’ll renew their protection, set the clearances and test the adjustments.”

**Repairs:** “The estimate lists the standard repair or fitted replacement. We’ll inspect the finished assembly before signing off the work.”

### F38 — Ceuta professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the workshop’s service records are kept in numbered folders beside a tidy parts ledger. A technician sets down a checked instrument while the clerk opens a folder for your rig.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and enter the findings under this job number. The work options and estimates are yours to review.”

**Service:** “Select the systems. We’ll record the service work, adjustments and operating checks in the rig’s folder.”

**Repairs:** “The estimate identifies the repair or replacement assembly. We’ll check the selected parts and enter the completed work against the order.”

### F39 — Covenant mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a maintenance hand brings the tools used for the community’s everyday machinery. A small stock of reclaimed fittings is kept beside the workbench, each item labelled with its size and price.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Tell me what needs attention. I’ll make the basic checks and show you the work I can undertake.”

**Service:** “Choose the systems. I’ll clean the service points, renew the compounds and set the simple adjustments.”

**Repairs:** “We can carry out the straightforward repair or fit the replacement on this list. The estimate gives the parts and labor before we begin.”

### F40 — Mercy professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} keeps visiting rigs on the same orderly work board as the community’s other equipment. A fitter closes a completed sheet while the receiving clerk checks your rig’s particulars.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and give you the findings with the work options. You choose the items for the order.”

**Service:** “Select the systems. We’ll clean, protect and adjust them, and record the operating checks before release.”

**Repairs:** “The estimate names the repair or replacement we can undertake. We’ll verify the selected parts and test the completed assembly.”

### F41 — Teide professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the licensed workshop’s covered parts shelves stand behind a bench of carefully sorted tools. A journeyman checks a returned fitting while the clerk enters your rig on the work schedule.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and write up the findings. The estimate lists the available repairs and replacement grades.”

**Service:** “Choose the systems for service. We’ll renew their protection, set the adjustments and record the final checks.”

**Repairs:** “The work order specifies the repair or fitted replacement. We’ll check the selected assembly against the rig before installation.”

### F42 — Vigil professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** The workshop at {place} keeps its stock list beside a narrow counter, with labelled tools and fittings filling the shelves behind it. A technician puts a completed job sheet away and opens one for your rig.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and list the work and replacement parts available here. You can review the estimate before choosing.”

**Service:** “Select the systems. We’ll clean the service points, renew their protection and test the adjustments.”

**Repairs:** “We can perform the standard repair or fit the selected assembly. The estimate includes the parts and the time for the work.”

### F43 — Field technical help

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, one of the technical staff sets aside local equipment work to look at your rig. A portable tool case and a short list of reclaimed assemblies cover the help available here.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “I can run the basic rig checks with our equipment. Tell me the symptoms and I’ll write up the work I can handle.”

**Service:** “Choose the systems. I’ll go through the accessible service points, clean the contacts and set the simple adjustments.”

**Repairs:** “We can tackle the straightforward repair or fit one of the listed replacement assemblies. Check the estimate before I start.”

### F44 — Commune mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a local maintenance worker clears a space beside the tools used for the settlement’s machinery. The rig job receives its own sheet, with available reclaimed assemblies listed against it.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “I’ll make the basic checks and enter the findings on this sheet. The work we can do here will be listed with the estimate.”

**Service:** “Choose the systems. I’ll clean the service points, renew the compounds and record the adjustments.”

**Repairs:** “We can do the straightforward repair or fit the listed assembly. The estimate records the parts and labor for your rig.”

### F45 — Merren mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a local equipment technician brings a tool case to the rig after closing a machinery work order. Reclaimed fittings are kept separately from the settlement’s controlled production supplies.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “I’ll make the basic rig checks and mark the work I can undertake. You’ll have an estimate before any repairs begin.”

**Service:** “Choose the systems. I’ll clean the service points, renew their protection and set the straightforward adjustments.”

**Repairs:** “The estimate lists the simple repair or exchange assembly. We’ll check the selected part against your rig before fitting it.”

### F46 — Pandemonium mechanic

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** At {place}, a worker clears a place beside a partly dismantled loader and brings a battered tool chest to your rig. Reclaimed fittings are counted carefully; the available assemblies and their prices fit on a short sheet.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Tell me what happened. I’ll check the rig with what we have and mark the work I can do.”

**Service:** “Choose the systems. I’ll clean the service points, work through the lubrication and set the adjustments.”

**Repairs:** “We can do the straightforward repair or fit an assembly from this list. Look over the estimate before I pull anything apart.”

### F47 — Beacon operator

**Directory summary:** Basic rig servicing, repairs and replacement parts.

**Profile:** The operator at {place} opens the station’s equipment cupboard and sets a portable tool case beside your rig. A short stock list identifies the reclaimed assemblies available for basic repair work.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “I can run the basic checks with the tools here. Tell me the symptoms and I’ll price the work I can do.”

**Service:** “Pick the systems. I’ll clean their service points, renew the compounds and set the simple adjustments.”

**Repairs:** “We can do the straightforward repair or fit the listed replacement. The parts and labor are on the estimate.”

### F48 — Warren professional

**Directory summary:** Professional rig servicing, repairs and equipment installation.

**Profile:** At {place}, the community workshop keeps its rig tools on a wall of hooks beside covered parts shelves. A fitter makes room on the bench while the clerk checks the rig against a standard service sheet.

**Facilities:** Professional servicing, standard repairs, replacement parts and equipment installation

**Diagnosis:** “We’ll inspect the installed systems and put the findings beside the available work. You choose the items after seeing the estimate.”

**Service:** “Select the systems. We’ll clean, protect and adjust them, then check their operation.”

**Repairs:** “The estimate sets out the standard repair or replacement we can fit. We’ll verify the selected assembly before starting the job.”

### F49 — Emergency self-help

**Directory summary:** Emergency recovery and directions to a workshop

**Profile:** When damage grounds the rig, use its emergency checklist to reset departure-critical systems and restore basic operation. This is a self-help procedure.

**Facilities:** Emergency recovery and directions to a workshop

**Diagnosis:** —

**Service:** —

**Repairs:** —

## 4. Retained authored businesses — full reused copy

These 15 sets keep existing names, people, prices, capabilities and wording. Character boasts are retained characterization, not new capability promises. The three Weymark pilot businesses are included here. The Cadiz upgrade remains outside this stage.

### L01 — Bruckner Central Service Hall

**Directory summary:** Advanced VHM-authorized precision service and civilian parts depot.

**Directory description:** Bruckner’s central Estella service floor is bright, quiet, and divided into numbered clean bays. VHM-certified diagnostic frames stand beside locked civilian parts cages and a glass-fronted warranty office. Depot Service Director Anja Riedel runs the floor by headset; every removed component is tagged before it touches a cart.

**Profile:** Bruckner’s central Estella service floor is bright, quiet, and divided into numbered clean bays. VHM-certified diagnostic frames stand beside locked civilian parts cages and a glass-fronted warranty office. Depot Service Director [person]Anja Riedel[/person] runs the floor by headset; every removed component is tagged before it touches a cart.

**Facilities:** Advanced VHM-authorized precision service and civilian parts depot

**Diagnosis:** “Put the rig on cradle four and leave the flight recorder live, Teamster. Weymark’s latest-generation diagnostic frames are operated by Bruckner’s senior VHM-certified engineers.” [person]Anja Riedel[/person] checks the custody seal on the diagnostic terminal. “You’ll receive a complete finding, the applicable warranty status, and the available work options. In that order.”

**Service:** “Preventive service is cheaper than an incident board, and considerably shorter. We’ll bring the selected systems to Bruckner service standard and return every recorded adjustment with the rig.”

**Repairs:** “You have already brought it to the best-equipped civilian service depot in Estella, Teamster. The certified alignment frames, sealed test benches, and VHM tooling are here at Weymark. If the component can be returned to specification, we have the equipment to do it. If it cannot, we will fit the proper replacement.”

### L02 — Look for a local mechanic

**Directory summary:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Directory description:** A notice beside Low Gauge’s shift board lists workers who take repair jobs between mine assignments. Today, a mechanic meets you at the rig with a tool chest strapped to a hand trolley. Spare couplings and reclaimed modules occupy the shelves of a borrowed pressure shed.

**Profile:** A notice beside Low Gauge’s shift board lists workers who take repair jobs between mine assignments. Today, a mechanic meets you at the rig with a tool chest strapped to a hand trolley. Spare couplings and reclaimed modules occupy the shelves of a borrowed pressure shed.

**Facilities:** Basic servicing, straightforward repairs and reclaimed replacement parts

**Diagnosis:** “Let’s run the checks while the rig is warm. I’ll mark what needs attention and price the work I can do with the tools here.”

**Service:** The mechanic unfolds a stained service sheet against the wheel of the trolley. “We’ll work through the lubrication points, clean the contacts and set the easy adjustments. Choose the systems you want covered.”

**Repairs:** “Bring the estimate over to the shed. We’ll check the available parts against your rig before you authorize anything.” The mechanic clears a space on the bench for the removed assembly.

### L03 — Nell’s Rest Shipworks

**Directory summary:** Full-service engineering, advanced repairs and quality equipment installations

**Directory description:** A workboat hangs in an open assembly frame above Nell’s Rest’s service floor. Beneath it, visiting rigs occupy bright bays connected to a common machine shop. Forewoman [person]Mara Venn[/person] meets you at a wall covered with silhouettes of assemblies waiting for machining, testing or collection.

**Profile:** A workboat hangs in an open assembly frame above Nell’s Rest’s service floor. Beneath it, visiting rigs occupy bright bays connected to a common machine shop. Forewoman [person]Mara Venn[/person] meets you at a wall covered with silhouettes of assemblies waiting for machining, testing or collection.

**Facilities:** Full-service engineering, advanced repairs and quality equipment installations

**Diagnosis:** “Give us the symptoms and we’ll test the affected assemblies under load.” [person]Mara[/person] moves a magnetic rig marker onto the inspection board. “The report will distinguish the repairs we can finish here from work needing the depot’s specialist tooling.”

**Service:** “Our machinists and fitters share one schedule, so your rig moves through the work in sequence.” [person]Mara[/person] traces the open bays with a fingertip. “Choose the systems and we’ll return them adjusted, tested and signed off.”

**Repairs:** “We can rebuild and align most assemblies on that rig, or fit the replacement you select.” [person]Mara[/person] calls a fitter over to review the estimate with you. “The toughest structural and core work goes to Bruckner’s specialist floor.”

### L04 — Weymark Town Workshop

**Directory summary:** Professional routine servicing, standard repairs and equipment installation

**Directory description:** Weymark Town’s workshop occupies two pressure bays beside the vocational classrooms. Numbered parts bins line the walls, and the afternoon instructor is checking a trainee’s work against a signed job sheet. A service clerk opens a fresh sheet for your rig.

**Profile:** Weymark Town’s workshop occupies two pressure bays beside the vocational classrooms. Numbered parts bins line the walls, and the afternoon instructor is checking a trainee’s work against a signed job sheet. A service clerk opens a fresh sheet for your rig.

**Facilities:** Professional routine servicing, standard repairs and equipment installation

**Diagnosis:** “We’ll run the standard inspection and separate the findings from the work order. You can review every item before choosing what to authorize.”

**Service:** The service clerk clips your selections to the bay schedule. “Each system gets its checks, adjustments and final sign-off. The estimate includes the time the rig will be here.”

**Repairs:** “The workshop handles ordinary repairs and standard module exchanges.” The instructor sets the approved parts list beside the job sheet. “We’ll identify anything that needs a specialist before starting.”

### L05 — Red Dust Mechanical & Reclamation

**Directory summary:** Family maintenance shop

**Directory description:** Red Dust Mechanical & Reclamation occupies Concord’s former contractor motor pool, with four enclosed service bays and a crowded reclaimed-parts warehouse. Abraham “Honest Abe” Calder staffs the enterprise entirely with his sons, in-laws, cousins, and whichever other relatives need work that season. Estimates are discussed around the family table in the office, while Gasket, the Calder family dog, sleeps underneath and wakes for every arriving rig.

**Profile:** Red Dust Mechanical & Reclamation occupies Concord’s former contractor motor pool, with four enclosed service bays and a crowded reclaimed-parts warehouse. [person]Abraham “Honest Abe” Calder[/person] staffs the enterprise entirely with his sons, in-laws, cousins, and whichever other relatives need work that season. Estimates are discussed around the family table in the office, while Gasket, the Calder family dog, sleeps underneath and wakes for every arriving rig.

**Facilities:** Notorious mechanical and reclaimed-parts shop that keeps regaining and again losing the Guild certification

**Diagnosis:** “Set her over the pit and come inside, Teamster. My daughter-in-law Marta has stew on, and nobody studies a repair estimate properly on an empty stomach.” [person]Abraham “Honest Abe” Calder[/person] ushers you toward the family table while his sons-in-law set the scanner beneath the rig. He beckons one of them over with a curl of one finger. “By the time we’ve eaten, young Eli here will have found everything worth discussing.”

**Service:** “Service only?” [person]Abe[/person]’s smile dims by exactly one degree. “Certainly. The boys will clear the dust, refresh the compounds, tighten the mounts, and give the finish a proper polish.” He glances toward the closed panels. “The deeper concerns will keep until you’re ready to give them the attention they deserve.”

**Repairs:** “Excellent. The Calders believe serious work deserves a full turnout.” Beyond the office glass, [person]Abe[/person]’s sons, in-laws, and cousins line up beside loaded tool carts, waiting for the authorization light. Gasket sits at the front with a rag in his mouth. “Sign the order, Teamster, and the whole family goes to work.”

### L06 — Vilar’s Outfitter at Gryphon Aerie

**Directory summary:** House Vilar network outfitter.

**Directory description:** A gilt House Vilar badge spans the entrance to a glass-fronted service gallery high in Gryphon Aerie. Sir Tomás Barreto governs the concession from a balcony above the bays, welcoming Teamsters with courtly warmth while licensed journeymen drive rows of serf mechanics through the work below.

**Profile:** A gilt House Vilar badge spans the entrance to a glass-fronted service gallery high in Gryphon Aerie. [person]Sir Tomás Barreto[/person] governs the concession from a balcony above the bays, welcoming Teamsters with courtly warmth while licensed journeymen drive rows of serf mechanics through the work below.

**Facilities:** Standard Wells outfitter in [person]Baron Vilar[/person]’s chartered network

**Diagnosis:** “Welcome, Teamster! Entrust your rig to House Vilar and I shall see it examined from frame to antenna.” [person]Sir Tomás Barreto[/person] turns and shouts down the gallery. “Inspection cradle three! Move, you witless sluggards—the rig will not inspect itself!” He turns back with a broad smile. “Your rig shall receive my personal attention.”

**Service:** “A prudent choice, Teamster! My people shall restore every serviceable fitting to mint condition.” [person]Sir Tomás Barreto[/person] snaps his fingers toward the bays. “What are you gawping at? Get to work!” He faces you again. “House Vilar takes uncommon pride in the care of a working rig.”

**Repairs:** “Ah, the serious work—the kind that proves the value of a proper shop. House Vilar shall return your rig sound, aligned, and fit for the road ahead.” [person]Sir Tomás Barreto[/person] calls down to the bays. “Fetch the proper tools, not whatever rubbish you abandoned under a bench!” He offers you an expansive bow. “We shall put matters right.”

### L07 — Vilar’s Outfitter at Herald Gate

**Directory summary:** House Vilar network outfitter.

**Directory description:** The crimson-and-gold badge of House Vilar hangs above a vaulted service gallery built into Herald Gate’s commercial ring. Baron Estêvão Vilar’s local concession is governed by Dame Leonor Falcão, a knight-overseer whose immaculate licensed journeymen direct rows of grey-clad serf mechanics below.

**Profile:** The crimson-and-gold badge of House Vilar hangs above a vaulted service gallery built into Herald Gate’s commercial ring. [person]Baron Estêvão Vilar[/person]’s local concession is governed by [person]Dame Leonor Falcão[/person], a knight-overseer whose immaculate licensed journeymen direct rows of grey-clad serf mechanics below.

**Facilities:** Standard Wells outfitter in [person]Baron Vilar[/person]’s chartered network

**Diagnosis:** “House Vilar welcomes you to Herald Gate, Teamster. I am [person]Dame Leonor Falcão[/person], and nothing beneath this roof escapes a proper accounting.” (She glances down into the service gallery.) “That scanner is three degrees out. Correct it before I decide your eyes are ornamental.” (Her attention returns to you.) “Your rig shall be examined with considerably greater care.”

**Service:** “A working rig deserves to leave my gallery looking newly issued. House Vilar shall see every serviceable fitting restored accordingly.” ([person]Dame Leonor[/person] taps the gallery rail with one gloved finger.) “Must I explain the purpose of a tool cart, or will someone bring it before the Teamster dies of age?” (She offers you a composed smile.) “They become remarkably efficient under proper supervision.”

**Repairs:** “Damage is distasteful, but never embarrassing when placed in competent hands. We shall return your rig to honorable service.” ([person]Dame Leonor[/person] looks down toward the bays.) “If I see that component struck with a hammer, the next object fitted to the test stand will be the mechanic.” (She inclines her head to you.) “Do not be concerned, Teamster. My people understand the cost of disappointing me.”

### L08 — Vilar’s Outfitter at Cadiz Highport

**Directory summary:** House Vilar flagship outfitter.

**Directory description:** Vilar’s Outfitter at Cadiz Highport occupies a full commercial pier: six numbered service bays, a two-level parts warehouse, and an executive gallery hung with expansion plans beside a purchased baronial crest. Baron Estêvão Vilar built the chain before buying the title with its proceeds, and still walks the floor with a founder’s eye for idle hands, slow inventory, and missed opportunity.

**Profile:** Vilar’s Outfitter at Cadiz Highport occupies a full commercial pier: six numbered service bays, a two-level parts warehouse, and an executive gallery hung with expansion plans beside a purchased baronial crest. [person]Baron Estêvão Vilar[/person] built the chain before buying the title with its proceeds, and still walks the floor with a founder’s eye for idle hands, slow inventory, and missed opportunity.

**Facilities:** House Vilar flagship outfitter and regional service works

**Diagnosis:** “Every idle hour belongs on somebody’s ledger.” [person]Baron Estêvão Vilar[/person] studies the arriving rig from the gallery rail. “My senior diagnosticians will give you the finding, the available parts, and the work order. While they work, tell me what you’ve heard from the Hearth. Which firms are expanding? Who has found new capital? What are the serious people buying?”

**Service:** “Service protects earning time. That is the whole proposition.” [person]Baron Estêvão Vilar[/person] taps the work schedule on his tablet. “I recruited journeymen with the highest credentials and certifications I could find in the Camps and the Belt. Select the systems, and my floor will document every adjustment and turn your rig back toward revenue.”

**Repairs:** “Teamster, you have my sincere sympathy. A damaged rig is lost earning time, and that is painful to see.” [person]Baron Estêvão Vilar[/person] straightens his coat and attempts the brisk, polished cadence he associates with Hearth boardrooms. “Still, this is a business opportunity for both of us. You need the rig restored; I have the most modern tools anywhere beyond the Belt and the people certified to use them. Authorize the order, and we both improve our position.”

### L09 — The Armorial Shipwrights at Shipwright Keep

**Directory summary:** Heraldic repair court and noble outfitter.

**Directory description:** The Armorial Shipwrights occupy the inner ward of Shipwright Keep, where vaulted service bays open beneath painted shields and long rolls of honored craftsmen. Journeymen wear immaculate house livery over their work clothes, apprentices carry silver-edged tool cases, and young squires occasionally complete a shipyard rotation under the masters. The carpets stop precisely at the painted bay line. The shop’s Teamsters’ Guild certification is an actual parchment displayed behind crystal, its heavy red wax seal resting in a velvet-lined mount. Sir Afonso de Lacerda, Keeper of the Shipyard Seal, presides over the work.

**Profile:** The Armorial Shipwrights occupy the inner ward of Shipwright Keep, where vaulted service bays open beneath painted shields and long rolls of honored craftsmen. Journeymen wear immaculate house livery over their work clothes, apprentices carry silver-edged tool cases, and young squires occasionally complete a shipyard rotation under the masters. The carpets stop precisely at the painted bay line. The shop’s Teamsters’ Guild certification is an actual parchment displayed behind crystal, its heavy red wax seal resting in a velvet-lined mount. [person]Sir Afonso de Lacerda[/person], Keeper of the Shipyard Seal, presides over the work.

**Facilities:** Ancient armorial repair court, rumored to offer ordinary workmanship with twice the ceremony

**Diagnosis:** “Before a tool touches your rig, its condition will be entered in the shipyard book and properly witnessed.” [person]Sir Afonso de Lacerda[/person] gestures toward the framed parchment. “Our Guild certification bears wax because an oath deserves a physical seal. You will receive the finding beneath the arms of Shipwright Keep.”

**Service:** “Maintenance is stewardship, and stewardship is among the oldest duties of rank.” [person]Sir Afonso de Lacerda[/person] surveys the assembled craftsmen. “Two journeymen will oversee each selected system. [person]Young Dom Rui[/person] is completing his shipyard rotation this month; if a squire’s hand assists the work, a master’s eye will follow it. Our cadenced keel will mark every completed adjustment.”

**Repairs:** “Damage shall be corrected with the ceremony due to a working rig.” [person]Sir Afonso de Lacerda[/person] selects a small heraldic punch from its fitted case. “When the repair passes inspection, the responsible journeyman will strike his device beside the crowned keel of this court. Those marks are our lineage, our warranty, and our answer to anyone who questions the work.”

### L10 — Vilar’s Outfitter at Hydra Maw Orbital

**Directory summary:** House Vilar industrial outfitter.

**Directory description:** House Vilar’s Hydra Maw concession occupies an armored service gallery between the skim tenders and the station’s pressure refuge. Dame Inês Moura, a former gas-skimmer chief, runs the bays like a flight deck: sealed carts, clipped commands, exact turnaround boards, and journeymen trained to hear a pressure leak through the machinery.

**Profile:** House Vilar’s Hydra Maw concession occupies an armored service gallery between the skim tenders and the station’s pressure refuge. [person]Dame Inês Moura[/person], a former gas-skimmer chief, runs the bays like a flight deck: sealed carts, clipped commands, exact turnaround boards, and journeymen trained to hear a pressure leak through the machinery.

**Facilities:** Standard Wells outfitter for industrial and skim traffic

**Diagnosis:** “Pressure board is steady. Put the rig in bay two and leave the access panels closed until my people mark them.” [person]Dame Inês Moura[/person] watches the station gauges settle. “Hydra punishes guesses. My senior journeymen will trace each load path, pressure-test the sealed systems, and give you a finding you can act on.”

**Service:** “Preventive work buys margin when the well and weather both turn against you.” [person]Dame Inês Moura[/person] checks the maintenance board. “We’ll service the selected systems to Vilar standard and return the adjustment record with the rig.”

**Repairs:** “Parts team forward. Clear the main lift.” [person]Dame Inês Moura[/person] studies the next quiet band in Hydra’s weather. “I have a disciplined floor and a clean work plan. Authorize it, and we’ll put the rig back together properly.”

### L11 — Vilar’s Outfitter at Macao Palace

**Directory summary:** House Vilar palace outfitter.

**Directory description:** The Macao Palace concession resembles a private gaming salon built around a spotless service floor. Sir Gaspar Seixas receives Teamsters beneath lacquered House Vilar screens while mechanics, parts clerks, debt advocates, and contract brokers move through the galleries at signals from his jeweled hand. He remembers every patron’s wagers, obligations, and preferred manner of being addressed.

**Profile:** The Macao Palace concession resembles a private gaming salon built around a spotless service floor. [person]Sir Gaspar Seixas[/person] receives Teamsters beneath lacquered House Vilar screens while mechanics, parts clerks, debt advocates, and contract brokers move through the galleries at signals from his jeweled hand. He remembers every patron’s wagers, obligations, and preferred manner of being addressed.

**Facilities:** Standard Wells outfitter for palace and contract traffic

**Diagnosis:** “Every machine tells the truth once the right questions are asked.” [person]Sir Gaspar Seixas[/person] beckons his chief diagnostician forward as though opening a private table. “My people will turn the cards faceup one system at a time. You shall have the finding, the available options, and the exact stakes.”

**Service:** “The favorable wager is the one settled before the odds move.” [person]Sir Gaspar Seixas[/person] presents the service options with a practiced sweep of his hand. “Preserve the rig’s margin now, and leave Macao with the advantage.”

**Repairs:** “The table is set: trained hands, proper tooling, and the required parts behind the cage.” [person]Sir Gaspar Seixas[/person] inclines his head toward the authorization terminal. “Place the order, Teamster, and House Vilar will play it through to completion.”

### L12 — The Seconds Gate at Keelwright Works

**Directory summary:** Rapid factory service and proofed production-overrun components.

**Directory description:** The Seconds Gate occupies a receiving hall beside Keelwright Works’ final proofing floor. Its tall racks hold pristine drive housings in rival House colors, frame members with obsolete crests milled away, and actuator sets marked thirteen of twelve. Every component carries a production pedigree and a visible proof stamp. At each shift bell, carts, crews, and visiting rigs advance together through the exchange line under Proofmaster Tomé Avelar’s ear.

**Profile:** The Seconds Gate occupies a receiving hall beside Keelwright Works’ final proofing floor. Its tall racks hold pristine drive housings in rival House colors, frame members with obsolete crests milled away, and actuator sets marked thirteen of twelve. Every component carries a production pedigree and a visible proof stamp. At each shift bell, carts, crews, and visiting rigs advance together through the exchange line under [person]Proofmaster Tomé Avelar[/person]’s ear.

**Facilities:** Rapid factory exchange using proofed production overruns and cosmetic seconds

**Diagnosis:** “Bring the rig beneath proof frame six.” [person]Proofmaster Tomé Avelar[/person] raises one hand, and a single bell stroke moves three inspection crews into position. “We will load the structure, run the machinery at works tolerance, and test the controls against production references. One hour. Then you’ll know what holds, what can be machined here, and which proofed exchange assemblies fit.”

**Service:** “Keelwright builds by rhythm, and maintenance belongs in the same rhythm.” [person]Tomé Avelar[/person] sounds a short sequence on the shift bell. Tool carts turn, acceptance benches open, and the service hands take their stations. “Select the systems. The line will renew protection, set clearances, and run each assembly across its acceptance bench before the next bell.”

**Repairs:** “Every part in this hall passed proof. It is here because a lord changed his crest, a contract ordered twelve and the line made thirteen, or a polishing gauge offended somebody with a title.” [person]Tomé Avelar[/person] taps the visible acceptance stamp. “Metal does not become weaker because a herald changed his mind. Authorize the work. Certified repairs go to the machinists, exchanges come straight from the proof racks, and your rig leaves on this shift.”

### L13 — The High Pennant Shipyard at Oathmark Academy

**Directory summary:** Discreet private-vessel maintenance under Oathmark Academy protocol.

**Directory description:** The High Pennant Shipyard receives clients in a silent salon of dark wood, pale stone, and smoked privacy glass. Its production floor lies beyond layered pressure bulkheads and acoustic isolation; tools, crews, machinery, and unfinished vessels remain entirely outside the reception experience. Dames Margarida and Madalena de Sá operate the shipyard from matching desks in matching ivory uniforms. Their badges both read M. DE SÁ, and neither sister volunteers which name belongs to which woman.

**Profile:** The High Pennant Shipyard receives clients in a silent salon of dark wood, pale stone, and smoked privacy glass. Its production floor lies beyond layered pressure bulkheads and acoustic isolation; tools, crews, machinery, and unfinished vessels remain entirely outside the reception experience. [person]Dames Margarida and Madalena de Sá[/person] operate the shipyard from matching desks in matching ivory uniforms. Their badges both read M. DE SÁ, and neither sister volunteers which name belongs to which woman.

**Facilities:** Standard maintenance with private-yacht discretion, ceremonial scheduling, and noble-client pricing

**Diagnosis:** “A working rig among the pleasure craft. How refreshing.” One of [person]the de Sá twins[/person] accepts the authorization while her sister seals the salon display. “The production floor will inspect every installed system under Academy protocol.” They exchange desks while the appointment clerk looks down. “Three hours. Your findings will return in a sealed folio.” Neither woman offers a name.

**Service:** “Service may proceed.” The twin seated on the left reviews the selected systems while her sister closes the privacy screen. By the time the screen seals, they have exchanged chairs. “The rig will pass behind the bulkhead. Each selected system will be maintained, tested, and presented at reception after the floor has been cleared.”

**Repairs:** “The work order is settled.” One twin closes the folio while the other signs it in an identical hand: M. de Sá. “Our floor will complete every authorized repair to Academy standard and fit production-grade parts wherever replacement is required. Your rig will return through the presentation lock cleaned, sealed, and ready to depart.” Neither signature clarifies which sister authorized the work.

### L14 — Serrat Domain Civil Refit Office

**Directory summary:** High-capability civilian diagnostics, repair, and refit.

**Directory description:** The Civil Refit Office occupies a line of enclosed rig bays along Serrat Domain Shipyard’s inner service spine. Overhead carriers move drive cores, pressure sections, and frame members between calibrated lift frames, machine shops, and sealed test rooms. Master Shipwright Beatriz Correia commands the civilian watch from the main dock board, assigning visiting craft among the shipyard’s structures, machinery, and electrical teams.

**Profile:** The Civil Refit Office occupies a line of enclosed rig bays along Serrat Domain Shipyard’s inner service spine. Overhead carriers move drive cores, pressure sections, and frame members between calibrated lift frames, machine shops, and sealed test rooms. [person]Master Shipwright Beatriz Correia[/person] commands the civilian watch from the main dock board, assigning visiting craft among the shipyard’s structures, machinery, and electrical teams.

**Facilities:** Domain shipyard diagnostics and full-complexity civilian repair

**Diagnosis:** “Bring the rig onto line seven and give my surveyors clear access from the cargo spine forward.” [person]Master Shipwright Beatriz Correia[/person] marks three teams onto the dock board. “Structures, machinery, and controls will inspect in parallel. You’ll receive one consolidated finding, the work we can certify here, and the available replacement grades.”

**Service:** “Service work takes the same discipline as a major refit. The machine only cares whether the measurement is right.” [person]Beatriz Correia[/person] studies the selected systems. “My watch will renew the protective treatments, align the moving gear, test every adjusted circuit under load, and release the rig when each value holds.”

**Repairs:** “Your rig is compact enough to finish in one bay and important enough to finish correctly.” [person]Beatriz Correia[/person] opens the work packages across the dock board. “Shipyard welders, machinists, electronics hands, and alignment crews are on this watch. Authorize the order, and the same people who build these systems will return yours to specification.”

### L15 — Vilar’s Outfitter at Manticore Observatory

**Directory summary:** House Vilar outer-Wells outfitter.

**Directory description:** The gilt Vilar badge hangs at the entrance where the commercial charter requires it. Inside, the older silver-and-black arms of House Noronha dominate two warm, meticulously ordered service bays beneath Manticore Observatory’s long-watch decks. Sir Lourenço Noronha accepted command of the concession without conceding social equality to its proprietor. His lineage is older and more renowned than Baron Vilar’s purchased title, a distinction he introduces before business has properly begun.

**Profile:** The gilt Vilar badge hangs at the entrance where the commercial charter requires it. Inside, the older silver-and-black arms of House Noronha dominate two warm, meticulously ordered service bays beneath Manticore Observatory’s long-watch decks. [person]Sir Lourenço Noronha[/person] accepted command of the concession without conceding social equality to its proprietor. His lineage is older and more renowned than [person]Baron Vilar[/person]’s purchased title, a distinction he introduces before business has properly begun.

**Facilities:** Standard outer-Wells outfitter under knightly supervision

**Diagnosis:** “House Noronha bore arms before [person]Baron Vilar[/person] learned what one cost.” [person]Sir Lourenço Noronha[/person] regards you with austere patience. “The distinction will mean little to a Teamster of common birth. What should matter to you is that my honor stands behind this inspection. Every finding will be complete, exact, and properly witnessed.”

**Service:** “Maintenance is stewardship: the preservation of what has been entrusted to one’s care.” [person]Sir Lourenço Noronha[/person] surveys the waiting journeymen. “It is a principle old houses learn early. My people will service the selected systems under my eye, and every adjustment will satisfy the obligations of my name.”

**Repairs:** “Damage is a regrettable disorder, Teamster, but its correction is honorable work.” [person]Sir Lourenço Noronha[/person] rests one hand upon the silver tower worked into his coat. “Though this concession bears [person]Baron Vilar[/person]’s freshly gilded name, my own honor governs the floor. Authorize the work. It will be completed to an excellent standard, as befits the supervision of a noble knight.”

## 5. Every physical location — names, substitutions and copy assignment

Each row’s location name is the exact `{place}` value, including apostrophes. A blank organization is shown as an em dash. “Unchanged” terms retain the existing business’s commercial values; S0, W0, S1 and E0 refer to the reviewed specification. Internal class numbers never enter displayed copy. All descriptions and summaries come from the selected full set above. A separate directory name is listed where it differs from the shop name.

| Physical location / ID | Shop name | Directory name | Organization | Copy set | Internal class / terms |
|---|---|---|---|---|---|
| Apocrypha Cache<br>`arkfall-apocrypha-cache` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| Ark Quarantine Station<br>`ark-quarantine-station` | Ark Quarantine Station Workshop | Ark Quarantine Station Workshop | Ark Quarantine Station Workshop | F01 | 1 / S1 |
| Cupola Station<br>`industrial-refinery-asteroid-es-m-0002` | Halloran Rig Service | Halloran Rig Service | Halloran Rig Service | F02 | 1 / S1 |
| Deepcut Depot<br>`glitterfield-deepcut` | Deepcut Depot Workshop | Deepcut Depot Workshop | Deepcut Depot Workshop | F02 | 1 / S1 |
| Grubstake Depot<br>`glitterfield-grubstake` | Grubstake Depot Workshop | Grubstake Depot Workshop | Grubstake Depot Workshop | F02 | 1 / S1 |
| Highgrade Depot<br>`glitterfield-highgrade` | Highgrade Depot Workshop | Highgrade Depot Workshop | Highgrade Depot Workshop | F02 | 1 / S1 |
| Slagfoot Depot<br>`glitterfield-slagfoot` | Slagfoot Depot Workshop | Slagfoot Depot Workshop | Slagfoot Depot Workshop | F02 | 1 / S1 |
| Harlan's Station<br>`harlans-station` | Harlan's Station Workshop | Harlan's Station Workshop | Harlan's Station Workshop | F03 | 1 / S1 |
| Mercer's Claim<br>`mercers-claim` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F04 | 0 / S0 |
| The Caravanserai<br>`caravanserai` | Caravanserai Drydock Service | Caravanserai Drydock Service | Caravanserai Drydock Service | F03 | 1 / S1 |
| The Still<br>`the-still` | The Still Workshop | The Still Workshop | The Still Workshop | F03 | 1 / S1 |
| Bir Safa<br>`estella-ix-ice-mine` | Bir Safa Service House | Bir Safa Service House | Bir Safa Service House | F05 | 1 / S1 |
| Multaqa<br>`estella-ix-research-base` | Multaqa Workshop | Multaqa Workshop | Multaqa Workshop | F05 | 1 / S1 |
| Raqib<br>`estella-ix-captured-moonlet` | Ask for local technical help | Ask for local technical help | Local technical staff | F43 | 0 / S0 |
| Suhail Anchorage<br>`estella-ix-supply-depot` | Suhail Anchorage Workshop | Suhail Anchorage Workshop | Suhail Anchorage Workshop | F05 | 1 / S1 |
| Wadi al-Layl<br>`estella-ix-geological-feature` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F06 | 0 / S0 |
| Bruckner Weymark Depot<br>`estella-viii-high-station` | Bruckner Central Service Hall | Bruckner Central Service Hall | Bruckner Field Services | L01 | 3 / unchanged |
| Low Gauge Mine<br>`estella-viii-mining-site` | Look for a local mechanic | Look for a local mechanic | Low Gauge independent mechanics | L02 | 0 / unchanged |
| Nell's Lantern<br>`estella-viii-captured-moonlet` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| Nell's Rest<br>`estella-viii-friendly-station` | Nell’s Rest Shipworks | Nell’s Rest Shipworks | Nell’s Rest Shipworks | L03 | 2 / unchanged |
| Old Survey Camp<br>`estella-viii-abandoned-site` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| Weymark Town<br>`estella-viii-settlement` | Weymark Town Workshop | Weymark Town Workshop | Weymark Town Workshop | L04 | 1 / unchanged |
| Ascension Scaffold<br>`estella-v-orbital-factory` | Ascension Scaffold Workshop | Ascension Scaffold Workshop | Ascension Scaffold Workshop | F07 | 1 / S1 |
| Cinderhook Refinery<br>`estella-v-atmo-refinery` | Cinderhook Refinery Workshop | Cinderhook Refinery Workshop | Cinderhook Refinery Workshop | F07 | 1 / S1 |
| Concord<br>`estella-v-capital-settlement` | Red Dust Mechanical & Reclamation | Red Dust Mechanical & Reclamation | Red Dust Mechanical & Reclamation | L05 | 0 / unchanged |
| Dawes Cut<br>`estella-v-open-cast-mine` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F08 | 0 / S0 |
| First Landing<br>`estella-v-abandoned-colony` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| Gale Survey<br>`estella-v-storm-research` | Ask for local technical help | Ask for local technical help | Local technical staff | F43 | 0 / S0 |
| Flint Mine<br>`estella-va-strip-mine` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F08 | 0 / S0 |
| Pike Depot<br>`estella-va-ore-depot` | Pike Depot Workshop | Pike Depot Workshop | Pike Depot Workshop | F09 | 1 / S1 |
| Switchback<br>`estella-va-miner-hab` | Switchback Service Hall | Switchback Service Hall | Switchback Service Hall | F09 | 1 / S1 |
| Roadstead Station<br>`estella-v-transit-station` | Roadstead Rig Works | Roadstead Rig Works | Roadstead Rig Works | F07 | 1 / S1 |
| Anvil Station<br>`estella-vi-main-dispatch` | Anvil Visiting-Rig Works | Anvil Visiting-Rig Works | Anvil Visiting-Rig Works | F10 | 1 / S1 |
| Gornilo Crucible<br>`estella-vi-foundry-complex` | Gornilo Crucible Workshop | Gornilo Crucible Workshop | Gornilo Crucible Workshop | F10 | 1 / S1 |
| Hammer Station<br>`estella-vi-heavy-cargo-dispatch` | Hammer Station Workshop | Hammer Station Workshop | Hammer Station Workshop | F10 | 1 / S1 |
| Dnipro Pools<br>`estella-vib-aquaculture` | Ask for a maintenance hand | Ask for a maintenance hand | Local maintenance workers | F45 | 0 / S0 |
| Kalyna Orbital<br>`estella-vib-cold-chain-transit` | Kalyna Port Engineering | Kalyna Port Engineering | Kalyna Port Engineering | F11 | 1 / S1 |
| Teteriv Broiler Farm<br>`estella-vib-vat-protein` | Ask for a maintenance hand | Ask for a maintenance hand | Local maintenance workers | F45 | 0 / S0 |
| Zhitomir Hydroponics<br>`estella-vib-pharma-horticulture` | Ask for a maintenance hand | Ask for a maintenance hand | Local maintenance workers | F45 | 0 / S0 |
| Kopanka Mine<br>`estella-vi-mountain-mining` | Ask for a maintenance hand | Ask for a maintenance hand | Local maintenance workers | F44 | 0 / S0 |
| Mokosh Lowlands<br>`estella-vi-agricultural-lowlands` | Ask for a maintenance hand | Ask for a maintenance hand | Local maintenance workers | F44 | 0 / S0 |
| Morana Station<br>`estella-vi-polar-weather-research` | Ask for local technical help | Ask for local technical help | Local technical staff | F43 | 0 / S0 |
| Perun City<br>`estella-vi-industrial-city` | Perun Rig Workshop | Perun Rig Workshop | Perun Rig Workshop | F10 | 1 / S1 |
| Port Stribog<br>`estella-vi-spaceport` | Port Stribog Workshop | Port Stribog Workshop | Port Stribog Workshop | F10 | 1 / S1 |
| Anchorhold<br>`estella-via-surface-anchor` | Anchorhold Workshop | Anchorhold Workshop | Anchorhold Workshop | F12 | 1 / S1 |
| Black Vein Mine<br>`estella-via-rare-alloy-extraction` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F08 | 0 / S0 |
| Svarog Shipyard<br>`estella-via-drydock` | Svarog Visiting-Rig Service | Svarog Visiting-Rig Service | Svarog Visiting-Rig Service | F12 | 1 / S1 |
| Veles Terminal<br>`estella-via-component-supply` | Veles Terminal Workshop | Veles Terminal Workshop | Veles Terminal Workshop | F12 | 1 / S1 |
| Black Tile<br>`estella-vii-black-project-outpost` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| Mosaic Assembly Lab<br>`estella-vii-high-vacuum-factory` | Mosaic Rig and Instrument Service | Mosaic Rig and Instrument Service | Mosaic Rig and Instrument Service | F13 | 1 / S1 |
| Roster Hall<br>`estella-vii-worker-hab` | Roster Hall Workshop | Roster Hall Workshop | Roster Hall Workshop | F13 | 1 / S1 |
| Tessera Orbital<br>`estella-vii-transit-station` | Tessera Orbital Workshop | Tessera Orbital Workshop | Tessera Orbital Workshop | F13 | 1 / S1 |
| White Ceramic Quarry<br>`estella-vii-feedstock-mine` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F08 | 0 / S0 |
| Acheron Commercial Hub<br>`estella-ii-commercial-hub` | Acheron Transfer Engineering | Acheron Transfer Engineering | Acheron Transfer Engineering | F14 | 1 / S1 |
| Nimbus Crucible<br>`estella-ii-nimbus-crucible` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F15 | 0 / S0 |
| Olympos<br>`estella-ii-olympos` | Olympos Workshop | Olympos Workshop | Olympos Workshop | F14 | 1 / S1 |
| Pandemonium<br>`estella-ii-pandemonium` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F46 | 0 / S0 |
| Balor Orbital<br>`estella-i-low-orbit-station` | Balor Orbital Service Works | Balor Orbital Service Works | Balor Orbital Service Works | F16 | 1 / S1 |
| BAM Extraction One<br>`estella-i-refractory-mine` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F15 | 0 / S0 |
| BAM Foundry One<br>`estella-i-hot-processing` | BAM Foundry One Workshop | BAM Foundry One Workshop | BAM Foundry One Workshop | F16 | 1 / S1 |
| Shade<br>`estella-i-worker-hab` | Shade Workshop | Shade Workshop | Shade Workshop | F16 | 1 / S1 |
| Bingjie<br>`estella-iv-climate-poi-3` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F15 | 0 / S0 |
| Dahai Main Orbital Station<br>`estella-iv-main-station` | Dahai Main Orbital Station Workshop | Dahai Main Orbital Station Workshop | Dahai Main Orbital Station Workshop | F17 | 1 / S1 |
| Fuyuan<br>`estella-iv-primary-city` | Fuyuan Ship Service Cooperative | Fuyuan Ship Service Cooperative | Fuyuan Ship Service Cooperative | F17 | 1 / S1 |
| Jiuyuan<br>`estella-iv-climate-poi-2` | Jiuyuan Workshop | Jiuyuan Workshop | Jiuyuan Workshop | F17 | 1 / S1 |
| Zhulong<br>`estella-iv-climate-poi-1` | Zhulong Workshop | Zhulong Workshop | Zhulong Workshop | F17 | 1 / S1 |
| Ampere<br>`estella-iiia-helium-mining` | Ampere Workshop | Ampere Workshop | Ampere Workshop | F18 | 1 / S1 |
| Beaumont<br>`estella-iiia-heritage-site` | Beaumont Workshop | Beaumont Workshop | Beaumont Workshop | F18 | 1 / S1 |
| Celeste Main Port<br>`estella-iiia-main-port` | Celeste Port Engineering | Celeste Port Engineering | Celeste Port Engineering | F18 | 1 / S1 |
| Descartes Lab<br>`estella-iiia-science-settlement` | Ask for local technical help | Ask for local technical help | Local technical staff | F43 | 0 / S0 |
| Cousteau Station<br>`estella-iii-polar-science` | Ask for local technical help | Ask for local technical help | Local technical staff | F43 | 0 / S0 |
| Gaia Luxury Orbital Habitat<br>`estella-iii-luxury-habitat` | Gaia Luxury Orbital Habitat Workshop | Gaia Luxury Orbital Habitat Workshop | Gaia Luxury Orbital Habitat Workshop | F19 | 1 / S1 |
| Mirabel<br>`estella-iii-coastal-resort` | Mirabel Workshop | Mirabel Workshop | Mirabel Workshop | F19 | 1 / S1 |
| Orselle<br>`estella-iii-capital-city` | Orselle Workshop | Orselle Workshop | Orselle Workshop | F19 | 1 / S1 |
| Richelieu Orbital Terminal<br>`estella-iii-main-customs-station` | Richelieu Fleet Service | Richelieu Fleet Service | Richelieu Fleet Service | F19 | 1 / S1 |
| Rochefort<br>`estella-iii-high-tech-city` | Rochefort Precision Service | Rochefort Precision Service | Rochefort Precision Service | F19 | 1 / S1 |
| Valenne<br>`estella-iii-agricultural-region` | Valenne Workshop | Valenne Workshop | Valenne Workshop | F19 | 1 / S1 |
| Skim Hub Alpha<br>`skim-hub-alpha` | Skim Hub Alpha Workshop | Skim Hub Alpha Workshop | Skim Hub Alpha Workshop | F20 | 1 / S1 |
| Skim Hub Beta<br>`skim-hub-beta` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F15 | 0 / S0 |
| Barataria Observatory<br>`estella-xiv-transit-dock-station` | Barataria Observatory Workshop | Barataria Observatory Workshop | Barataria Observatory Workshop | F21 | 1 / S1 |
| Blind Drop<br>`estella-xiv-abandoned-active-site` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| False Bottom Cache<br>`estella-xiv-religious-retreat` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| The Warren<br>`estella-xiv-smuggler-haven` | Warren Community Workshop | Warren Community Workshop | Warren Community Workshop | F48 | 1 / S1 |
| Comet Fragment 1<br>`reach-comet-fragment-1` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F22 | 0 / S0 |
| Comet Fragment 2<br>`reach-comet-fragment-2` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| Comet Fragment 3<br>`reach-comet-fragment-3` | Emergency restart procedure | Emergency restart procedure | — | F49 | -1 / E0 |
| Comet Fragment 4<br>`reach-comet-fragment-4` | Ask for local technical help | Ask for local technical help | Local technical staff | F43 | 0 / S0 |
| Comet Fragment 5<br>`reach-comet-fragment-5` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F22 | 0 / S0 |
| Comet Fragment 6<br>`reach-comet-fragment-6` | Ask for local technical help | Ask for local technical help | Local technical staff | F43 | 0 / S0 |
| Lonely Beacon / Lone-Operator Station<br>`reach-rogue-lonely-beacon` | Ask the station operator for help | Ask the station operator for help | Station operator | F47 | 0 / S0 |
| Specialty Isotope Mine<br>`reach-rogue-isotope-mine` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F22 | 0 / S0 |
| EDF Farwatch Station<br>`deepest-dock-body` | Farwatch Visiting-Rig Workshop | Farwatch Visiting-Rig Workshop | EDF technical section | F23 | 1 / S1 |
| Bellevue<br>`estella-xiii-classified-research` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F24 | 0 / S0 |
| Common Ground<br>`estella-xiii-governors-outpost` | Common Ground Workshop | Common Ground Workshop | Common Ground Workshop | F25 | 1 / S1 |
| Deepwell<br>`estella-xiii-deep-ice-mining` | Deepwell Workshop | Deepwell Workshop | Deepwell Workshop | F25 | 1 / S1 |
| Freehold<br>`estella-xiii-prison-exile-colony` | Look for a local mechanic | Look for a local mechanic | Local maintenance workers | F24 | 0 / S0 |
| Thule Anchorage<br>`estella-xiii-main-port-station` | Anchorage Community Workshop | Anchorage Community Workshop | Anchorage Community Workshop | F25 | 1 / S1 |
| Volya<br>`estella-xiii-long-range-observatory` | Volya Workshop | Volya Workshop | Volya Workshop | F25 | 1 / S1 |
| Castle Beira<br>`estella-xa-volatiles-transit` | Beira Port Workshop | Beira Port Workshop | Beira Port Workshop | F26 | 1 / S1 |
| Frostglass Collegium<br>`estella-xa-exobiology-research` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| The Count's Well<br>`estella-xa-deep-ice-mine` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Alembic Ring<br>`estella-xd-orbital-chem-station` | Alembic Ring Service Works | Alembic Ring Service Works | Alembic Ring Service Works | F28 | 1 / S1 |
| Calatrava Keep<br>`estella-xd-proving-grounds` | Calatrava Keep Workshop | Calatrava Keep Workshop | Calatrava Keep Workshop | F28 | 1 / S1 |
| Iron Lists<br>`estella-xd-iron-lists` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Marcher Wells<br>`estella-xd-geothermal-extraction` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Redoubt Field<br>`estella-xd-redoubt-field` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Gryphon Aerie<br>`estella-x-skim-hub` | Vilar’s Outfitter at Gryphon Aerie | Vilar’s Outfitter at Gryphon Aerie | House Vilar | L06 | 1 / unchanged |
| Herald's Rest<br>`estella-x-trojan-captive` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Castle Alvares<br>`estella-xc-castle-alvares` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Castle Mendes<br>`estella-xc-castle-mendes` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Herald Gate<br>`estella-xc-transit-refuel-station` | Vilar’s Outfitter at Herald Gate | Vilar’s Outfitter at Herald Gate | House Vilar | L07 | 1 / unchanged |
| Serratine<br>`estella-xc-main-outpost` | Serratine Civil Workshop | Serratine Civil Workshop | Serratine Civil Workshop | F29 | 1 / S1 |
| Castle Tinto<br>`estella-xb-worker-hab` | Castle Tinto Workshop | Castle Tinto Workshop | Castle Tinto Workshop | F30 | 1 / S1 |
| Ember Court Foundry<br>`estella-xb-smelting-processing` | Ember Court Rig Works | Ember Court Rig Works | Ember Court Rig Works | F30 | 1 / S1 |
| Red Vein Works<br>`estella-xb-rare-element-mine` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Velvet City<br>`estella-xb-luxury-retreat` | Velvet City Workshop | Velvet City Workshop | Velvet City Workshop | F30 | 1 / S1 |
| Academy of Sublime Measures<br>`estella-xi-captive-science-waypoint` | Academy of Sublime Measures Workshop | Academy of Sublime Measures Workshop | Academy of Sublime Measures Workshop | F31 | 1 / S1 |
| Almaden Orbital<br>`estella-xia-orbital-chem-station` | Almaden Orbital Engineering | Almaden Orbital Engineering | Almaden Orbital Engineering | F32 | 1 / S1 |
| Castle Almaden<br>`estella-xia-sealed-worker-hab` | Castle Almaden Workshop | Castle Almaden Workshop | Castle Almaden Workshop | F32 | 1 / S1 |
| Cinnabar Cut<br>`estella-xia-rare-element-extraction` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Yellow Pit<br>`estella-xia-sulfur-mine` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Cadiz Highport<br>`estella-xid-main-port-station` | Vilar’s Outfitter at Cadiz Highport | Vilar’s Outfitter at Cadiz Highport | House Vilar | L08 | 1 / unchanged |
| Ratline House<br>`estella-xid-specialty-cargo` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Serratine Goods Exchange<br>`estella-xid-customs-transit` | Serratine Goods Exchange Workshop | Serratine Goods Exchange Workshop | Serratine Goods Exchange Workshop | F33 | 1 / S1 |
| Shipwright Keep<br>`estella-xid-services-outfitter-hangar` | The Armorial Shipwrights at Shipwright Keep | The Armorial Shipwrights at Shipwright Keep | The Armorial Shipwrights | L09 | 1 / unchanged |
| Chapel of Virtues<br>`estella-xi-captive-religious-retreat` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Daedalus Server Farm<br>`estella-xif-observatory` | Daedalus Server Farm Workshop | Daedalus Server Farm Workshop | Daedalus Server Farm Workshop | F34 | 1 / S1 |
| Daedalus Systems Campus<br>`estella-xif-deep-listening-array` | Daedalus Visiting-Rig Workshop | Daedalus Visiting-Rig Workshop | Daedalus Visiting-Rig Workshop | F34 | 1 / S1 |
| Icarus Lab<br>`estella-xif-sealed-research-outpost` | Ask for local technical help | Ask for local technical help | Local technical staff | F35 | 0 / W0 |
| Hydra Maw Orbital<br>`estella-xi-industrial-skim-hub` | Vilar’s Outfitter at Hydra Maw Orbital | Vilar’s Outfitter at Hydra Maw Orbital | House Vilar | L10 | 1 / unchanged |
| Bottom Court<br>`estella-xic-ice-mining` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Garden of Rebirth<br>`estella-xic-deep-ice-exobiology` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Macao Palace<br>`estella-xic-research-station` | Vilar’s Outfitter at Macao Palace | Vilar’s Outfitter at Macao Palace | House Vilar | L11 | 1 / unchanged |
| The Great Arena<br>`estella-xic-last-breath-lists` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Blackwater Fields<br>`estella-xib-hydrocarbon-extraction` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Blue Fen Refinery<br>`estella-xib-methane-refinery` | Blue Fen Refinery Workshop | Blue Fen Refinery Workshop | Blue Fen Refinery Workshop | F36 | 1 / S1 |
| Castle Marisma<br>`estella-xib-science-settlement` | Castle Marisma Workshop | Castle Marisma Workshop | Castle Marisma Workshop | F36 | 1 / S1 |
| Coldgate<br>`estella-xib-cryo-transit` | Coldgate Cryogenic Service | Coldgate Cryogenic Service | Coldgate Cryogenic Service | F36 | 1 / S1 |
| Marisma Cauldron<br>`estella-xib-organic-chemistry` | Marisma Cauldron Workshop | Marisma Cauldron Workshop | Marisma Cauldron Workshop | F36 | 1 / S1 |
| Banner Forge<br>`estella-xie-component-fabrication` | Banner Forge Workshop | Banner Forge Workshop | Banner Forge Workshop | F37 | 1 / S1 |
| Keelwright Works<br>`estella-xie-rare-alloy-extraction` | The Seconds Gate at Keelwright Works | The Seconds Gate at Keelwright Works | Keelwright Works | L12 | 1 / unchanged |
| Oathmark Academy<br>`estella-xie-oathmark-academy` | The High Pennant Shipyard at Oathmark Academy | The High Pennant Shipyard at Oathmark Academy | Oathmark Academy | L13 | 1 / unchanged |
| Serrat Domain Shipyard<br>`estella-xie-outer-spec-drydock-station` | Serrat Domain Civil Refit Office | Serrat Domain Civil Refit Office | Serrat Domain Shipyard Office | L14 | 3 / unchanged |
| The Black Exchange<br>`estella-xi-captive-fence` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| The Thieves' Guild<br>`estella-xi-captive-smuggler-deaddrop` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Blackglass Observatory<br>`estella-xiid-blackglass-observatory` | Blackglass Observatory Workshop | Blackglass Observatory Workshop | Blackglass Observatory Workshop | F38 | 1 / S1 |
| Castle Nunes<br>`estella-xiid-black-project-exile` | Castle Nunes Workshop | Castle Nunes Workshop | Castle Nunes Workshop | F38 | 1 / S1 |
| Mirror Clinic<br>`estella-xiid-mirror-clinic` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Manticore Observatory<br>`estella-xii-observation-post-station` | Vilar’s Outfitter at Manticore Observatory | Vilar’s Outfitter at Manticore Observatory | House Vilar | L15 | 1 / unchanged |
| Cathedral of Testimony<br>`estella-xiia-isolated-settlement` | Ask for a maintenance hand | Ask for a maintenance hand | Local maintenance workers | F39 | 0 / W0 |
| Pilgrim Gate<br>`estella-xiia-volatiles-transit` | Pilgrim Gate Repair Hall | Pilgrim Gate Repair Hall | Pilgrim Gate Repair Hall | F40 | 1 / S1 |
| Preceptory of Toil<br>`estella-xiia-deep-ice-mine` | Preceptory of Toil Workshop | Preceptory of Toil Workshop | Preceptory of Toil Workshop | F40 | 1 / S1 |
| Rookery of Knives<br>`estella-xii-captive-smuggler-waypoint` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Bluefire Mine<br>`estella-xiic-isotope-mining` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Castle Teide<br>`estella-xiic-castle-teide` | Teide Charter Workshop | Teide Charter Workshop | Teide Charter Workshop | F41 | 1 / S1 |
| Teide Survey Collegium<br>`estella-xiic-comet-research` | Teide Survey Collegium Workshop | Teide Survey Collegium Workshop | Teide Survey Collegium Workshop | F41 | 1 / S1 |
| The Far Bell Tower<br>`estella-xii-captive-comm-relay` | Walk the hangars and ask for a local mechanic | Walk the hangars and ask for a local mechanic | Unofficial local mechanic | F27 | 0 / W0 |
| Vigil Gate<br>`estella-xiib-transit-station` | Vigil Gate Workshop | Vigil Gate Workshop | Vigil Gate Workshop | F42 | 1 / S1 |
| Vigil Keep<br>`estella-xiib-outpost` | Ask for a maintenance hand | Ask for a maintenance hand | Local maintenance workers | F39 | 0 / W0 |

## 6. Every physical location — complete referral output

The text below is fully expanded, followed by its displayed physical path. Entrance IDs are authorization metadata, not displayed text; every referenced entrance is public. These lines are local advice, never travel bookings or remote work. Hidden sites may have an outbound recommendation, but never become a recommendation target. The same referral interaction works without a paid inspection.

| Source physical ID | Primary output | Elite alternative output | Variant codes | Public receiving entrance IDs |
|---|---|---|---|---|
| `arkfall-apocrypha-cache` | For more advanced work, go to Caravanserai Drydock Service.<br>The Belt -> New Canaan Field -> The Caravanserai | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `caravanserai-main-commercial-dock`; `estella-viii-harder-approach-station` |
| `ark-quarantine-station` | For more advanced work, go to Caravanserai Drydock Service.<br>The Belt -> New Canaan Field -> The Caravanserai | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `caravanserai-main-commercial-dock`; `estella-viii-harder-approach-station` |
| `industrial-refinery-asteroid-es-m-0002` | For more advanced work, go to Bruckner Central Service Hall.<br>The Belt -> Weymark -> Bruckner Weymark Depot | — | R1 | `estella-viii-harder-approach-station` |
| `glitterfield-deepcut` | For more advanced work, go to Halloran Rig Service.<br>The Belt -> Glitterfield -> Cupola Station | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `industrial-refinery-ore-intake`; `estella-viii-harder-approach-station` |
| `glitterfield-grubstake` | For more advanced work, go to Halloran Rig Service.<br>The Belt -> Glitterfield -> Cupola Station | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `industrial-refinery-ore-intake`; `estella-viii-harder-approach-station` |
| `glitterfield-highgrade` | For more advanced work, go to Halloran Rig Service.<br>The Belt -> Glitterfield -> Cupola Station | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `industrial-refinery-ore-intake`; `estella-viii-harder-approach-station` |
| `glitterfield-slagfoot` | For more advanced work, go to Halloran Rig Service.<br>The Belt -> Glitterfield -> Cupola Station | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `industrial-refinery-ore-intake`; `estella-viii-harder-approach-station` |
| `harlans-station` | For more advanced work, go to Caravanserai Drydock Service.<br>The Belt -> New Canaan Field -> The Caravanserai | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `caravanserai-main-commercial-dock`; `estella-viii-harder-approach-station` |
| `mercers-claim` | For more advanced work, go to Harlan's Station Workshop.<br>The Belt -> New Canaan Field -> Harlan's Station | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `harlan-dock`; `estella-viii-harder-approach-station` |
| `caravanserai` | For more advanced work, go to Bruckner Central Service Hall.<br>The Belt -> Weymark -> Bruckner Weymark Depot | — | R1 | `estella-viii-harder-approach-station` |
| `the-still` | For more advanced work, go to Caravanserai Drydock Service.<br>The Belt -> New Canaan Field -> The Caravanserai | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `caravanserai-main-commercial-dock`; `estella-viii-harder-approach-station` |
| `estella-ix-ice-mine` | For more advanced work, go to Bruckner Central Service Hall.<br>The Belt -> Weymark -> Bruckner Weymark Depot | — | R1 | `estella-viii-harder-approach-station` |
| `estella-ix-research-base` | For more advanced work, go to Bir Safa Service House.<br>The Belt -> Sahra -> Bir Safa | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-ix-ice-mine`; `estella-viii-harder-approach-station` |
| `estella-ix-captured-moonlet` | For more advanced work, go to Suhail Anchorage Workshop.<br>The Belt -> Sahra -> Suhail Anchorage | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-ix-opposite-sense-supply-depot`; `estella-viii-harder-approach-station` |
| `estella-ix-supply-depot` | For more advanced work, go to Bir Safa Service House.<br>The Belt -> Sahra -> Bir Safa | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-ix-ice-mine`; `estella-viii-harder-approach-station` |
| `estella-ix-geological-feature` | For more advanced work, go to Multaqa Workshop.<br>The Belt -> Sahra -> Multaqa | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-ix-research-base`; `estella-viii-harder-approach-station` |
| `estella-viii-high-station` | — | — | — | — |
| `estella-viii-mining-site` | For more advanced work, go to Weymark Town Workshop.<br>The Belt -> Weymark -> Weymark Town | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-viii-settlement`; `estella-viii-harder-approach-station` |
| `estella-viii-captured-moonlet` | For more advanced work, go to Nell’s Rest Shipworks.<br>The Belt -> Weymark -> Nell's Rest | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-viii-first-rendezvous-station`; `estella-viii-harder-approach-station` |
| `estella-viii-friendly-station` | For more advanced work, go to Bruckner Central Service Hall.<br>The Belt -> Weymark -> Bruckner Weymark Depot | — | R1 | `estella-viii-harder-approach-station` |
| `estella-viii-abandoned-site` | For more advanced work, go to Weymark Town Workshop.<br>The Belt -> Weymark -> Weymark Town | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-viii-settlement`; `estella-viii-harder-approach-station` |
| `estella-viii-settlement` | For more advanced work, go to Nell’s Rest Shipworks.<br>The Belt -> Weymark -> Nell's Rest | Or, of course, you can go to Bruckner Central Service Hall. They handle the most demanding work.<br>The Belt -> Weymark -> Bruckner Weymark Depot | R1, R2 | `estella-viii-first-rendezvous-station`; `estella-viii-harder-approach-station` |
| `estella-v-orbital-factory` | For more advanced work, go to Roadstead Rig Works.<br>The Camps -> Hartwell -> Roadstead Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-v-transit-customs`; `estella-via-drydock-station` |
| `estella-v-atmo-refinery` | For more advanced work, go to Roadstead Rig Works.<br>The Camps -> Hartwell -> Roadstead Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-v-transit-customs`; `estella-via-drydock-station` |
| `estella-v-capital-settlement` | For more advanced work, go to Roadstead Rig Works.<br>The Camps -> Hartwell -> Roadstead Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-v-transit-customs`; `estella-via-drydock-station` |
| `estella-v-open-cast-mine` | For more advanced work, go to Cinderhook Refinery Workshop.<br>The Camps -> Hartwell -> Cinderhook Refinery | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-v-atmo-refinery`; `estella-via-drydock-station` |
| `estella-v-abandoned-colony` | For more advanced work, go to Roadstead Rig Works.<br>The Camps -> Hartwell -> Roadstead Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-v-transit-customs`; `estella-via-drydock-station` |
| `estella-v-storm-research` | For more advanced work, go to Roadstead Rig Works.<br>The Camps -> Hartwell -> Roadstead Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-v-transit-customs`; `estella-via-drydock-station` |
| `estella-va-strip-mine` | For more advanced work, go to Switchback Service Hall.<br>The Camps -> Hartwell -> Pike -> Switchback | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-va-miner-hab`; `estella-via-drydock-station` |
| `estella-va-ore-depot` | For more advanced work, go to Switchback Service Hall.<br>The Camps -> Hartwell -> Pike -> Switchback | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-va-miner-hab`; `estella-via-drydock-station` |
| `estella-va-miner-hab` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-v-transit-station` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-vi-main-dispatch` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-vi-foundry-complex` | For more advanced work, go to Anvil Visiting-Rig Works.<br>The Camps -> Kuznia -> Anvil Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vi-main-transit-dispatch`; `estella-via-drydock-station` |
| `estella-vi-heavy-cargo-dispatch` | For more advanced work, go to Anvil Visiting-Rig Works.<br>The Camps -> Kuznia -> Anvil Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vi-main-transit-dispatch`; `estella-via-drydock-station` |
| `estella-vib-aquaculture` | For more advanced work, go to Kalyna Port Engineering.<br>The Camps -> Kuznia -> Kalyna -> Kalyna Orbital | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vib-cold-chain-station`; `estella-via-drydock-station` |
| `estella-vib-cold-chain-transit` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-vib-vat-protein` | For more advanced work, go to Kalyna Port Engineering.<br>The Camps -> Kuznia -> Kalyna -> Kalyna Orbital | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vib-cold-chain-station`; `estella-via-drydock-station` |
| `estella-vib-pharma-horticulture` | For more advanced work, go to Kalyna Port Engineering.<br>The Camps -> Kuznia -> Kalyna -> Kalyna Orbital | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vib-cold-chain-station`; `estella-via-drydock-station` |
| `estella-vi-mountain-mining` | For more advanced work, go to Anvil Visiting-Rig Works.<br>The Camps -> Kuznia -> Anvil Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vi-main-transit-dispatch`; `estella-via-drydock-station` |
| `estella-vi-agricultural-lowlands` | For more advanced work, go to Anvil Visiting-Rig Works.<br>The Camps -> Kuznia -> Anvil Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vi-main-transit-dispatch`; `estella-via-drydock-station` |
| `estella-vi-polar-weather-research` | For more advanced work, go to Anvil Visiting-Rig Works.<br>The Camps -> Kuznia -> Anvil Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vi-main-transit-dispatch`; `estella-via-drydock-station` |
| `estella-vi-industrial-city` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-vi-spaceport` | For more advanced work, go to Anvil Visiting-Rig Works.<br>The Camps -> Kuznia -> Anvil Station | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vi-main-transit-dispatch`; `estella-via-drydock-station` |
| `estella-via-surface-anchor` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-via-rare-alloy-extraction` | For more advanced work, go to Veles Terminal Workshop.<br>The Camps -> Kuznia -> Svarog -> Veles Terminal | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-via-component-supply-station`; `estella-via-drydock-station` |
| `estella-via-drydock` | For more advanced work, ask for the specialist service at Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R3 | `estella-via-drydock-station` |
| `estella-via-component-supply` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-vii-black-project-outpost` | For more advanced work, go to Tessera Orbital Workshop.<br>The Camps -> Tessera -> Tessera Orbital | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vii-transit-export`; `estella-via-drydock-station` |
| `estella-vii-high-vacuum-factory` | For more advanced work, go to Svarog Visiting-Rig Service.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | — | R1 | `estella-via-drydock-station` |
| `estella-vii-worker-hab` | For more advanced work, go to Mosaic Rig and Instrument Service.<br>The Camps -> Tessera -> Mosaic Assembly Lab | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vii-high-vacuum-factory`; `estella-via-drydock-station` |
| `estella-vii-transit-station` | For more advanced work, go to Mosaic Rig and Instrument Service.<br>The Camps -> Tessera -> Mosaic Assembly Lab | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vii-high-vacuum-factory`; `estella-via-drydock-station` |
| `estella-vii-feedstock-mine` | For more advanced work, go to Roster Hall Workshop.<br>The Camps -> Tessera -> Roster Hall | Or, of course, you can go to Svarog Visiting-Rig Service. They handle the most demanding work.<br>The Camps -> Kuznia -> Svarog -> Svarog Shipyard | R1, R2 | `estella-vii-worker-hab`; `estella-via-drydock-station` |
| `estella-ii-commercial-hub` | For more advanced work, go to Rochefort Precision Service.<br>The Hearth -> Gaia -> Rochefort | — | R1 | `estella-iii-high-tech-city` |
| `estella-ii-nimbus-crucible` | For more advanced work, go to Olympos Workshop.<br>The Hearth -> Acheron -> Olympos | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-ii-olympos`; `estella-iii-high-tech-city` |
| `estella-ii-olympos` | For more advanced work, go to Acheron Transfer Engineering.<br>The Hearth -> Acheron -> Acheron Commercial Hub | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-ii-commercial-hub-dock`; `estella-iii-high-tech-city` |
| `estella-ii-pandemonium` | For more advanced work, go to Acheron Transfer Engineering.<br>The Hearth -> Acheron -> Acheron Commercial Hub | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-ii-commercial-hub-dock`; `estella-iii-high-tech-city` |
| `estella-i-low-orbit-station` | For more advanced work, go to Rochefort Precision Service.<br>The Hearth -> Gaia -> Rochefort | — | R1 | `estella-iii-high-tech-city` |
| `estella-i-refractory-mine` | For more advanced work, go to BAM Foundry One Workshop.<br>The Hearth -> Balor -> BAM Foundry One | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-i-hot-processing`; `estella-iii-high-tech-city` |
| `estella-i-hot-processing` | For more advanced work, go to Balor Orbital Service Works.<br>The Hearth -> Balor -> Balor Orbital | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-i-transit-customs`; `estella-iii-high-tech-city` |
| `estella-i-worker-hab` | For more advanced work, go to Balor Orbital Service Works.<br>The Hearth -> Balor -> Balor Orbital | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-i-transit-customs`; `estella-iii-high-tech-city` |
| `estella-iv-climate-poi-3` | For more advanced work, go to Fuyuan Ship Service Cooperative.<br>The Hearth -> Dahai -> Fuyuan | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iv-primary-city`; `estella-iii-high-tech-city` |
| `estella-iv-main-station` | For more advanced work, go to Fuyuan Ship Service Cooperative.<br>The Hearth -> Dahai -> Fuyuan | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iv-primary-city`; `estella-iii-high-tech-city` |
| `estella-iv-primary-city` | For more advanced work, go to Rochefort Precision Service.<br>The Hearth -> Gaia -> Rochefort | — | R1 | `estella-iii-high-tech-city` |
| `estella-iv-climate-poi-2` | For more advanced work, go to Fuyuan Ship Service Cooperative.<br>The Hearth -> Dahai -> Fuyuan | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iv-primary-city`; `estella-iii-high-tech-city` |
| `estella-iv-climate-poi-1` | For more advanced work, go to Fuyuan Ship Service Cooperative.<br>The Hearth -> Dahai -> Fuyuan | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iv-primary-city`; `estella-iii-high-tech-city` |
| `estella-iiia-helium-mining` | For more advanced work, go to Celeste Port Engineering.<br>The Hearth -> Gaia -> Celeste -> Celeste Main Port | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iiia-main-port-transit`; `estella-iii-high-tech-city` |
| `estella-iiia-heritage-site` | For more advanced work, go to Celeste Port Engineering.<br>The Hearth -> Gaia -> Celeste -> Celeste Main Port | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iiia-main-port-transit`; `estella-iii-high-tech-city` |
| `estella-iiia-main-port` | For more advanced work, go to Rochefort Precision Service.<br>The Hearth -> Gaia -> Rochefort | — | R1 | `estella-iii-high-tech-city` |
| `estella-iiia-science-settlement` | For more advanced work, go to Celeste Port Engineering.<br>The Hearth -> Gaia -> Celeste -> Celeste Main Port | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iiia-main-port-transit`; `estella-iii-high-tech-city` |
| `estella-iii-polar-science` | For more advanced work, go to Richelieu Fleet Service.<br>The Hearth -> Gaia -> Richelieu Orbital Terminal | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iii-main-customs`; `estella-iii-high-tech-city` |
| `estella-iii-luxury-habitat` | For more advanced work, go to Richelieu Fleet Service.<br>The Hearth -> Gaia -> Richelieu Orbital Terminal | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iii-main-customs`; `estella-iii-high-tech-city` |
| `estella-iii-coastal-resort` | For more advanced work, go to Richelieu Fleet Service.<br>The Hearth -> Gaia -> Richelieu Orbital Terminal | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iii-main-customs`; `estella-iii-high-tech-city` |
| `estella-iii-capital-city` | For more advanced work, go to Richelieu Fleet Service.<br>The Hearth -> Gaia -> Richelieu Orbital Terminal | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iii-main-customs`; `estella-iii-high-tech-city` |
| `estella-iii-main-customs-station` | For more advanced work, go to Rochefort Precision Service.<br>The Hearth -> Gaia -> Rochefort | — | R1 | `estella-iii-high-tech-city` |
| `estella-iii-high-tech-city` | For more advanced work, ask for the specialist service at Rochefort Precision Service.<br>The Hearth -> Gaia -> Rochefort | — | R3 | `estella-iii-high-tech-city` |
| `estella-iii-agricultural-region` | For more advanced work, go to Richelieu Fleet Service.<br>The Hearth -> Gaia -> Richelieu Orbital Terminal | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-iii-main-customs`; `estella-iii-high-tech-city` |
| `skim-hub-alpha` | For more advanced work, go to Balor Orbital Service Works.<br>The Hearth -> Balor -> Balor Orbital | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `estella-i-transit-customs`; `estella-iii-high-tech-city` |
| `skim-hub-beta` | For more advanced work, go to Skim Hub Alpha Workshop.<br>The Hearth -> Skim Hub Alpha | Or, of course, you can go to Rochefort Precision Service. They handle the most demanding work.<br>The Hearth -> Gaia -> Rochefort | R1, R2 | `skim-hub-alpha-precursor-dock`; `estella-iii-high-tech-city` |
| `estella-xiv-transit-dock-station` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xiv-abandoned-active-site` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `estella-xiv-religious-retreat` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `estella-xiv-smuggler-haven` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `reach-comet-fragment-1` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `reach-comet-fragment-2` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `reach-comet-fragment-3` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `reach-comet-fragment-4` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `reach-comet-fragment-5` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `reach-comet-fragment-6` | For more advanced work, go to Barataria Observatory Workshop.<br>The Reach -> Barataria -> Barataria Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiv-transit-dock`; `estella-xie-outer-spec-drydock` |
| `reach-rogue-lonely-beacon` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `reach-rogue-isotope-mine` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `deepest-dock-body` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xiii-classified-research` | For more advanced work, go to Common Ground Workshop.<br>The Reach -> Thule -> Common Ground | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-governors-outpost`; `estella-xie-outer-spec-drydock` |
| `estella-xiii-governors-outpost` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xiii-deep-ice-mining` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xiii-prison-exile-colony` | For more advanced work, go to Common Ground Workshop.<br>The Reach -> Thule -> Common Ground | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-governors-outpost`; `estella-xie-outer-spec-drydock` |
| `estella-xiii-main-port-station` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xiii-long-range-observatory` | For more advanced work, go to Anchorage Community Workshop.<br>The Reach -> Thule -> Thule Anchorage | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiii-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xa-volatiles-transit` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xa-exobiology-research` | For more advanced work, go to Beira Port Workshop.<br>The Wells -> Gryphon -> Beira -> Castle Beira | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xa-volatiles-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xa-deep-ice-mine` | For more advanced work, go to Beira Port Workshop.<br>The Wells -> Gryphon -> Beira -> Castle Beira | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xa-volatiles-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xd-orbital-chem-station` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xd-proving-grounds` | For more advanced work, go to Alembic Ring Service Works.<br>The Wells -> Gryphon -> Calatrava -> Alembic Ring | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xd-chem-station`; `estella-xie-outer-spec-drydock` |
| `estella-xd-iron-lists` | For more advanced work, go to Calatrava Keep Workshop.<br>The Wells -> Gryphon -> Calatrava -> Calatrava Keep | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xd-proving-grounds`; `estella-xie-outer-spec-drydock` |
| `estella-xd-geothermal-extraction` | For more advanced work, go to Alembic Ring Service Works.<br>The Wells -> Gryphon -> Calatrava -> Alembic Ring | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xd-chem-station`; `estella-xie-outer-spec-drydock` |
| `estella-xd-redoubt-field` | For more advanced work, go to Calatrava Keep Workshop.<br>The Wells -> Gryphon -> Calatrava -> Calatrava Keep | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xd-proving-grounds`; `estella-xie-outer-spec-drydock` |
| `estella-x-skim-hub` | For more advanced work, go to Serratine Civil Workshop.<br>The Wells -> Gryphon -> Thronehold -> Serratine | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xc-main-outpost`; `estella-xie-outer-spec-drydock` |
| `estella-x-trojan-captive` | For more advanced work, go to Vilar’s Outfitter at Gryphon Aerie.<br>The Wells -> Gryphon -> Gryphon Aerie | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-x-observation-skim-hub`; `estella-xie-outer-spec-drydock` |
| `estella-xc-castle-alvares` | For more advanced work, go to Vilar’s Outfitter at Herald Gate.<br>The Wells -> Gryphon -> Thronehold -> Herald Gate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xc-transit-refuel`; `estella-xie-outer-spec-drydock` |
| `estella-xc-castle-mendes` | For more advanced work, go to Vilar’s Outfitter at Herald Gate.<br>The Wells -> Gryphon -> Thronehold -> Herald Gate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xc-transit-refuel`; `estella-xie-outer-spec-drydock` |
| `estella-xc-transit-refuel-station` | For more advanced work, go to Serratine Civil Workshop.<br>The Wells -> Gryphon -> Thronehold -> Serratine | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xc-main-outpost`; `estella-xie-outer-spec-drydock` |
| `estella-xc-main-outpost` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xb-worker-hab` | For more advanced work, go to Ember Court Rig Works.<br>The Wells -> Gryphon -> Tinto -> Ember Court Foundry | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xb-smelting-processing`; `estella-xie-outer-spec-drydock` |
| `estella-xb-smelting-processing` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xb-rare-element-mine` | For more advanced work, go to Ember Court Rig Works.<br>The Wells -> Gryphon -> Tinto -> Ember Court Foundry | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xb-smelting-processing`; `estella-xie-outer-spec-drydock` |
| `estella-xb-luxury-retreat` | For more advanced work, go to Ember Court Rig Works.<br>The Wells -> Gryphon -> Tinto -> Ember Court Foundry | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xb-smelting-processing`; `estella-xie-outer-spec-drydock` |
| `estella-xi-captive-science-waypoint` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xia-orbital-chem-station` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xia-sealed-worker-hab` | For more advanced work, go to Almaden Orbital Engineering.<br>The Wells -> Hydra -> Almaden -> Almaden Orbital | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xia-chem-station`; `estella-xie-outer-spec-drydock` |
| `estella-xia-rare-element-extraction` | For more advanced work, go to Almaden Orbital Engineering.<br>The Wells -> Hydra -> Almaden -> Almaden Orbital | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xia-chem-station`; `estella-xie-outer-spec-drydock` |
| `estella-xia-sulfur-mine` | For more advanced work, go to Almaden Orbital Engineering.<br>The Wells -> Hydra -> Almaden -> Almaden Orbital | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xia-chem-station`; `estella-xie-outer-spec-drydock` |
| `estella-xid-main-port-station` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xid-specialty-cargo` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xid-customs-transit` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xid-services-outfitter-hangar` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xi-captive-religious-retreat` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xif-observatory` | For more advanced work, go to Daedalus Visiting-Rig Workshop.<br>The Wells -> Hydra -> Coimbra -> Daedalus Systems Campus | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xif-deep-listening-array`; `estella-xie-outer-spec-drydock` |
| `estella-xif-deep-listening-array` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xif-sealed-research-outpost` | For more advanced work, go to Daedalus Visiting-Rig Workshop.<br>The Wells -> Hydra -> Coimbra -> Daedalus Systems Campus | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xif-deep-listening-array`; `estella-xie-outer-spec-drydock` |
| `estella-xi-industrial-skim-hub` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xic-ice-mining` | For more advanced work, go to Vilar’s Outfitter at Macao Palace.<br>The Wells -> Hydra -> Macao -> Macao Palace | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xic-research-station-poi`; `estella-xie-outer-spec-drydock` |
| `estella-xic-deep-ice-exobiology` | For more advanced work, go to Vilar’s Outfitter at Macao Palace.<br>The Wells -> Hydra -> Macao -> Macao Palace | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xic-research-station-poi`; `estella-xie-outer-spec-drydock` |
| `estella-xic-research-station` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xic-last-breath-lists` | For more advanced work, go to Vilar’s Outfitter at Macao Palace.<br>The Wells -> Hydra -> Macao -> Macao Palace | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xic-research-station-poi`; `estella-xie-outer-spec-drydock` |
| `estella-xib-hydrocarbon-extraction` | For more advanced work, go to Blue Fen Refinery Workshop.<br>The Wells -> Hydra -> Marisma -> Blue Fen Refinery | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xib-methane-refinery`; `estella-xie-outer-spec-drydock` |
| `estella-xib-methane-refinery` | For more advanced work, go to Coldgate Cryogenic Service.<br>The Wells -> Hydra -> Marisma -> Coldgate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xib-cryo-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xib-science-settlement` | For more advanced work, go to Coldgate Cryogenic Service.<br>The Wells -> Hydra -> Marisma -> Coldgate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xib-cryo-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xib-cryo-transit` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xib-organic-chemistry` | For more advanced work, go to Coldgate Cryogenic Service.<br>The Wells -> Hydra -> Marisma -> Coldgate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xib-cryo-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xie-component-fabrication` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xie-rare-alloy-extraction` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xie-oathmark-academy` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xie-outer-spec-drydock-station` | — | — | — | — |
| `estella-xi-captive-fence` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xi-captive-smuggler-deaddrop` | For more advanced work, go to Vilar’s Outfitter at Cadiz Highport.<br>The Wells -> Hydra -> Cadiz -> Cadiz Highport | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xid-main-port`; `estella-xie-outer-spec-drydock` |
| `estella-xiid-blackglass-observatory` | For more advanced work, go to Teide Charter Workshop.<br>The Wells -> Manticore -> Teide -> Castle Teide | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiic-castle-teide`; `estella-xie-outer-spec-drydock` |
| `estella-xiid-black-project-exile` | For more advanced work, go to Teide Charter Workshop.<br>The Wells -> Manticore -> Teide -> Castle Teide | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiic-castle-teide`; `estella-xie-outer-spec-drydock` |
| `estella-xiid-mirror-clinic` | For more advanced work, go to Vilar’s Outfitter at Manticore Observatory.<br>The Wells -> Manticore -> Manticore Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xii-observation-post`; `estella-xie-outer-spec-drydock` |
| `estella-xii-observation-post-station` | For more advanced work, go to Teide Charter Workshop.<br>The Wells -> Manticore -> Teide -> Castle Teide | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiic-castle-teide`; `estella-xie-outer-spec-drydock` |
| `estella-xiia-isolated-settlement` | For more advanced work, go to Pilgrim Gate Repair Hall.<br>The Wells -> Manticore -> Mercy -> Pilgrim Gate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiia-volatiles-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xiia-volatiles-transit` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xiia-deep-ice-mine` | For more advanced work, go to Pilgrim Gate Repair Hall.<br>The Wells -> Manticore -> Mercy -> Pilgrim Gate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiia-volatiles-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xii-captive-smuggler-waypoint` | For more advanced work, go to Vilar’s Outfitter at Manticore Observatory.<br>The Wells -> Manticore -> Manticore Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xii-observation-post`; `estella-xie-outer-spec-drydock` |
| `estella-xiic-isotope-mining` | For more advanced work, go to Teide Charter Workshop.<br>The Wells -> Manticore -> Teide -> Castle Teide | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiic-castle-teide`; `estella-xie-outer-spec-drydock` |
| `estella-xiic-castle-teide` | For more advanced work, go to Serrat Domain Civil Refit Office.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | — | R1 | `estella-xie-outer-spec-drydock` |
| `estella-xiic-comet-research` | For more advanced work, go to Teide Charter Workshop.<br>The Wells -> Manticore -> Teide -> Castle Teide | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiic-castle-teide`; `estella-xie-outer-spec-drydock` |
| `estella-xii-captive-comm-relay` | For more advanced work, go to Vilar’s Outfitter at Manticore Observatory.<br>The Wells -> Manticore -> Manticore Observatory | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xii-observation-post`; `estella-xie-outer-spec-drydock` |
| `estella-xiib-transit-station` | For more advanced work, go to Pilgrim Gate Repair Hall.<br>The Wells -> Manticore -> Mercy -> Pilgrim Gate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiia-volatiles-transit`; `estella-xie-outer-spec-drydock` |
| `estella-xiib-outpost` | For more advanced work, go to Vigil Gate Workshop.<br>The Wells -> Manticore -> Vigil -> Vigil Gate | Or, of course, you can go to Serrat Domain Civil Refit Office. They handle the most demanding work.<br>The Wells -> Hydra -> Oathmark -> Serrat Domain Shipyard | R1, R2 | `estella-xiib-transit-station-poi`; `estella-xie-outer-spec-drydock` |

## 7. Complete account and receiving-location mapping

This table binds the reviewed copy to real locations without changing an operational berth, granting permission, merging branch credits or creating a new economic provider. Existing accounts and directory IDs are retained; new staffed sites use the approved IDs. Temporary emergency entries are replaced by staffed entries at the same physical scope. Final emergency-only sites retain their emergency IDs. All 177 operational receiving IDs are included; no route endpoint is substituted with its physical display parent.

| Physical ID | Receiving IDs | Shop/account ID | Directory ID |
|---|---|---|---|
| `arkfall-apocrypha-cache` | `arkfall-apocrypha-cache-poi` | `emergency-arkfall-apocrypha-cache` | `emergency-arkfall-apocrypha-cache-office` |
| `ark-quarantine-station` | `ark-quarantine-station-poi` | `maintenance-ark-quarantine-station` | `maintenance-ark-quarantine-station-office` |
| `industrial-refinery-asteroid-es-m-0002` | `industrial-refinery-finished-goods`; `industrial-refinery-ore-intake`; `industrial-refinery-staff-hab` | `maintenance-industrial-refinery-asteroid-es-m-0002` | `maintenance-industrial-refinery-asteroid-es-m-0002-office` |
| `glitterfield-deepcut` | `deepcut-depot-dock` | `maintenance-glitterfield-deepcut` | `maintenance-glitterfield-deepcut-office` |
| `glitterfield-grubstake` | `grubstake-depot-dock` | `maintenance-glitterfield-grubstake` | `maintenance-glitterfield-grubstake-office` |
| `glitterfield-highgrade` | `highgrade-depot-dock` | `maintenance-glitterfield-highgrade` | `maintenance-glitterfield-highgrade-office` |
| `glitterfield-slagfoot` | `slagfoot-depot-dock` | `maintenance-glitterfield-slagfoot` | `maintenance-glitterfield-slagfoot-office` |
| `harlans-station` | `harlan-dock` | `maintenance-harlans-station` | `maintenance-harlans-station-office` |
| `mercers-claim` | `mercer-dock` | `maintenance-mercers-claim` | `maintenance-mercers-claim-office` |
| `caravanserai` | `caravanserai-certification-authority`; `caravanserai-customs-inspection`; `caravanserai-foreign-quarter`; `caravanserai-free-trader-anchorage`; `caravanserai-highliner-bay-poi`; `caravanserai-lookout-spire`; `caravanserai-main-commercial-dock`; `caravanserai-outfitter-drydock`; `caravanserai-player-hangar`; `caravanserai-refuel-depot` | `maintenance-caravanserai` | `maintenance-caravanserai-office` |
| `the-still` | `still-distribution-bay`; `still-guild-hq`; `still-public-approach-dock`; `still-refinery-core`; `still-skim-runner-berth-poi`; `still-worker-hab` | `maintenance-the-still` | `maintenance-the-still-office` |
| `estella-ix-ice-mine` | `estella-ix-ice-mine` | `maintenance-estella-ix-ice-mine` | `maintenance-estella-ix-ice-mine-office` |
| `estella-ix-research-base` | `estella-ix-research-base` | `maintenance-estella-ix-research-base` | `maintenance-estella-ix-research-base-office` |
| `estella-ix-captured-moonlet` | `estella-ix-moonlet-observation-outpost` | `maintenance-estella-ix-captured-moonlet` | `maintenance-estella-ix-captured-moonlet-office` |
| `estella-ix-supply-depot` | `estella-ix-opposite-sense-supply-depot` | `maintenance-estella-ix-supply-depot` | `maintenance-estella-ix-supply-depot-office` |
| `estella-ix-geological-feature` | `estella-ix-geological-feature` | `maintenance-estella-ix-geological-feature` | `maintenance-estella-ix-geological-feature-office` |
| `estella-viii-high-station` | `estella-viii-harder-approach-station` | `bruckner-central-service-hall` | `bruckner-central-service-hall-office` |
| `estella-viii-mining-site` | `estella-viii-mining-site` | `maintenance-estella-viii-mining-site` | `maintenance-estella-viii-mining-site-office` |
| `estella-viii-captured-moonlet` | `estella-viii-moonlet-docking-site` | `emergency-estella-viii-captured-moonlet` | `emergency-estella-viii-captured-moonlet-office` |
| `estella-viii-friendly-station` | `estella-viii-first-rendezvous-station` | `maintenance-estella-viii-friendly-station` | `maintenance-estella-viii-friendly-station-office` |
| `estella-viii-abandoned-site` | `estella-viii-abandoned-site` | `emergency-estella-viii-abandoned-site` | `emergency-estella-viii-abandoned-site-office` |
| `estella-viii-settlement` | `estella-viii-settlement` | `maintenance-estella-viii-settlement` | `maintenance-estella-viii-settlement-office` |
| `estella-v-orbital-factory` | `estella-v-high-orbit-factory` | `maintenance-estella-v-orbital-factory` | `maintenance-estella-v-orbital-factory-office` |
| `estella-v-atmo-refinery` | `estella-v-atmo-refinery` | `maintenance-estella-v-atmo-refinery` | `maintenance-estella-v-atmo-refinery-office` |
| `estella-v-capital-settlement` | `estella-v-capital-settlement` | `red-dust-mechanical-reclamation` | `red-dust-mechanical-reclamation-office` |
| `estella-v-open-cast-mine` | `estella-v-open-cast-mine` | `maintenance-estella-v-open-cast-mine` | `maintenance-estella-v-open-cast-mine-office` |
| `estella-v-abandoned-colony` | `estella-v-abandoned-colony` | `emergency-estella-v-abandoned-colony` | `emergency-estella-v-abandoned-colony-office` |
| `estella-v-storm-research` | `estella-v-storm-research` | `maintenance-estella-v-storm-research` | `maintenance-estella-v-storm-research-office` |
| `estella-va-strip-mine` | `estella-va-strip-mine` | `maintenance-estella-va-strip-mine` | `maintenance-estella-va-strip-mine-office` |
| `estella-va-ore-depot` | `estella-va-ore-handling-depot` | `maintenance-estella-va-ore-depot` | `maintenance-estella-va-ore-depot-office` |
| `estella-va-miner-hab` | `estella-va-miner-hab` | `maintenance-estella-va-miner-hab` | `maintenance-estella-va-miner-hab-office` |
| `estella-v-transit-station` | `estella-v-transit-customs` | `maintenance-estella-v-transit-station` | `maintenance-estella-v-transit-station-office` |
| `estella-vi-main-dispatch` | `estella-vi-main-transit-dispatch` | `maintenance-estella-vi-main-dispatch` | `maintenance-estella-vi-main-dispatch-office` |
| `estella-vi-foundry-complex` | `estella-vi-foundry-complex` | `maintenance-estella-vi-foundry-complex` | `maintenance-estella-vi-foundry-complex-office` |
| `estella-vi-heavy-cargo-dispatch` | `estella-vi-heavy-cargo-station` | `maintenance-estella-vi-heavy-cargo-dispatch` | `maintenance-estella-vi-heavy-cargo-dispatch-office` |
| `estella-vib-aquaculture` | `estella-vib-aquaculture` | `maintenance-estella-vib-aquaculture` | `maintenance-estella-vib-aquaculture-office` |
| `estella-vib-cold-chain-transit` | `estella-vib-cold-chain-station` | `maintenance-estella-vib-cold-chain-transit` | `maintenance-estella-vib-cold-chain-transit-office` |
| `estella-vib-vat-protein` | `estella-vib-vat-protein` | `maintenance-estella-vib-vat-protein` | `maintenance-estella-vib-vat-protein-office` |
| `estella-vib-pharma-horticulture` | `estella-vib-pharma-horticulture` | `maintenance-estella-vib-pharma-horticulture` | `maintenance-estella-vib-pharma-horticulture-office` |
| `estella-vi-mountain-mining` | `estella-vi-mountain-mining` | `maintenance-estella-vi-mountain-mining` | `maintenance-estella-vi-mountain-mining-office` |
| `estella-vi-agricultural-lowlands` | `estella-vi-agricultural-lowlands` | `maintenance-estella-vi-agricultural-lowlands` | `maintenance-estella-vi-agricultural-lowlands-office` |
| `estella-vi-polar-weather-research` | `estella-vi-polar-weather-research` | `maintenance-estella-vi-polar-weather-research` | `maintenance-estella-vi-polar-weather-research-office` |
| `estella-vi-industrial-city` | `estella-vi-industrial-city` | `maintenance-estella-vi-industrial-city` | `maintenance-estella-vi-industrial-city-office` |
| `estella-vi-spaceport` | `estella-vi-spaceport` | `maintenance-estella-vi-spaceport` | `maintenance-estella-vi-spaceport-office` |
| `estella-via-surface-anchor` | `estella-via-surface-anchor` | `maintenance-estella-via-surface-anchor` | `maintenance-estella-via-surface-anchor-office` |
| `estella-via-rare-alloy-extraction` | `estella-via-rare-alloy-extraction` | `maintenance-estella-via-rare-alloy-extraction` | `maintenance-estella-via-rare-alloy-extraction-office` |
| `estella-via-drydock` | `estella-via-drydock-station` | `maintenance-estella-via-drydock` | `maintenance-estella-via-drydock-office` |
| `estella-via-component-supply` | `estella-via-component-supply-station` | `maintenance-estella-via-component-supply` | `maintenance-estella-via-component-supply-office` |
| `estella-vii-black-project-outpost` | `estella-vii-black-project-outpost` | `emergency-estella-vii-black-project-outpost` | `emergency-estella-vii-black-project-outpost-office` |
| `estella-vii-high-vacuum-factory` | `estella-vii-high-vacuum-factory` | `maintenance-estella-vii-high-vacuum-factory` | `maintenance-estella-vii-high-vacuum-factory-office` |
| `estella-vii-worker-hab` | `estella-vii-worker-hab` | `maintenance-estella-vii-worker-hab` | `maintenance-estella-vii-worker-hab-office` |
| `estella-vii-transit-station` | `estella-vii-transit-export` | `maintenance-estella-vii-transit-station` | `maintenance-estella-vii-transit-station-office` |
| `estella-vii-feedstock-mine` | `estella-vii-feedstock-mine` | `maintenance-estella-vii-feedstock-mine` | `maintenance-estella-vii-feedstock-mine-office` |
| `estella-ii-commercial-hub` | `estella-ii-commercial-hub-dock` | `maintenance-estella-ii-commercial-hub` | `maintenance-estella-ii-commercial-hub-office` |
| `estella-ii-nimbus-crucible` | `estella-ii-nimbus-crucible` | `maintenance-estella-ii-nimbus-crucible` | `maintenance-estella-ii-nimbus-crucible-office` |
| `estella-ii-olympos` | `estella-ii-olympos` | `maintenance-estella-ii-olympos` | `maintenance-estella-ii-olympos-office` |
| `estella-ii-pandemonium` | `estella-ii-pandemonium` | `maintenance-estella-ii-pandemonium` | `maintenance-estella-ii-pandemonium-office` |
| `estella-i-low-orbit-station` | `estella-i-transit-customs` | `maintenance-estella-i-low-orbit-station` | `maintenance-estella-i-low-orbit-station-office` |
| `estella-i-refractory-mine` | `estella-i-refractory-mine` | `maintenance-estella-i-refractory-mine` | `maintenance-estella-i-refractory-mine-office` |
| `estella-i-hot-processing` | `estella-i-hot-processing` | `maintenance-estella-i-hot-processing` | `maintenance-estella-i-hot-processing-office` |
| `estella-i-worker-hab` | `estella-i-worker-hab` | `maintenance-estella-i-worker-hab` | `maintenance-estella-i-worker-hab-office` |
| `estella-iv-climate-poi-3` | `estella-iv-climate-poi-3` | `maintenance-estella-iv-climate-poi-3` | `maintenance-estella-iv-climate-poi-3-office` |
| `estella-iv-main-station` | `estella-iv-main-orbital-station` | `maintenance-estella-iv-main-station` | `maintenance-estella-iv-main-station-office` |
| `estella-iv-primary-city` | `estella-iv-primary-city` | `maintenance-estella-iv-primary-city` | `maintenance-estella-iv-primary-city-office` |
| `estella-iv-climate-poi-2` | `estella-iv-climate-poi-2` | `maintenance-estella-iv-climate-poi-2` | `maintenance-estella-iv-climate-poi-2-office` |
| `estella-iv-climate-poi-1` | `estella-iv-climate-poi-1` | `maintenance-estella-iv-climate-poi-1` | `maintenance-estella-iv-climate-poi-1-office` |
| `estella-iiia-helium-mining` | `estella-iiia-helium-mining` | `maintenance-estella-iiia-helium-mining` | `maintenance-estella-iiia-helium-mining-office` |
| `estella-iiia-heritage-site` | `estella-iiia-heritage-site` | `maintenance-estella-iiia-heritage-site` | `maintenance-estella-iiia-heritage-site-office` |
| `estella-iiia-main-port` | `estella-iiia-main-port-transit` | `maintenance-estella-iiia-main-port` | `maintenance-estella-iiia-main-port-office` |
| `estella-iiia-science-settlement` | `estella-iiia-science-settlement` | `maintenance-estella-iiia-science-settlement` | `maintenance-estella-iiia-science-settlement-office` |
| `estella-iii-polar-science` | `estella-iii-polar-science` | `maintenance-estella-iii-polar-science` | `maintenance-estella-iii-polar-science-office` |
| `estella-iii-luxury-habitat` | `estella-iii-luxury-orbital-habitat` | `maintenance-estella-iii-luxury-habitat` | `maintenance-estella-iii-luxury-habitat-office` |
| `estella-iii-coastal-resort` | `estella-iii-coastal-resort` | `maintenance-estella-iii-coastal-resort` | `maintenance-estella-iii-coastal-resort-office` |
| `estella-iii-capital-city` | `estella-iii-capital-city`; `estella-iii-finance-city`; `estella-iii-historic-site` | `maintenance-estella-iii-capital-city` | `maintenance-estella-iii-capital-city-office` |
| `estella-iii-main-customs-station` | `estella-iii-main-customs` | `maintenance-estella-iii-main-customs-station` | `maintenance-estella-iii-main-customs-station-office` |
| `estella-iii-high-tech-city` | `estella-iii-high-tech-city` | `maintenance-estella-iii-high-tech-city` | `maintenance-estella-iii-high-tech-city-office` |
| `estella-iii-agricultural-region` | `estella-iii-agricultural-region` | `maintenance-estella-iii-agricultural-region` | `maintenance-estella-iii-agricultural-region-office` |
| `skim-hub-alpha` | `skim-hub-alpha-precursor-dock` | `maintenance-skim-hub-alpha` | `maintenance-skim-hub-alpha-office` |
| `skim-hub-beta` | `skim-hub-beta-precursor-dock` | `maintenance-skim-hub-beta` | `maintenance-skim-hub-beta-office` |
| `estella-xiv-transit-dock-station` | `estella-xiv-transit-dock` | `maintenance-estella-xiv-transit-dock-station` | `maintenance-estella-xiv-transit-dock-station-office` |
| `estella-xiv-abandoned-active-site` | `estella-xiv-abandoned-active-site` | `emergency-estella-xiv-abandoned-active-site` | `emergency-estella-xiv-abandoned-active-site-office` |
| `estella-xiv-religious-retreat` | `estella-xiv-religious-retreat` | `emergency-estella-xiv-religious-retreat` | `emergency-estella-xiv-religious-retreat-office` |
| `estella-xiv-smuggler-haven` | `estella-xiv-smuggler-haven` | `maintenance-estella-xiv-smuggler-haven` | `maintenance-estella-xiv-smuggler-haven-office` |
| `reach-comet-fragment-1` | `reach-comet-fragment-1-poi` | `maintenance-reach-comet-fragment-1` | `maintenance-reach-comet-fragment-1-office` |
| `reach-comet-fragment-2` | `reach-comet-fragment-2-poi` | `emergency-reach-comet-fragment-2` | `emergency-reach-comet-fragment-2-office` |
| `reach-comet-fragment-3` | `reach-comet-fragment-3-poi` | `emergency-reach-comet-fragment-3` | `emergency-reach-comet-fragment-3-office` |
| `reach-comet-fragment-4` | `reach-comet-fragment-4-poi` | `maintenance-reach-comet-fragment-4` | `maintenance-reach-comet-fragment-4-office` |
| `reach-comet-fragment-5` | `reach-comet-fragment-5-poi` | `maintenance-reach-comet-fragment-5` | `maintenance-reach-comet-fragment-5-office` |
| `reach-comet-fragment-6` | `reach-comet-fragment-6-poi` | `maintenance-reach-comet-fragment-6` | `maintenance-reach-comet-fragment-6-office` |
| `reach-rogue-lonely-beacon` | `reach-rogue-lonely-beacon` | `maintenance-reach-rogue-lonely-beacon` | `maintenance-reach-rogue-lonely-beacon-office` |
| `reach-rogue-isotope-mine` | `reach-rogue-isotope-mine` | `maintenance-reach-rogue-isotope-mine` | `maintenance-reach-rogue-isotope-mine-office` |
| `deepest-dock-body` | `deepest-dock-poi` | `maintenance-deepest-dock-body` | `maintenance-deepest-dock-body-office` |
| `estella-xiii-classified-research` | `estella-xiii-classified-research` | `maintenance-estella-xiii-classified-research` | `maintenance-estella-xiii-classified-research-office` |
| `estella-xiii-governors-outpost` | `estella-xiii-governors-outpost` | `maintenance-estella-xiii-governors-outpost` | `maintenance-estella-xiii-governors-outpost-office` |
| `estella-xiii-deep-ice-mining` | `estella-xiii-deep-ice-mining` | `maintenance-estella-xiii-deep-ice-mining` | `maintenance-estella-xiii-deep-ice-mining-office` |
| `estella-xiii-prison-exile-colony` | `estella-xiii-prison-exile-colony` | `maintenance-estella-xiii-prison-exile-colony` | `maintenance-estella-xiii-prison-exile-colony-office` |
| `estella-xiii-main-port-station` | `estella-xiii-main-port` | `maintenance-estella-xiii-main-port-station` | `maintenance-estella-xiii-main-port-station-office` |
| `estella-xiii-long-range-observatory` | `estella-xiii-long-range-observatory` | `maintenance-estella-xiii-long-range-observatory` | `maintenance-estella-xiii-long-range-observatory-office` |
| `estella-xa-volatiles-transit` | `estella-xa-volatiles-transit` | `wells-frontier-outfitter-estella-xa-volatiles-transit` | `wells-frontier-outfitter-estella-xa-volatiles-transit-office` |
| `estella-xa-exobiology-research` | `estella-xa-exobiology-research` | `wells-frontier-outfitter-estella-xa-exobiology-research` | `wells-frontier-outfitter-estella-xa-exobiology-research-office` |
| `estella-xa-deep-ice-mine` | `estella-xa-deep-ice-mine` | `wells-frontier-outfitter-estella-xa-deep-ice-mine` | `wells-frontier-outfitter-estella-xa-deep-ice-mine-office` |
| `estella-xd-orbital-chem-station` | `estella-xd-chem-station` | `wells-frontier-outfitter-estella-xd-chem-station` | `wells-frontier-outfitter-estella-xd-chem-station-office` |
| `estella-xd-proving-grounds` | `estella-xd-proving-grounds` | `wells-frontier-outfitter-estella-xd-proving-grounds` | `wells-frontier-outfitter-estella-xd-proving-grounds-office` |
| `estella-xd-iron-lists` | `estella-xd-iron-lists` | `wells-frontier-outfitter-estella-xd-iron-lists` | `wells-frontier-outfitter-estella-xd-iron-lists-office` |
| `estella-xd-geothermal-extraction` | `estella-xd-geothermal-extraction` | `wells-frontier-outfitter-estella-xd-geothermal-extraction` | `wells-frontier-outfitter-estella-xd-geothermal-extraction-office` |
| `estella-xd-redoubt-field` | `estella-xd-redoubt-field` | `wells-frontier-outfitter-estella-xd-redoubt-field` | `wells-frontier-outfitter-estella-xd-redoubt-field-office` |
| `estella-x-skim-hub` | `estella-x-observation-skim-hub` | `vilar-gryphon-aerie-outfitter` | `vilar-gryphon-aerie-outfitter-office` |
| `estella-x-trojan-captive` | `estella-x-captive-refuel-relay` | `wells-frontier-outfitter-estella-x-captive-refuel-relay` | `wells-frontier-outfitter-estella-x-captive-refuel-relay-office` |
| `estella-xc-castle-alvares` | `estella-xc-castle-alvares` | `wells-frontier-outfitter-estella-xc-castle-alvares` | `wells-frontier-outfitter-estella-xc-castle-alvares-office` |
| `estella-xc-castle-mendes` | `estella-xc-castle-mendes` | `wells-frontier-outfitter-estella-xc-castle-mendes` | `wells-frontier-outfitter-estella-xc-castle-mendes-office` |
| `estella-xc-transit-refuel-station` | `estella-xc-transit-refuel` | `vilar-herald-gate-outfitter` | `vilar-herald-gate-outfitter-office` |
| `estella-xc-main-outpost` | `estella-xc-main-outpost` | `wells-frontier-outfitter-estella-xc-main-outpost` | `wells-frontier-outfitter-estella-xc-main-outpost-office` |
| `estella-xb-worker-hab` | `estella-xb-worker-hab` | `wells-frontier-outfitter-estella-xb-worker-hab` | `wells-frontier-outfitter-estella-xb-worker-hab-office` |
| `estella-xb-smelting-processing` | `estella-xb-smelting-processing` | `wells-frontier-outfitter-estella-xb-smelting-processing` | `wells-frontier-outfitter-estella-xb-smelting-processing-office` |
| `estella-xb-rare-element-mine` | `estella-xb-rare-element-mine` | `wells-frontier-outfitter-estella-xb-rare-element-mine` | `wells-frontier-outfitter-estella-xb-rare-element-mine-office` |
| `estella-xb-luxury-retreat` | `estella-xb-luxury-retreat` | `wells-frontier-outfitter-estella-xb-luxury-retreat` | `wells-frontier-outfitter-estella-xb-luxury-retreat-office` |
| `estella-xi-captive-science-waypoint` | `estella-xi-science-waypoint-poi` | `wells-frontier-outfitter-estella-xi-science-waypoint-poi` | `wells-frontier-outfitter-estella-xi-science-waypoint-poi-office` |
| `estella-xia-orbital-chem-station` | `estella-xia-chem-station` | `wells-frontier-outfitter-estella-xia-chem-station` | `wells-frontier-outfitter-estella-xia-chem-station-office` |
| `estella-xia-sealed-worker-hab` | `estella-xia-sealed-worker-hab` | `wells-frontier-outfitter-estella-xia-sealed-worker-hab` | `wells-frontier-outfitter-estella-xia-sealed-worker-hab-office` |
| `estella-xia-rare-element-extraction` | `estella-xia-rare-element-extraction` | `wells-frontier-outfitter-estella-xia-rare-element-extraction` | `wells-frontier-outfitter-estella-xia-rare-element-extraction-office` |
| `estella-xia-sulfur-mine` | `estella-xia-sulfur-mine` | `wells-frontier-outfitter-estella-xia-sulfur-mine` | `wells-frontier-outfitter-estella-xia-sulfur-mine-office` |
| `estella-xid-main-port-station` | `estella-xid-main-port` | `vilar-cadiz-highport-outfitter` | `vilar-cadiz-highport-outfitter-office` |
| `estella-xid-specialty-cargo` | `estella-xid-specialty-cargo` | `wells-frontier-outfitter-estella-xid-specialty-cargo` | `wells-frontier-outfitter-estella-xid-specialty-cargo-office` |
| `estella-xid-customs-transit` | `estella-xid-customs-transit` | `wells-frontier-outfitter-estella-xid-customs-transit` | `wells-frontier-outfitter-estella-xid-customs-transit-office` |
| `estella-xid-services-outfitter-hangar` | `estella-xid-services-outfitter-hangar` | `cadiz-armorial-shipwrights` | `cadiz-armorial-shipwrights-office` |
| `estella-xi-captive-religious-retreat` | `estella-xi-religious-retreat-poi` | `wells-frontier-outfitter-estella-xi-religious-retreat-poi` | `wells-frontier-outfitter-estella-xi-religious-retreat-poi-office` |
| `estella-xif-observatory` | `estella-xif-observatory` | `wells-frontier-outfitter-estella-xif-observatory` | `wells-frontier-outfitter-estella-xif-observatory-office` |
| `estella-xif-deep-listening-array` | `estella-xif-deep-listening-array` | `wells-frontier-outfitter-estella-xif-deep-listening-array` | `wells-frontier-outfitter-estella-xif-deep-listening-array-office` |
| `estella-xif-sealed-research-outpost` | `estella-xif-sealed-research-outpost` | `wells-frontier-outfitter-estella-xif-sealed-research-outpost` | `wells-frontier-outfitter-estella-xif-sealed-research-outpost-office` |
| `estella-xi-industrial-skim-hub` | `estella-xi-skim-hub` | `vilar-hydra-maw-outfitter` | `vilar-hydra-maw-outfitter-office` |
| `estella-xic-ice-mining` | `estella-xic-ice-mining` | `wells-frontier-outfitter-estella-xic-ice-mining` | `wells-frontier-outfitter-estella-xic-ice-mining-office` |
| `estella-xic-deep-ice-exobiology` | `estella-xic-deep-ice-exobiology` | `wells-frontier-outfitter-estella-xic-deep-ice-exobiology` | `wells-frontier-outfitter-estella-xic-deep-ice-exobiology-office` |
| `estella-xic-research-station` | `estella-xic-research-station-poi` | `vilar-macao-palace-outfitter` | `vilar-macao-palace-outfitter-office` |
| `estella-xic-last-breath-lists` | `estella-xic-last-breath-lists` | `wells-frontier-outfitter-estella-xic-last-breath-lists` | `wells-frontier-outfitter-estella-xic-last-breath-lists-office` |
| `estella-xib-hydrocarbon-extraction` | `estella-xib-hydrocarbon-extraction` | `wells-frontier-outfitter-estella-xib-hydrocarbon-extraction` | `wells-frontier-outfitter-estella-xib-hydrocarbon-extraction-office` |
| `estella-xib-methane-refinery` | `estella-xib-methane-refinery` | `wells-frontier-outfitter-estella-xib-methane-refinery` | `wells-frontier-outfitter-estella-xib-methane-refinery-office` |
| `estella-xib-science-settlement` | `estella-xib-science-settlement` | `wells-frontier-outfitter-estella-xib-science-settlement` | `wells-frontier-outfitter-estella-xib-science-settlement-office` |
| `estella-xib-cryo-transit` | `estella-xib-cryo-transit` | `wells-frontier-outfitter-estella-xib-cryo-transit` | `wells-frontier-outfitter-estella-xib-cryo-transit-office` |
| `estella-xib-organic-chemistry` | `estella-xib-organic-chemistry` | `wells-frontier-outfitter-estella-xib-organic-chemistry` | `wells-frontier-outfitter-estella-xib-organic-chemistry-office` |
| `estella-xie-component-fabrication` | `estella-xie-component-fabrication` | `wells-frontier-outfitter-estella-xie-component-fabrication` | `wells-frontier-outfitter-estella-xie-component-fabrication-office` |
| `estella-xie-rare-alloy-extraction` | `estella-xie-rare-alloy-extraction` | `keelwright-works-seconds-gate` | `keelwright-works-seconds-gate-directory` |
| `estella-xie-oathmark-academy` | `estella-xie-oathmark-academy` | `oathmark-academy-high-pennant-yard` | `oathmark-academy-high-pennant-yard-directory` |
| `estella-xie-outer-spec-drydock-station` | `estella-xie-outer-spec-drydock` | `serrat-domain-civil-refit-office` | `serrat-domain-civil-refit-office-directory` |
| `estella-xi-captive-fence` | `estella-xi-fence-poi` | `wells-frontier-outfitter-estella-xi-fence-poi` | `wells-frontier-outfitter-estella-xi-fence-poi-office` |
| `estella-xi-captive-smuggler-deaddrop` | `estella-xi-smuggler-deaddrop-poi` | `wells-frontier-outfitter-estella-xi-smuggler-deaddrop-poi` | `wells-frontier-outfitter-estella-xi-smuggler-deaddrop-poi-office` |
| `estella-xiid-blackglass-observatory` | `estella-xiid-blackglass-observatory` | `wells-frontier-outfitter-estella-xiid-blackglass-observatory` | `wells-frontier-outfitter-estella-xiid-blackglass-observatory-office` |
| `estella-xiid-black-project-exile` | `estella-xiid-black-project-exile` | `wells-frontier-outfitter-estella-xiid-black-project-exile` | `wells-frontier-outfitter-estella-xiid-black-project-exile-office` |
| `estella-xiid-mirror-clinic` | `estella-xiid-mirror-clinic` | `wells-frontier-outfitter-estella-xiid-mirror-clinic` | `wells-frontier-outfitter-estella-xiid-mirror-clinic-office` |
| `estella-xii-observation-post-station` | `estella-xii-observation-post` | `vilar-manticore-observatory-outfitter` | `vilar-manticore-observatory-outfitter-office` |
| `estella-xiia-isolated-settlement` | `estella-xiia-isolated-settlement` | `wells-frontier-outfitter-estella-xiia-isolated-settlement` | `wells-frontier-outfitter-estella-xiia-isolated-settlement-office` |
| `estella-xiia-volatiles-transit` | `estella-xiia-volatiles-transit` | `wells-frontier-outfitter-estella-xiia-volatiles-transit` | `wells-frontier-outfitter-estella-xiia-volatiles-transit-office` |
| `estella-xiia-deep-ice-mine` | `estella-xiia-deep-ice-mine` | `wells-frontier-outfitter-estella-xiia-deep-ice-mine` | `wells-frontier-outfitter-estella-xiia-deep-ice-mine-office` |
| `estella-xii-captive-smuggler-waypoint` | `estella-xii-smuggler-waypoint-poi` | `wells-frontier-outfitter-estella-xii-smuggler-waypoint-poi` | `wells-frontier-outfitter-estella-xii-smuggler-waypoint-poi-office` |
| `estella-xiic-isotope-mining` | `estella-xiic-isotope-mining` | `wells-frontier-outfitter-estella-xiic-isotope-mining` | `wells-frontier-outfitter-estella-xiic-isotope-mining-office` |
| `estella-xiic-castle-teide` | `estella-xiic-castle-teide` | `wells-frontier-outfitter-estella-xiic-castle-teide` | `wells-frontier-outfitter-estella-xiic-castle-teide-office` |
| `estella-xiic-comet-research` | `estella-xiic-comet-research` | `wells-frontier-outfitter-estella-xiic-comet-research` | `wells-frontier-outfitter-estella-xiic-comet-research-office` |
| `estella-xii-captive-comm-relay` | `estella-xii-comm-relay-poi` | `wells-frontier-outfitter-estella-xii-comm-relay-poi` | `wells-frontier-outfitter-estella-xii-comm-relay-poi-office` |
| `estella-xiib-transit-station` | `estella-xiib-transit-station-poi` | `wells-frontier-outfitter-estella-xiib-transit-station-poi` | `wells-frontier-outfitter-estella-xiib-transit-station-poi-office` |
| `estella-xiib-outpost` | `estella-xiib-outpost` | `wells-frontier-outfitter-estella-xiib-outpost` | `wells-frontier-outfitter-estella-xiib-outpost-office` |

## 8. Approval and implementation gate

Runtime verification: `node tests/audit-maintenance-stage-3-copy.mjs` now passes **7,780 checks** against this approved copy plus 25 Stage 4 and two Stage 5 overrides, the catalog and review roster. All names, directories, accounts and service terms are checked, along with 281 historical / 279 active referral lines. The other 157 facility definitions and quotes match the independent pre-Stage-5 fingerprints. The Stage 3 rollout is also covered by gameplay tests and the isolated desktop walkthrough described in the [handoff](maintenance-stage-3.md).

- This Markdown is the complete approved Stage 3 copy, including all reused shop sets and all local exceptions. It is not loaded by the game.
- Review names, voice, institutional fit, shared text, referrals and every location assignment here. Preserve each `zzz` comment and record the resolution beside it.
- Explicit copy approval received on 2026-10-26 Pacific; the exact sets/mappings and everyday terms are implemented and checked against this document. No unreviewed generated variants or additional NPCs were added.
- Physical scopes, branch accounts, hidden classifications, private access, actual equipment/work capabilities, grounded-only emergency recovery and final runtime copy are audited. Desktop verification used isolated synthetic profiles, never live saves.
- Stages 3 and 4 reviews passed; Stage 5 is implemented and awaits final network review. No automatic further expansion.
