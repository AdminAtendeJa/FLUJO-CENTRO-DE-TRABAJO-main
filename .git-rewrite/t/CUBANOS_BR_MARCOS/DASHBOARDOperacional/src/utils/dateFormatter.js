export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    // Add timezone offset so it doesn't shift days
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
};
