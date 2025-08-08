import React, { useState, useEffect } from 'react';
import { Group, Rect, Circle } from 'react-konva';

const PistaDeDanca = (props) => {
  const width = 200;
  const height = 200;
  const baseColor = '#222';
  const lightColor1 = '#444';
  const lightColor2 = '#666';
  const borderWidth = 5;

  return (
    <Group {...props} width={width} height={height} offsetX={width/2} offsetY={height/2}>
      {/* Borda principal */}
      <Rect
        width={width}
        height={height}
        fill={baseColor}
        stroke={props.stroke || '#111'}
        strokeWidth={props.strokeWidth}
        shadowColor={props.shadowColor}
        shadowBlur={props.shadowBlur}
        shadowOpacity={props.shadowOpacity}
        shadowOffsetX={props.shadowOffsetX}
        shadowOffsetY={props.shadowOffsetY}
      />
      {/* Padrão de "luzes" */}
      {[...Array(7)].map((_, i) => (
        <React.Fragment key={i}>
          <Rect
            x={borderWidth + i * (width - 2 * borderWidth) / 6 + 5}
            y={borderWidth + 20}
            width={20}
            height={15}
            fill={i % 2 === 0 ? lightColor1 : lightColor2}
            cornerRadius={3}
          />
          <Rect
            x={borderWidth + i * (width - 2 * borderWidth) / 6 - 10}
            y={height - borderWidth - 35}
            width={30}
            height={20}
            fill={i % 2 !== 0 ? lightColor1 : lightColor2}
            cornerRadius={4}
          />
        </React.Fragment>
      ))}
      {/* Círculos pequenos para mais detalhes de luz */}
      {[...Array(10)].map((_, i) => (
        <Circle
          key={`circle-${i}`}
          x={borderWidth + Math.random() * (width - 2 * borderWidth)}
          y={borderWidth + Math.random() * (height - 2 * borderWidth)}
          radius={Math.random() * 3 + 1}
          fill="#ddd"
        />
      ))}
    </Group>
  );
};

export default PistaDeDanca;