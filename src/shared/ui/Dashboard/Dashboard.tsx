import React, { useState } from 'react';
import {
  Paper, Typography, Box, IconButton, Divider, Chip, Tabs, Tab,
  Grid, Card, CardContent, useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Location } from '../../../entities/location/lib/types';

export type DashboardType = 'point' | 'region' | 'selection';
export type PointDashboardData = { type: 'point'; location: Location };
export type RegionDashboardData = { type: 'region'; regionName: string; locations: Location[] };
export type SelectionDashboardData = { type: 'selection'; locations: Location[] };
export type DashboardData = PointDashboardData | RegionDashboardData | SelectionDashboardData;

interface DashboardProps {
  open: boolean;
  data: DashboardData | null;
  onClose: () => void;
  selectedYear: '2002' | '2010' | '2021';
  dynamicsPeriod: '2010-2021' | '2002-2021';
  mode: 'dynamics' | 'absolute';
  absolutePeriod: '2002-2010' | '2010-2021' | '2002-2021';
}

const calculateStats = (locations: Location[], selectedYear: '2002' | '2010' | '2021', dynamicsPeriod: '2010-2021' | '2002-2021') => {
  const count = locations.length;
  const pop2002 = locations.reduce((s, l) => s + l.population_2002, 0);
  const pop2010 = locations.reduce((s, l) => s + l.population_2010, 0);
  const pop2021 = locations.reduce((s, l) => s + l.population_2021, 0);

  const mean2002 = pop2002 / count;
  const mean2010 = pop2010 / count;
  const mean2021 = pop2021 / count;

  const sorted2002 = [...locations].sort((a,b) => a.population_2002 - b.population_2002);
  const median2002 = sorted2002[Math.floor(count/2)].population_2002;
  const sorted2010 = [...locations].sort((a,b) => a.population_2010 - b.population_2010);
  const median2010 = sorted2010[Math.floor(count/2)].population_2010;
  const sorted2021 = [...locations].sort((a,b) => a.population_2021 - b.population_2021);
  const median2021 = sorted2021[Math.floor(count/2)].population_2021;

  const dynamics = locations.map(l => {
    const p2002 = l.population_2002;
    const p2010 = l.population_2010;
    const p2021 = l.population_2021;
    if (selectedYear === '2002') return 0;
    if (selectedYear === '2010') return p2002 > 0 ? ((p2010 - p2002) / p2002) * 100 : 0;
    if (dynamicsPeriod === '2010-2021') return p2010 > 0 ? ((p2021 - p2010) / p2010) * 100 : 0;
    return p2002 > 0 ? ((p2021 - p2002) / p2002) * 100 : 0;
  });
  const minDynamics = Math.min(...dynamics);
  const maxDynamics = Math.max(...dynamics);
  const avgDynamics = dynamics.reduce((a,b) => a+b,0) / dynamics.length;

  const binCount = 10;
  const min = Math.min(...dynamics, -0.01);
  const max = Math.max(...dynamics, 0.01);
  const step = (max - min) / binCount;
  const bins = Array(binCount).fill(0);
  dynamics.forEach(v => {
    const idx = Math.floor((v - min) / step);
    if (idx >= 0 && idx < binCount) bins[idx] += 1;
    else if (v >= max) bins[binCount-1] += 1;
  });
  const histogramData = bins.map((c, i) => ({
    range: `${(min + i*step).toFixed(1)}–${(min + (i+1)*step).toFixed(1)}`,
    count: c,
  }));

  return {
    count,
    pop2002, pop2010, pop2021,
    mean2002, mean2010, mean2021,
    median2002, median2010, median2021,
    minDynamics, maxDynamics, avgDynamics,
    histogramData,
  };
};

export const Dashboard: React.FC<DashboardProps> = ({
  open, data, onClose, selectedYear, dynamicsPeriod, mode, absolutePeriod
}) => {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  if (!open || !data) return null;

  const renderPoint = (d: PointDashboardData) => {
    const loc = d.location;
    const popData = [
      { year: '2002', population: loc.population_2002 },
      { year: '2010', population: loc.population_2010 },
      { year: '2021', population: loc.population_2021 },
    ];
    return (
      <>
        <Typography variant="h5" gutterBottom>{loc.populated_place}</Typography>
        <Chip label={loc.region} size="small" sx={{ mb: 3 }} />
        <Typography variant="subtitle1" gutterBottom>Население по годам</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={popData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="population" fill={theme.palette.primary.main} />
          </BarChart>
        </ResponsiveContainer>
      </>
    );
  };

  const renderRegionOrSelection = (title: string, locs: Location[]) => {
    const stats = calculateStats(locs, selectedYear, dynamicsPeriod);
    const popData = [
      { year: '2002', population: stats.pop2002 },
      { year: '2010', population: stats.pop2010 },
      { year: '2021', population: stats.pop2021 },
    ];
    return (
      <>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Населенных пунктов: {stats.count}
        </Typography>
        <Tabs value={tabIndex} onChange={(_,v) => setTabIndex(v)} sx={{ mb: 2 }}>
          <Tab label="Население" />
          <Tab label="Динамика" />
          <Tab label="Статистика" />
        </Tabs>
        {tabIndex === 0 && (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={popData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="population" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {tabIndex === 1 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Мин: {stats.minDynamics.toFixed(1)}% | Макс: {stats.maxDynamics.toFixed(1)}% | Среднее: {stats.avgDynamics.toFixed(1)}%
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.histogramData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {tabIndex === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card variant="outlined"><CardContent>
                <Typography variant="subtitle2">Среднее</Typography>
                <Typography>2002: {stats.mean2002.toFixed(0)}</Typography>
                <Typography>2010: {stats.mean2010.toFixed(0)}</Typography>
                <Typography>2021: {stats.mean2021.toFixed(0)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined"><CardContent>
                <Typography variant="subtitle2">Медиана</Typography>
                <Typography>2002: {stats.median2002}</Typography>
                <Typography>2010: {stats.median2010}</Typography>
                <Typography>2021: {stats.median2021}</Typography>
              </CardContent></Card>
            </Grid>
          </Grid>
        )}
      </>
    );
  };

  return (
    <Paper sx={{
      position: 'absolute', bottom: 20, right: 20,
      width: { xs: '90%', sm: 500, md: 600 },
      maxHeight: '80vh', overflow: 'auto', zIndex: 1300,
      p: 3, boxShadow: theme.shadows[10], borderRadius: 2,
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {data.type === 'point' && 'Населённый пункт'}
          {data.type === 'region' && 'Регион'}
          {data.type === 'selection' && 'Выделенная область'}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {data.type === 'point' && renderPoint(data)}
      {data.type === 'region' && renderRegionOrSelection(data.regionName, data.locations)}
      {data.type === 'selection' && renderRegionOrSelection('Выделенная область', data.locations)}
    </Paper>
  );
};

export default Dashboard;
