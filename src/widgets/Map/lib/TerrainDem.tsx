import { Source } from 'react-map-gl/maplibre';

export const TerrainDem = () => {
  return (
    <Source
      id="terrain-dem"
      type="raster-dem"
      tiles={['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']}
      tileSize={256}
      minzoom={0}
      maxzoom={12}
      attribution="Terrain Tiles from AWS"
      encoding="terrarium"
    />
  );
};
