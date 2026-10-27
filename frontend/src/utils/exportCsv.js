


export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) return;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => escapeCSV(h.label)).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => escapeCSV(typeof h.accessor === 'function' ? h.accessor(row) : row[h.accessor])).join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headerLine, ...rowLines].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

