// سلوك بسيط بدون مكتبات (متوافق مع CSP)
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-print]')) window.print();
});
document.addEventListener('submit', (e) => {
  const m = e.target.getAttribute && e.target.getAttribute('data-confirm');
  if (m && !confirm(m)) e.preventDefault();
});
// تاريخ المغادرة يبدأ من اليوم التالي للوصول
document.querySelectorAll('input[name=in]').forEach((i) => {
  const o = i.form && i.form.querySelector('input[name=out]');
  if (!o) return;
  i.addEventListener('change', () => {
    if (!i.value) return;
    const d = new Date(i.value + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
    const min = d.toISOString().slice(0, 10);
    o.min = min; if (!o.value || o.value < min) o.value = min;
  });
});
document.addEventListener('focusin', (e) => { if (e.target.matches && e.target.matches('[data-select]')) e.target.select(); });
