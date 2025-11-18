import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { Search, Add, Delete, FileUpload } from '@mui/icons-material';
import { PV } from '../types';
import { PVFilterSidebar, PVFilters } from '../components/PVFilterSidebar';

interface PVBrowserPageProps {
  pvs: PV[];
  onAddPV?: () => void;
  onImportPVs?: () => void;
  onDeletePV?: (pv: PV) => void;
  onPVClick?: (pv: PV) => void;
  isAdmin?: boolean;
}

export const PVBrowserPage: React.FC<PVBrowserPageProps> = ({
  pvs,
  onAddPV,
  onImportPVs,
  onDeletePV,
  onPVClick,
  isAdmin = false,
}) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<PVFilters>({
    devices: [],
    tags: [],
    status: [],
    searchTerm: '',
  });

  // Extract unique devices and tags from PVs
  const availableDevices = useMemo(() => {
    const devices = new Set(pvs.map((pv) => pv.device));
    return Array.from(devices).sort();
  }, [pvs]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    pvs.forEach((pv) => {
      Object.values(pv.tags).forEach((tagSet: any) => {
        if (typeof tagSet === 'object') {
          Object.values(tagSet).forEach((t) => {
            if (typeof t === 'string') tags.add(t);
          });
        }
      });
    });
    return Array.from(tags).sort();
  }, [pvs]);

  const filteredPVs = useMemo(() => {
    let result = pvs;

    // Apply search filter
    if (searchText) {
      const lowerFilter = searchText.toLowerCase();
      result = result.filter(
        (pv) =>
          pv.setpoint.toLowerCase().includes(lowerFilter) ||
          pv.device.toLowerCase().includes(lowerFilter) ||
          pv.description.toLowerCase().includes(lowerFilter)
      );
    }

    // Apply device filter
    if (filters.devices.length > 0) {
      result = result.filter((pv) => filters.devices.includes(pv.device));
    }

    // Apply tags filter
    if (filters.tags.length > 0) {
      result = result.filter((pv) => {
        const pvTags: string[] = [];
        Object.values(pv.tags).forEach((tagSet: any) => {
          if (typeof tagSet === 'object') {
            Object.values(tagSet).forEach((t) => {
              if (typeof t === 'string') pvTags.push(t);
            });
          }
        });
        return filters.tags.some((tag) => pvTags.includes(tag));
      });
    }

    // Apply status filter (based on severity)
    if (filters.status.length > 0) {
      result = result.filter((pv) => {
        const status = pv.setpoint_data?.status?.toString() || 'NO_ALARM';
        return filters.status.includes(status);
      });
    }

    return result;
  }, [pvs, searchText, filters]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') return value.toFixed(3);
    return String(value);
  };

  // Extract unique tags for display
  const getTags = (pv: PV): string[] => {
    const tags: string[] = [];
    Object.values(pv.tags).forEach((tagSet: any) => {
      if (typeof tagSet === 'object') {
        tags.push(...Object.values(tagSet).filter((t): t is string => typeof t === 'string'));
      }
    });
    return tags;
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Filter Sidebar */}
      <PVFilterSidebar
        availableDevices={availableDevices}
        availableTags={availableTags}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2, overflow: 'hidden' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
          <TextField
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search PVs..."
            size="small"
            sx={{ maxWidth: 400, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
            {isAdmin && onAddPV && (
              <Button variant="outlined" startIcon={<Add />} onClick={onAddPV} size="medium">
                Add PV
              </Button>
            )}
            {isAdmin && onImportPVs && (
              <Button
                variant="outlined"
                startIcon={<FileUpload />}
                onClick={onImportPVs}
                size="medium"
              >
                Import PVs
              </Button>
            )}
          </Box>
        </Stack>

      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 120 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Device
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 200, fontFamily: 'monospace' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Setpoint
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 200, fontFamily: 'monospace' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Readback
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 150 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Description
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Tags
                </Typography>
              </TableCell>
              {isAdmin && onDeletePV && (
                <TableCell align="center" sx={{ width: 60 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Actions
                  </Typography>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPVs.map((pv) => (
              <TableRow
                key={pv.uuid}
                hover
                sx={{ cursor: onPVClick ? 'pointer' : 'default' }}
                onDoubleClick={() => onPVClick?.(pv)}
              >
                <TableCell>{pv.device}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{pv.setpoint}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{pv.readback}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {pv.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {getTags(pv).map((tag, idx) => (
                      <Chip key={idx} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                {isAdmin && onDeletePV && (
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeletePV(pv)}
                      aria-label="Delete PV"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredPVs.length === 0 && (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {searchText || filters.devices.length > 0 || filters.tags.length > 0 || filters.status.length > 0
                ? 'No PVs match your search or filters'
                : 'No PVs available'}
            </Typography>
          </Box>
        )}
      </TableContainer>
      </Box>
    </Box>
  );
};
