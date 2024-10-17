import React, { useState } from 'react';

function RoomSelection({ setRoomId, setPlayerId }) {
  const [name, setName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  const createRoom = () => {
    const playerId = Math.random().toString(36).substring(2, 9);
    setPlayerId(playerId);

    // Criar uma nova sala via WebSocket
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'createRoom', playerId }));
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'roomCreated') {
        setRoomId(data.roomId);
      }
    };
  };

  const joinRoom = () => {
    const playerId = Math.random().toString(36).substring(2, 9);
    setPlayerId(playerId);

    // Entrar em uma sala existente via WebSocket
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'joinRoom', roomId: joinRoomId, playerId }));
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'joinedRoom') {
        setRoomId(data.roomId);
      }
    };
  };

  return (
    <div>
      <h2>Bem-vindo ao Fodinha</h2>
      <input
        type="text"
        placeholder="Seu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div>
        <button onClick={createRoom}>Criar Sala</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="ID da sala"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
        />
        <button onClick={joinRoom}>Entrar na Sala</button>
      </div>
    </div>
  );
}

export default RoomSelection;
