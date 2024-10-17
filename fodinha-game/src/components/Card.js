import React from 'react';

function Card({ playerId, card }) {
  return (
    <div>
      <p>{playerId} jogou {card}</p>
    </div>
  );
}

export default Card;
