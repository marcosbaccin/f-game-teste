import React, { useEffect, useState } from 'react';
import PlayerStatus from './PlayerStatus';
import PredictionInput from './PredictionInput';
import Card from './Card';

function Game({ roomId, playerId }) {
  const [players, setPlayers] = useState([]);
  const [cards, setCards] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'joinRoom', roomId, playerId }));
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);

      switch (data.type) {
        case 'newPlayer':
          setPlayers((prevPlayers) => [...prevPlayers, data.playerId]);
          break;
        case 'gameStarted':
          setCurrentRound(data.round);
          break;
        case 'newRound':
          setCurrentRound(data.round);
          break;
        case 'cardPlayed':
          setCards((prevCards) => [...prevCards, { playerId: data.playerId, card: data.card }]);
          break;
        case 'lifeLost':
          setLives(data.lives);
          break;
        case 'gameOver':
          alert(`Fim de jogo! ${data.winner}`);
          break;
        default:
          break;
      }
    };
  }, [roomId, playerId]);

  return (
    <div>
      <h2>Sala: {roomId}</h2>
      <h3>Rodada: {currentRound}</h3>
      <h3>Vidas: {lives}</h3>

      <div className="players">
        {players.map((playerId) => (
          <PlayerStatus key={playerId} playerId={playerId} />
        ))}
      </div>

      <div className="cards">
        {cards.map((card, index) => (
          <Card key={index} playerId={card.playerId} card={card.card} />
        ))}
      </div>

      <PredictionInput roomId={roomId} playerId={playerId} />
    </div>
  );
}

export default Game;
