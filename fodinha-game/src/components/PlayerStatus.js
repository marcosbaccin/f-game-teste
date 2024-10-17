import React from 'react';

function PlayerStatus({ playerId }) {
  return (
    <div>
      <h4>{playerId}</h4>
      {/* Aqui podemos exibir outras informações como o número de vidas */}
    </div>
  );
}

export default PlayerStatus;
