import React from 'react';
import { Group, Circle, Rect } from 'react-konva';

// Reutilizando o mesmo componente de Cadeira
const Chair = (props) => (
  <Group {...props}>
    <Rect width={30} height={30} fill="#8A6E59" cornerRadius={3} />
    <Rect width={30} height={8} y={-8} fill="#705A49" cornerRadius={2}/>
  </Group>
);

const MesaRedonda6L = (props) => {
  const tableRadius = 60;
  const numChairs = 6;
  const chairDistance = tableRadius + 25;

  return (
    <Group {...props} width={tableRadius*2} height={tableRadius*2} offsetX={tableRadius} offsetY={tableRadius}>
      {/* Mesa Redonda com gradiente radial para profundidade */}
      <Circle
        x={tableRadius}
        y={tableRadius}
        radius={tableRadius}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={tableRadius}
        fillRadialGradientColorStops={[0, props.fill || '#E6CBA8', 0.8, '#A0522D']}
        stroke={props.stroke || '#5C4033'}
        strokeWidth={props.strokeWidth}
        shadowColor={props.shadowColor}
        shadowBlur={props.shadowBlur}
        shadowOpacity={props.shadowOpacity}
        shadowOffsetX={props.shadowOffsetX}
        shadowOffsetY={props.shadowOffsetY}
      />
      
      {/* Cadeiras posicionadas em círculo */}
      {[...Array(numChairs)].map((_, i) => {
        const angle = (i * 2 * Math.PI) / numChairs;
        const x = tableRadius + chairDistance * Math.cos(angle);
        const y = tableRadius + chairDistance * Math.sin(angle);
        const rotation = (i * 360) / numChairs + 90;

        return (
          <Chair
            key={`chair-${i}`}
            x={x}
            y={y}
            rotation={rotation}
            offsetX={15}
            offsetY={15}
          />
        );
      })}
    </Group>
  );
};

export default MesaRedonda6L;