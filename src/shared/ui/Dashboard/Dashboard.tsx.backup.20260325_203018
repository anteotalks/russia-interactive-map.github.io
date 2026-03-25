/**
 * ПРОФЕССИОНАЛЬНЫЙ ДАШБОРД
 * Дизайн основан на современных Material-UI dashboard templates
 * Все графики на одной странице с красивыми карточками
 * Источники вдохновения: Refine dashboard, Syncfusion, ShadCN UI
 */

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  useTheme,
  Button,
  Avatar,
  Stack,
  LinearProgress,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
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

// Форматирование чисел с пробелами
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(num));
};

// Форматирование процентов
const formatPercent = (num: number): string => {
  return new Intl.NumberFormat('ru-RU', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }).format(num) + '%';
};

// Цветовая схема
const CHART_COLORS = ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#00acc1', '#8d6e63', '#607d8b'];

// Кастомный тултип для графиков
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1.5, bgcolor: 'background.paper', boxShadow: 3 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight="bold" color="primary">
          {formatNumber(payload[0].value)} чел.
        </Typography>
      </Paper>
    );
  }
  return null;
};

// Расчет статистики
const calculateStats = (locations: Location[], selectedYear: '2002' | '2010' | '2021', dynamicsPeriod: '2010-2021' | '2002-2021') => {
  if (!locations || locations.length === 0) {
    return null;
  }

  const count = locations.length;
  const total2002 = locations.reduce((s, l) => s + l.population_2002, 0);
  const total2010 = locations.reduce((s, l) => s + l.population_2010, 0);
  const total2021 = locations.reduce((s, l) => s + l.population_2021, 0);

  const avg2002 = total2002 / count;
  const avg2010 = total2010 / count;
  const avg2021 = total2021 / count;

  // Данные для гистограммы населения
  const popData = [
    { year: '2002', population: total2002, fill: '#1976d2' },
    { year: '2010', population: total2010, fill: '#2e7d32' },
    { year: '2021', population: total2021, fill: '#ed6c02' },
  ];

  // Динамика для каждого населенного пункта
  const dynamicsValues = locations.map(l => {
    const pop2002 = l.population_2002;
    const pop2010 = l.population_2010;
    const pop2021 = l.population_2021;
    
    if (selectedYear === '2010') {
      return pop2002 > 0 ? ((pop2010 - pop2002) / pop2002) * 100 : 0;
    }
    if (dynamicsPeriod === '2010-2021') {
      return pop2010 > 0 ? ((pop2021 - pop2010) / pop2010) * 100 : 0;
    }
    return pop2002 > 0 ? ((pop2021 - pop2002) / pop2002) * 100 : 0;
  }).filter(v => !isNaN(v) && isFinite(v));

  const avgDynamics = dynamicsValues.length > 0 
    ? dynamicsValues.reduce((a, b) => a + b, 0) / dynamicsValues.length 
    : 0;
  
  const minDynamics = Math.min(...dynamicsValues);
  const maxDynamics = Math.max(...dynamicsValues);

  // Данные для круговой диаграммы по размерам
  const sizeCategories = {
    tiny: locations.filter(l => l[`population_${selectedYear}`] < 100).length,
    small: locations.filter(l => l[`population_${selectedYear}`] >= 100 && l[`population_${selectedYear}`] < 1000).length,
    medium: locations.filter(l => l[`population_${selectedYear}`] >= 1000 && l[`population_${selectedYear}`] < 10000).length,
    large: locations.filter(l => l[`population_${selectedYear}`] >= 10000).length,
  };

  const pieData = [
    { name: 'Менее 100', value: sizeCategories.tiny, color: CHART_COLORS[0] },
    { name: '100 - 1000', value: sizeCategories.small, color: CHART_COLORS[1] },
    { name: '1000 - 10000', value: sizeCategories.medium, color: CHART_COLORS[2] },
    { name: 'Более 10000', value: sizeCategories.large, color: CHART_COLORS[3] },
  ].filter(item => item.value > 0);

  // Данные для линейного графика динамики (топ 10 населенных пунктов)
  const topLocations = [...locations]
    .sort((a, b) => b[`population_${selectedYear}`] - a[`population_${selectedYear}`])
    .slice(0, 10)
    .map(l => ({
      name: l.populated_place.length > 15 ? l.populated_place.substring(0, 12) + '...' : l.populated_place,
      population: l[`population_${selectedYear}`],
      dynamics: dynamicsValues[locations.indexOf(l)] || 0
    }));

  return {
    count,
    total2002,
    total2010,
    total2021,
    avg2002,
    avg2010,
    avg2021,
    avgDynamics,
    minDynamics,
    maxDynamics,
    popData,
    pieData,
    topLocations,
    growthCount: dynamicsValues.filter(v => v > 0).length,
    declineCount: dynamicsValues.filter(v => v < 0).length,
    stableCount: dynamicsValues.filter(v => v === 0).length,
  };
};

export const Dashboard: React.FC<DashboardProps> = ({
  open, data, onClose, selectedYear, dynamicsPeriod, mode, absolutePeriod
}) => {
  const theme = useTheme();

  if (!open || !data) return null;

  // Определяем заголовок и подзаголовок
  const getTitle = () => {
    switch (data.type) {
      case 'point':
        return data.location.populated_place;
      case 'region':
        return data.regionName;
      case 'selection':
        return 'Выделенная область';
    }
  };

  const getSubtitle = () => {
    switch (data.type) {
      case 'point':
        return data.location.region;
      case 'region':
      case 'selection':
        return `${data.locations.length} населённых пунктов`;
    }
  };

  // Получаем локации для статистики
  const locations = data.type === 'point' ? [data.location] : data.locations;
  const stats = calculateStats(locations, selectedYear, dynamicsPeriod);

  if (!stats) return null;

  // Для точечного режима показываем детальную карточку
  if (data.type === 'point') {
    const loc = data.location;
    const change2002_2010 = loc.population_2002 > 0 ? ((loc.population_2010 - loc.population_2002) / loc.population_2002) * 100 : 0;
    const change2010_2021 = loc.population_2010 > 0 ? ((loc.population_2021 - loc.population_2010) / loc.population_2010) * 100 : 0;
    const change2002_2021 = loc.population_2002 > 0 ? ((loc.population_2021 - loc.population_2002) / loc.population_2002) * 100 : 0;

    return (
      <Paper sx={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: { xs: '90%', sm: 450 },
        zIndex: 1300,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: theme.shadows[10],
      }}>
        {/* Хедер с градиентом */}
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">{getTitle()}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>{getSubtitle()}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Контент */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="caption">2002</Typography>
                  <Typography variant="h6" fontWeight="bold">{formatNumber(loc.population_2002)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="caption">2010</Typography>
                  <Typography variant="h6" fontWeight="bold">{formatNumber(loc.population_2010)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card variant="outlined" sx={{ textAlign: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" variant="caption">2021</Typography>
                  <Typography variant="h6" fontWeight="bold">{formatNumber(loc.population_2021)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" gutterBottom>Динамика населения</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">2002-2010</Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  sx={{ color: change2002_2010 > 0 ? 'success.main' : change2002_2010 < 0 ? 'error.main' : 'text.primary' }}
                >
                  {change2002_2010 > 0 ? '+' : ''}{change2002_2010.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">2010-2021</Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  sx={{ color: change2010_2021 > 0 ? 'success.main' : change2010_2021 < 0 ? 'error.main' : 'text.primary' }}
                >
                  {change2010_2021 > 0 ? '+' : ''}{change2010_2021.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">2002-2021</Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  sx={{ color: change2002_2021 > 0 ? 'success.main' : change2002_2021 < 0 ? 'error.main' : 'text.primary' }}
                >
                  {change2002_2021 > 0 ? '+' : ''}{change2002_2021.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    );
  }

  // Для множественного выбора - показываем красивый дашборд
  return (
    <Paper sx={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: { xs: '95%', sm: 850, md: 1000 },
      maxHeight: '90vh',
      overflow: 'auto',
      zIndex: 1300,
      borderRadius: 3,
      boxShadow: theme.shadows[15],
    }}>
      {/* Хедер с градиентом */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        p: 2.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">{getTitle()}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>{getSubtitle()}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Контент дашборда */}
      <Box sx={{ p: 3 }}>
        {/* Статистические карточки */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: 'none' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="caption">Всего н.п.</Typography>
                    <Typography variant="h4" fontWeight="bold">{stats.count}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <HomeIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05), border: 'none' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="caption">Население 2021</Typography>
                    <Typography variant="h4" fontWeight="bold">{formatNumber(stats.total2021)}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                    <PeopleIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), border: 'none' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="caption">Среднее по году</Typography>
                    <Typography variant="h4" fontWeight="bold">{formatNumber(stats.avg2021)}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: alpha(
              stats.avgDynamics > 0 ? theme.palette.success.main : 
              stats.avgDynamics < 0 ? theme.palette.error.main : 
              theme.palette.grey[500], 0.05), border: 'none' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="caption">Средняя динамика</Typography>
                    <Typography 
                      variant="h4" 
                      fontWeight="bold"
                      sx={{ color: stats.avgDynamics > 0 ? 'success.main' : stats.avgDynamics < 0 ? 'error.main' : 'text.primary' }}
                    >
                      {stats.avgDynamics > 0 ? '+' : ''}{stats.avgDynamics.toFixed(1)}%
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stats.avgDynamics > 0 ? 'success.main' : stats.avgDynamics < 0 ? 'error.main' : 'grey.500', width: 48, height: 48 }}>
                    {stats.avgDynamics > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Прогресс-бары для роста/убыли */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Рост</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.growthCount / stats.count) * 100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.1) }}
                      color="success"
                    />
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {stats.growthCount} ({((stats.growthCount / stats.count) * 100).toFixed(0)}%)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Убыль</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.declineCount / stats.count) * 100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.error.main, 0.1) }}
                      color="error"
                    />
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {stats.declineCount} ({((stats.declineCount / stats.count) * 100).toFixed(0)}%)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Стабильно</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.stableCount / stats.count) * 100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.grey[500], 0.1) }}
                      color="inherit"
                    />
                  </Box>
                  <Typography variant="body2" fontWeight="bold" color="text.secondary">
                    {stats.stableCount} ({((stats.stableCount / stats.count) * 100).toFixed(0)}%)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Два графика в ряд */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={7}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Население по годам
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Суммарное население всех населенных пунктов
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.popData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="population" radius={[4, 4, 0, 0]}>
                      {stats.popData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Распределение по размеру
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Населенные пункты по численности
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Третий ряд - топ 10 населенных пунктов */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Топ-10 крупнейших н.п.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  По населению в {selectedYear} году
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={stats.topLocations} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <RechartsTooltip />
                    <Bar dataKey="population" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Статистика динамики
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Минимум</Typography>
                      <Typography variant="h6" color="error.main" fontWeight="bold">
                        {stats.minDynamics.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Максимум</Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {stats.maxDynamics.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Среднее</Typography>
                      <Typography variant="h6" color="info.main" fontWeight="bold">
                        {stats.avgDynamics.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Всего населенных пунктов: <strong>{stats.count}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Общая численность (2021): <strong>{formatNumber(stats.total2021)} чел.</strong>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default Dashboard;
