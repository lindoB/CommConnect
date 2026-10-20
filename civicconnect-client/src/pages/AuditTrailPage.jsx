
import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import { apiRequest } from '../services/api';

const PAGE_SIZE = 50;

function displayDetails(details) {
  if (typeof details === 'string') return details;
  if (details == null) return '';
  return JSON.stringify(details);
}

function csvValue(value) {
  const text = String(value ?? '');
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export default function AuditTrailPage() {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE)
    });

    if (from) params.set('from', from);
    if (to) params.set('to', to);

    apiRequest('/audit-logs?' + params.toString())
      .then(result => {
        if (!active) return;

        setEvents(result.data || []);
        setTotal(result.total || 0);
        setError('');
      })
      .catch(err => {
        if (!active) return;

        setEvents([]);
        setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, from, to]);

  const filtered = events.filter(event =>
    [
      event.actorName,
      event.action,
      event.entityType,
      event.entityId,
      displayDetails(event.details)
    ]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function exportCsv() {
    const rows = [
      [
        'Actor',
        'Action',
        'Record type',
        'Record ID',
        'Timestamp',
        'Details'
      ],
      ...filtered.map(event => [
        event.actorName || 'System',
        event.action,
        event.entityType,
        event.entityId,
        event.createdAt,
        displayDetails(event.details)
      ])
    ];

    const csv = rows
      .map(row => row.map(csvValue).join(','))
      .join('\r\n');

    const url = URL.createObjectURL(
      new Blob([csv], {
        type: 'text/csv;charset=utf-8'
      })
    );

    const link = document.createElement('a');
    link.href = url;
    link.download = `civicconnect-audit-page-${page}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Audit trail
          </Typography>

          <Typography color="text.secondary">
            Actual activities recorded in MongoDB
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={exportCsv}
            disabled={!filtered.length}
          >
            Export visible CSV
          </Button>

          <Button
            variant="contained"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load audit records: {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            label="Search current page"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          <TextField
            size="small"
            label="From (UTC)"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={from}
            onChange={e => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />

          <TextField
            size="small"
            label="To (UTC)"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={to}
            onChange={e => {
              setTo(e.target.value);
              setPage(1);
            }}
          />

          <Chip label={`${total} stored events`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {[
                'Actor',
                'Action',
                'Record',
                'Timestamp',
                'Details'
              ].map(header => (
                <TableCell key={header}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map(event => (
              <TableRow key={event._id}>
                <TableCell>
                  {event.actorName || 'System'}
                </TableCell>

                <TableCell>
                  <Chip
                    label={event.action}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  {event.entityType}
                  {event.entityId
                    ? ` / ${event.entityId}`
                    : ''}
                </TableCell>

                <TableCell>
                  {event.createdAt
                    ? new Date(event.createdAt).toLocaleString()
                    : '—'}
                </TableCell>

                <TableCell
                  sx={{
                    maxWidth: 360,
                    overflowWrap: 'anywhere'
                  }}
                >
                  {displayDetails(event.details)}
                </TableCell>
              </TableRow>
            ))}

            {!loading && !filtered.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  No audit records found.
                </TableCell>
              </TableRow>
            )}

            {loading && (
              <TableRow>
                <TableCell colSpan={5}>
                  Loading audit records…
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Button
          disabled={page === 1 || loading}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>

        <Typography>
          Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </Typography>

        <Button
          disabled={page * PAGE_SIZE >= total || loading}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </Stack>
    </Box>
  );
}
