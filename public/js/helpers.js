function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function statusBadge(estado) {
  const safe = escapeHtml(estado.toLowerCase());
  return `<span class="status-badge status-${safe}">${escapeHtml(estado)}</span>`;
}
