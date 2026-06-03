/* global React */
// Lucide-style inline icons. Stroke 1.5, currentColor, 24x24 viewBox.
// Sized by CSS (svg.svgicon { width: 18, height: 18 }).

const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "svgicon"
};

const I = {
  dashboard: () => <svg {...svgProps}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  doc:       () => <svg {...svgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>,
  box:       () => <svg {...svgProps}><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>,
  stack:     () => <svg {...svgProps}><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>,
  coin:      () => <svg {...svgProps}><circle cx="12" cy="12" r="9"/><path d="M12 6v12M9 9h4.5a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4h5"/></svg>,
  users:     () => <svg {...svgProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  cog:       () => <svg {...svgProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.5 1z"/></svg>,
  search:    () => <svg {...svgProps}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  plus:      () => <svg {...svgProps}><path d="M12 5v14M5 12h14"/></svg>,
  trash:     () => <svg {...svgProps}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  send:      () => <svg {...svgProps}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>,
  close:     () => <svg {...svgProps}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  arrowUp:   () => <svg {...svgProps}><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>,
  arrowDown: () => <svg {...svgProps}><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>,
  chev:      () => <svg {...svgProps}><path d="m9 18 6-6-6-6"/></svg>,
  bell:      () => <svg {...svgProps}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  download:  () => <svg {...svgProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>,
  filter:    () => <svg {...svgProps}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>,
  check:     () => <svg {...svgProps}><path d="M20 6 9 17l-5-5"/></svg>,
  more:      () => <svg {...svgProps}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  logout:    () => <svg {...svgProps}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>,
  calendar:  () => <svg {...svgProps}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  arrowRight:() => <svg {...svgProps}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  grip:      () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="svgicon"><circle cx="9" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="15" cy="18" r="1.3"/></svg>,
  docDashed: () => <svg {...svgProps}><path strokeDasharray="3 3" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path strokeDasharray="3 3" d="M14 2v6h6"/></svg>,
  back:      () => <svg {...svgProps}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>,
};

window.I = I;
