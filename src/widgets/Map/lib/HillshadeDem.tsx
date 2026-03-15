import { Layer, Source } from 'react-map-gl/maplibre';

export const HillshadeDem = () => {
  return (
    <Source
      id="hillshade-dem"
      type="raster-dem"
      tiles={['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']}
      tileSize={256}
      encoding="terrarium"
    >
      <Layer
        id="hillshade-layer"
        type="hillshade"
        paint={{
          "hillshade-illumination-direction": 315,
          "hillshade-exaggeration": 0.5,
          "hillshade-shadow-color": "#473B24",
          "hillshade-highlight-color": "#FFFFFF",
        }}
      />
    </Source>
  );
};
