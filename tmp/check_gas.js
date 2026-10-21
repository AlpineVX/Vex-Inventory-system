async function main() {
  const res = await fetch('https://script.google.com/macros/s/AKfycbwjICL8-PwBQO9uXkpvE9RjoAygAKiG5JTizLE5e6yGE2KPMKYlal1w0qCj-75pK63qpQ/exec');
  const d = await res.json();
  const items = d.inventory || [];
  console.log('Total items in raw response:', items.length);
  const bySource = {};
  items.forEach(it => {
    const src = it.sheetSource || 'UNKNOWN';
    if (!bySource[src]) bySource[src] = [];
    bySource[src].push(it);
  });
  console.log('Sheet sources count:', Object.keys(bySource).map(k => k + ': ' + bySource[k].length));
  for (const [src, list] of Object.entries(bySource)) {
    console.log('=== ' + src + ' (sample 2 items) ===');
    console.log(JSON.stringify(list.slice(0, 2), null, 2));
  }
}
main().catch(console.error);
