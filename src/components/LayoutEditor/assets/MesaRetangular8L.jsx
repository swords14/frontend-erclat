import React from 'react';
 import { Group, Rect } from 'react-konva';
 
 // Componente Cadeira Refinado
 const Chair = (props) => (
   <Group {...props}>
     {/* Assento com leve curvatura */}
     <Rect width={35} height={30} fill="#B8860B" cornerRadius={[5, 5, 0, 0]} />
     {/* Encosto mais alto e fino */}
     <Rect width={30} height={40} y={-40} fill="#A0522D" cornerRadius={3} />
   </Group>
 );
 
 const MesaRetangular8L = (props) => {
   const tableWidth = 180;
   const tableHeight = 90;
 
   const chairs = [
     // Topo
     { x: 20, y: -50, rotation: 0 }, { x: 70, y: -50, rotation: 0 }, { x: 120, y: -50, rotation: 0 }, { x: 170, y: -50, rotation: 0 },
     // Embaixo
     { x: 20, y: tableHeight + 20, rotation: 180 }, { x: 70, y: tableHeight + 20, rotation: 180 }, { x: 120, y: tableHeight + 20, rotation: 180 }, { x: 170, y: tableHeight + 20, rotation: 180 },
     // Laterais (removendo para melhor clareza visual com 8 lugares)
   ];
 
   return (
     <Group {...props} width={tableWidth} height={tableHeight} offsetX={tableWidth/2} offsetY={tableHeight/2}>
       {/* Tampo da Mesa com textura sutil */}
       <Rect
         width={tableWidth}
         height={tableHeight}
         fillLinearGradientStartPoint={{ x: 0, y: 0 }}
         fillLinearGradientEndPoint={{ x: tableWidth, y: tableHeight }}
         fillLinearGradientColorStops={[0, props.fill || '#D2B48C', 1, '#A0522D']}
         cornerRadius={8}
         stroke={props.stroke || '#5C4033'}
         strokeWidth={props.strokeWidth}
         shadowColor={props.shadowColor}
         shadowBlur={props.shadowBlur}
         shadowOpacity={props.shadowOpacity}
         shadowOffsetX={props.shadowOffsetX}
         shadowOffsetY={props.shadowOffsetY}
       />
 
       {/* Renderiza as cadeiras */}
       {chairs.map((chair, i) => (
          <Chair
             key={i}
             x={chair.x - tableWidth/2} // Ajuste para o centro da mesa
             y={chair.y}
             rotation={chair.rotation}
             offsetX={17.5} // Metade da largura da cadeira
             offsetY={15} // Metade da altura do assento
          />
       ))}
     </Group>
   );
 };
 
 export default MesaRetangular8L;