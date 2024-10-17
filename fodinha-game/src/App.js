import React, { useState } from 'react';
import RoomSelection from './components/RoomSelection';
import Game from './components/Game';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  // Se o jogador já entrou em uma sala, mostramos o jogo; caso contrário, mostramos a tela de seleção de sala.
  return (
    <div>
      {roomId && playerId ? (
        <Game roomId={roomId} playerId={playerId} />
      ) : (
        <RoomSelection setRoomId={setRoomId} setPlayerId={setPlayerId} />
      )}
    </div>
  );
}

export default App;
