const screenNames = ["Entry", "Summary", "Workspace", "Bulk edit", "Validation", "Success"];
const initialShipments = [
  { id: "001", pieces: 12, weight: "248 kg", commodity: "Precision components", flight: "SQ 211", destination: "SIN", selected: true },
  { id: "002", pieces: 8, weight: "186 kg", commodity: "Optical equipment", flight: "SQ 211", destination: "SIN", selected: true },
  { id: "003", pieces: 16, weight: "302 kg", commodity: "Medical supplies", flight: "", destination: "SIN", selected: false },
  { id: "004", pieces: 5, weight: "94 kg", commodity: "", flight: "SQ 211", destination: "SIN", selected: false }
];

const prototypeProgress = document.querySelector("#prototype-progress");
const prototypeBody = document.querySelector("#prototype-body");
const prototypeStatus = document.querySelector("#prototype-status");
const backButton = document.querySelector("#prototype-back");
const nextButton = document.querySelector("#prototype-next");
let activeStage = 0;
let shipments = cloneShipments();
let submitted = false;

function cloneShipments() {
  return initialShipments.map((shipment) => ({ ...shipment }));
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function selectedShipments() {
  return shipments.filter((shipment) => shipment.selected);
}

function unresolvedIssues() {
  return [
    ...shipments.filter((shipment) => !shipment.flight).map((shipment) => ({ id: shipment.id, key: "flight", title: "Flight not selected", detail: `AWB ${shipment.id} · Flight` })),
    ...shipments.filter((shipment) => !shipment.commodity).map((shipment) => ({ id: shipment.id, key: "commodity", title: "Commodity description missing", detail: `AWB ${shipment.id} · Commodity` }))
  ];
}

function shipmentRows() {
  return shipments.map((shipment) => {
    const hasIssue = !shipment.flight || !shipment.commodity;
    return `<tr class="${shipment.selected ? "selected" : ""}">
      <td><input type="checkbox" data-select-shipment="${shipment.id}" aria-label="Select AWB ${shipment.id}" ${shipment.selected ? "checked" : ""}></td>
      <td><span class="demo-awb">AWB-${shipment.id}</span></td><td>${shipment.pieces}</td><td>${shipment.weight}</td>
      <td>${shipment.commodity ? safeText(shipment.commodity) : '<span class="status-review">Missing</span>'}</td>
      <td>${shipment.flight ? safeText(shipment.flight) : '<span class="status-review">Not set</span>'}</td>
      <td><span class="demo-status ${hasIssue ? "status-review" : ""}">${hasIssue ? "REVIEW" : "DRAFT"}</span></td>
    </tr>`;
  }).join("");
}

function renderEntry() {
  return `<div class="demo-screen">
    <div class="demo-eyebrow">STEP 01 / CREATE A SHARED STARTING POINT</div>
    <h3 class="demo-title">What are you booking today?</h3>
    <p class="demo-subtitle">Describe the batch in your own words. This demo uses a fixed sample batch; no AI request is sent.</p>
    <div class="demo-entry-grid">
      <div class="demo-panel"><label class="demo-panel-label" for="booking-prompt">BOOKING REQUEST</label><textarea class="demo-prompt" id="booking-prompt">Create 4 export shipments to Singapore for Northstar Components. Use the same requested flight where possible.</textarea><div class="demo-chips"><span class="demo-chip">+ Add source document</span><span class="demo-chip">Template · Export / APAC</span></div><button class="demo-primary" data-action="generate" type="button">Generate draft batch <span>→</span></button></div>
      <div class="demo-panel"><span class="demo-panel-label">SHARED DETAILS TO REVIEW</span><ul class="demo-info-list"><li><span>SHIPMENT TYPE</span>Air export</li><li><span>DESTINATION</span>Singapore (SIN)</li><li><span>REQUESTED DATE</span>18 Nov 2026</li><li><span>SHIPPER</span>Northstar Components · sample</li></ul></div>
    </div>
  </div>`;
}

function renderSummary() {
  const prompt = document.querySelector("#booking-prompt")?.value || "Create 4 export shipments to Singapore";
  return `<div class="demo-screen">
    <div class="demo-eyebrow">STEP 02 / REVIEW BEFORE CREATING</div>
    <h3 class="demo-title">Here’s the draft I prepared.</h3>
    <p class="demo-subtitle">Generated summary is illustrative. Confirm the shared details before opening the batch workspace.</p>
    <div class="summary-grid"><div class="summary-cell"><span>SHIPMENT COUNT</span><strong>4 draft AWBs</strong></div><div class="summary-cell"><span>DESTINATION</span><strong>Singapore · SIN</strong></div><div class="summary-cell"><span>REQUESTED DATE</span><strong>18 Nov 2026</strong></div></div>
    <div class="demo-panel"><span class="demo-panel-label">REQUEST RECEIVED (SAMPLE)</span><p style="margin:0;color:#58655f;font-size:10px">“${safeText(prompt)}”</p></div>
    <div class="summary-note" style="margin-top:10px"><b>!</b><span>2 fields need review before submission: one flight and one commodity description. You can fix these in the workspace.</span></div>
    <button class="demo-primary" data-action="open-workspace" type="button">Review 4 draft AWBs <span>→</span></button>
  </div>`;
}

function renderWorkspace() {
  const selectedCount = selectedShipments().length;
  const issueCount = unresolvedIssues().length;
  return `<div class="demo-screen">
    <div class="demo-eyebrow">STEP 03 / KEEP THE BATCH IN VIEW</div>
    <div class="demo-toolbar"><div><h3 class="demo-title" style="margin:0">Singapore export batch</h3><span class="demo-status">4 AWBs</span></div><div><button class="demo-secondary" data-action="bulk-edit" type="button" ${selectedCount ? "" : "disabled"}>Edit ${selectedCount} selected</button><button class="demo-primary" style="margin:0" data-action="validate" type="button">Validate batch <span>→</span></button></div></div>
    <div class="demo-batch-stats"><div><strong>04</strong><span>draft AWBs</span></div><div><strong>${issueCount}</strong><span>open blockers</span></div><div><strong>18 Nov</strong><span>requested date</span></div></div>
    <div class="demo-table-wrap" style="margin-top:12px"><table class="demo-table"><thead><tr><th><input type="checkbox" data-select-all aria-label="Select all shipments" ${selectedCount === shipments.length ? "checked" : ""}></th><th>AWB</th><th>PCS</th><th>WEIGHT</th><th>COMMODITY</th><th>FLIGHT</th><th>STATUS</th></tr></thead><tbody>${shipmentRows()}</tbody></table></div>
    <div class="demo-meta-row"><span><b>${selectedCount}</b> selected</span><span>Shared data stays editable per AWB</span><span>Sample data only</span></div>
  </div>`;
}

function renderBulkEdit() {
  const selectedCount = selectedShipments().length;
  const selectedIds = selectedShipments().map((shipment) => shipment.id).join(", ") || "none";
  return `<div class="demo-screen">
    <div class="demo-eyebrow">STEP 04 / CONFIRM THE SCOPE OF CHANGE</div>
    <h3 class="demo-title">Bulk edit selected AWBs</h3>
    <p class="demo-subtitle">Only the fields you change below will be applied to the selected shipments.</p>
    <div class="bulk-layout"><div class="selection-card"><span>APPLYING TO</span><strong>${selectedCount} AWBs</strong><p>AWB ${safeText(selectedIds)}</p><p style="margin-top:8px">Review the affected rows in the workspace after applying.</p></div><form class="bulk-form" id="bulk-edit-form"><label>Flight suggestion<select name="flight"><option value="">Keep current value</option><option value="SQ 211">SQ 211 · suggested</option><option value="SQ 215">SQ 215 · alternative</option></select></label><label>Requested date<input name="date" type="date" value="2026-11-18"></label><label>Handling instruction<select name="handling"><option value="">Keep current value</option><option value="General cargo">General cargo</option><option value="Temperature controlled">Temperature controlled</option></select></label><label>Reference note<input name="reference" type="text" placeholder="Optional shared reference"></label><div class="form-actions"><p>Changes will update ${selectedCount} selected rows.</p><button class="demo-primary" style="margin:0" type="submit" ${selectedCount ? "" : "disabled"}>Apply to selection <span>→</span></button></div></form></div>
  </div>`;
}

function renderValidation() {
  const issues = unresolvedIssues();
  const issueRows = issues.length ? issues.map((issue) => `<div class="issue-item"><span class="issue-mark">!</span><div><strong>${issue.title}</strong><small>${issue.detail}</small></div><button type="button" data-fix="${issue.key}" data-shipment="${issue.id}">${issue.key === "flight" ? "Apply sample flight" : "Add sample description"}</button></div>`).join("") : '<div class="issue-item resolved"><span class="issue-mark">✓</span><div><strong>No blocking issues</strong><small>All required sample fields are present.</small></div><span class="demo-status">READY</span></div>';
  return `<div class="demo-screen">
    <div class="demo-eyebrow">STEP 05 / RESOLVE BEFORE SUBMITTING</div>
    <h3 class="demo-title">Validation center</h3>
    <p class="demo-subtitle">Each blocker points to a specific shipment and field. Fixes below are synthetic demo actions.</p>
    <div class="validation-layout"><div class="validation-summary"><span>BATCH READINESS</span><div class="validation-score"><strong>${issues.length ? "Review" : "Ready"}</strong><span>${issues.length ? "before submit" : "to submit"}</span></div><div class="validation-counts"><span class="count-error">${issues.length} blockers</span><span>1 advisory</span></div></div><div class="issue-list">${issueRows}<div class="issue-item resolved"><span class="issue-mark">i</span><div><strong>Confirm requested flight date</strong><small>Advisory · Review availability in your live system.</small></div><span class="demo-status">ADVISORY</span></div></div></div>
    <div class="demo-meta-row"><span>Blockers must be resolved to simulate submission.</span><span>AI suggestions require operator review in a real system.</span></div>
  </div>`;
}

function renderSuccess() {
  return `<div class="demo-screen">
    <div class="demo-eyebrow">STEP 06 / REVIEW THE OUTCOME</div>
    <div class="success-layout"><div class="success-emblem"><div>✓</div><strong>Sample batch submitted</strong><span>SIMULATED SUCCESS STATE</span></div><div class="success-details"><div class="success-reference"><span>DEMO CONFIRMATION</span><strong>SIM-2048-01</strong></div><div class="success-kpis"><div><strong>${shipments.length}</strong><span>AWBs submitted</span></div><div><strong>0</strong><span>blockers open</span></div><div><strong>1</strong><span>advisory to review</span></div></div><p>This is a simulated confirmation only. No booking was sent to CargoWise or an airline.</p><button class="demo-secondary" data-action="reset" type="button" style="margin-top:12px">Start another demo batch</button></div></div>
  </div>`;
}

const screenRenderers = [renderEntry, renderSummary, renderWorkspace, renderBulkEdit, renderValidation, renderSuccess];

function renderProgress() {
  prototypeProgress.innerHTML = screenNames.map((name, index) => `<button class="prototype-tab ${activeStage === index ? "active" : ""}" type="button" role="tab" aria-selected="${activeStage === index}" aria-controls="prototype-body" data-stage="${index}" ${index > activeStage + 1 ? "disabled" : ""}><span class="prototype-tab-number">${String(index + 1).padStart(2, "0")}</span><span class="prototype-tab-label">${name}</span></button>`).join("");
}

function renderPrototype() {
  renderProgress();
  prototypeBody.innerHTML = screenRenderers[activeStage]();
  prototypeBody.setAttribute("aria-label", `${screenNames[activeStage]} prototype screen`);
  prototypeStatus.textContent = activeStage === 5 && submitted ? "SIMULATED SUBMISSION · NO LIVE SYSTEM CONNECTION" : "CONCEPT PROTOTYPE · SYNTHETIC SHIPMENT DATA";
  backButton.disabled = activeStage === 0;
  nextButton.hidden = activeStage === 5;
  const actions = ["Generate batch →", "Open workspace →", "Review validation →", "Return to workspace →", "Review outcome →"];
  nextButton.textContent = actions[activeStage] || "Continue →";
  nextButton.setAttribute("aria-label", nextButton.textContent.replace("→", "").trim());
  nextButton.dataset.action = ["generate", "open-workspace", "validate", "back-workspace", "submit"][activeStage] || "submit";
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2800);
}

function goToStage(stage) {
  activeStage = Math.max(0, Math.min(5, stage));
  renderPrototype();
}

function handleAction(action, target) {
  if (action === "generate") return goToStage(1);
  if (action === "open-workspace") return goToStage(2);
  if (action === "bulk-edit") {
    if (!selectedShipments().length) return showToast("Select at least one AWB before bulk editing.");
    return goToStage(3);
  }
  if (action === "validate") return goToStage(4);
  if (action === "back-workspace") return goToStage(2);
  if (action === "reset") return resetPrototype();
  if (action === "submit") {
    if (unresolvedIssues().length) {
      goToStage(4);
      return showToast("Resolve the blocking validation issues before submitting this sample batch.");
    }
    submitted = true;
    return goToStage(5);
  }
  if (action === "fix") {
    const shipment = shipments.find((item) => item.id === target.dataset.shipment);
    if (!shipment) return;
    if (target.dataset.fix === "flight") shipment.flight = "SQ 211";
    if (target.dataset.fix === "commodity") shipment.commodity = "General cargo (sample)";
    renderPrototype();
    showToast(`Sample ${target.dataset.fix} added to AWB ${shipment.id}.`);
  }
}

function resetPrototype() {
  shipments = cloneShipments();
  submitted = false;
  goToStage(0);
  document.querySelector("#booking-prompt").value = "Create 4 export shipments to Singapore for Northstar Components. Use the same requested flight where possible.";
  showToast("Demo reset to the original sample data.");
}

prototypeProgress.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-stage]");
  if (tab && !tab.disabled) goToStage(Number(tab.dataset.stage));
});

prototypeBody.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action], [data-fix]");
  if (actionTarget) handleAction(actionTarget.dataset.action || "fix", actionTarget);
});

prototypeBody.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-select-shipment]");
  if (checkbox) {
    const shipment = shipments.find((item) => item.id === checkbox.dataset.selectShipment);
    if (shipment) shipment.selected = checkbox.checked;
    renderPrototype();
  }
  if (event.target.matches("[data-select-all]")) {
    shipments.forEach((shipment) => { shipment.selected = event.target.checked; });
    renderPrototype();
  }
});

prototypeBody.addEventListener("submit", (event) => {
  if (!event.target.matches("#bulk-edit-form")) return;
  event.preventDefault();
  const values = new FormData(event.target);
  const flight = values.get("flight");
  const selected = selectedShipments();
  selected.forEach((shipment) => { if (flight) shipment.flight = flight; });
  goToStage(2);
  showToast(`${selected.length} sample AWB${selected.length === 1 ? "" : "s"} updated. Review the affected rows.`);
});

backButton.addEventListener("click", () => goToStage(activeStage - 1));
nextButton.addEventListener("click", () => handleAction(nextButton.dataset.action));
document.querySelector("#reset-prototype").addEventListener("click", resetPrototype);

document.querySelectorAll("[data-jump-stage]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#prototype").scrollIntoView({ behavior: "smooth", block: "start" });
    goToStage(Number(button.dataset.jumpStage));
  });
});

const chapterLinks = [...document.querySelectorAll("[data-chapter]")];
const chapters = chapterLinks.map((link) => document.getElementById(link.dataset.chapter)).filter(Boolean);
const chapterCount = document.querySelector("#chapter-count");
const chapterObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const currentIndex = chapters.indexOf(visible.target);
  chapterLinks.forEach((link, index) => {
    const isActive = index === currentIndex;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  chapterCount.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
}, { rootMargin: "-20% 0px -65% 0px", threshold: [0, .1, .25, .5] });
chapters.forEach((chapter) => chapterObserver.observe(chapter));
renderPrototype();