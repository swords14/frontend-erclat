import React from 'react';
import { Group, Rect, Polygon } from 'react-konva';

const Palco = (props) => {
  const width = 250;
  const height = 150;
  const stageColor = '#555';
  const trimColor = '#333';

  return (
    <Group {...props} width={width} height={height} offsetX={width/2} offsetY={height/2}>
      {/* Plataforma principal */}
      <Rect
        width={width}
        height={height}
        fill={stageColor}
        stroke={props.stroke || trimColor}
        strokeWidth={props.strokeWidth}
        shadowColor={props.shadowColor}
        shadowBlur={props.shadowBlur}
        shadowOpacity={props.shadowOpacity}
        shadowOffsetX={props.shadowOffsetX}
        shadowOffsetY={props.shadowOffsetY}
      />
      {/* Lateral esquerda (trapézio para perspectiva) */}
      <Polygon
        points={[
          -width / 2 - 10, height / 2,
          -width / 2, height / 2 - 20,
          -width / 2, -height / 2,
          -width / 2 - 10, -height / 2 + 20,
        ]}
        fill={trimColor}
      />
      {/* Lateral direita (trapézio para perspectiva) */}
      <Polygon
        points={[
          width / 2 + 10, height / 2,
          width / 2, height / 2 - 20,
          width / 2, -height / 2,
          width / 2 + 10, -height / 2 + 20,
        ]}
        fill={trimColor}
      />
      {/* Faixa frontal para detalhe */}
      <Rect
        x={-width / 2}
        y={height / 2 - 20}
        width={width}
        height={20}
        fill={trimColor}
      />
    </Group>
  );
};

export default Palco;