const WebSocket = require('ws');

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ port: 8080 });

// Variável para armazenar as salas de jogo
let rooms = {};

// Função para criar uma sala
function createRoom(playerId, ws) {
  const roomId = Math.random().toString(36).substring(2, 9); // Gera um ID único para a sala
  rooms[roomId] = {
    players: [{ id: playerId, ws: ws, lives: 3, handsWon: 0, prediction: 0 }],
    round: 1,
    deck: shuffleDeck(),
    gameStarted: false
  };
  ws.send(JSON.stringify({ type: 'roomCreated', roomId }));
  return roomId;
}

// Função para um jogador se juntar a uma sala existente
function joinRoom(roomId, playerId, ws) {
  if (rooms[roomId]) {
    if (rooms[roomId].gameStarted) {
      ws.send(JSON.stringify({ type: 'error', message: 'A partida já começou. Não é possível entrar.' }));
    } else {
      rooms[roomId].players.push({ id: playerId, ws: ws, lives: 3, handsWon: 0, prediction: 0 });
      ws.send(JSON.stringify({ type: 'joinedRoom', roomId }));
      broadcast(roomId, { type: 'newPlayer', playerId: playerId });
    }
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'Sala não encontrada' }));
  }
}

// Função para embaralhar o baralho
function shuffleDeck() {
  const cards = [
    'Dama de Ouro', 'Valete de Ouro', 'Rei de Ouro', 'Ás de Ouro', '2 de Ouro', '3 de Ouro',
    'Dama de Espadas', 'Valete de Espadas', 'Rei de Espadas', '2 de Espadas', '3 de Espadas',
    'Dama de Copas', 'Valete de Copas', 'Rei de Copas', 'Ás de Copas', '2 de Copas', '3 de Copas',
    'Dama de Paus', 'Valete de Paus', 'Rei de Paus', 'Ás de Paus', '2 de Paus', '3 de Paus',
    '7 Ouro', 'Espadilha', '7 Copas', 'Zap', 'Bixo',
  ];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// Função para distribuir as cartas em uma sala
function dealCards(roomId, round) {
  const room = rooms[roomId];
  const numPlayers = room.players.length;
  let numCards = round;

  // Lógica para reduzir o número de cartas após atingir o limite
  if (round * numPlayers > 28) {
    numCards = Math.max(1, 28 - ((round - 1) % numPlayers) * numPlayers);
  }

  const deck = room.deck;
  room.players.forEach(player => {
    player.cards = deck.splice(0, numCards);
  });
}

// Função para verificar o resultado da rodada em uma sala
function checkRoundResults(roomId) {
  const room = rooms[roomId];
  let players = room.players;
  let strongestCard = null;
  let winnerId = null;

  players.forEach(player => {
    if (!strongestCard || isStronger(player.currentCard, strongestCard)) {
      strongestCard = player.currentCard;
      winnerId = player.id;
    }
  });

  players.forEach(player => {
    if (player.prediction !== player.handsWon) {
      player.lives--;
      player.ws.send(JSON.stringify({ type: 'lifeLost', lives: player.lives }));
    }
  });

  players = players.filter(player => player.lives > 0);
  if (players.length === 1) {
    broadcast(roomId, { type: 'gameOver', winner: players[0].id });
    delete rooms[roomId]; // Remove a sala quando o jogo acaba
  } else if (players.length === 0) {
    broadcast(roomId, { type: 'gameOver', winner: 'Empate' });
    delete rooms[roomId]; // Remove a sala em caso de empate
  } else {
    room.round++;
    dealCards(roomId, room.round);
    broadcast(roomId, { type: 'newRound', round: room.round });
  }
}

// Função para comparar as cartas
function isStronger(cardA, cardB) {
  const cardRank = {
    'Dama de Ouro': 1, 'Valete de Ouro': 5, 'Rei de Ouro': 9, 'Ás de Ouro': 13, '2 de Ouro': 16, '3 de Ouro': 20,
    'Dama de Espadas': 2, 'Valete de Espadas': 6, 'Rei de Espadas': 10, '2 de Espadas': 17, '3 de Espadas': 21,
    'Dama de Copas': 3, 'Valete de Copas': 7, 'Rei de Copas': 11, 'Ás de Copas': 14, '2 de Copas': 18, '3 de Copas': 22,
    'Dama de Paus': 4, 'Valete de Paus': 8, 'Rei de Paus': 12, 'Ás de Paus': 15, '2 de Paus': 19, '3 de Paus': 23,
    '7 Ouro': 24, 'Espadilha': 25, '7 Copas': 26, 'Zap': 27, 'Bixo': 28,
  };
  return cardRank[cardA] > cardRank[cardB];
}

// Função para enviar uma mensagem a todos os jogadores de uma sala
function broadcast(roomId, message) {
  rooms[roomId].players.forEach(player => {
    player.ws.send(JSON.stringify(message));
  });
}

// Evento de conexão de um novo jogador
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'createRoom':
        const roomId = createRoom(data.playerId, ws);
        break;

      case 'joinRoom':
        joinRoom(data.roomId, data.playerId, ws);
        break;

      case 'startGame':
        if (rooms[data.roomId] && rooms[data.roomId].players.length > 1) {
          rooms[data.roomId].gameStarted = true;
          dealCards(data.roomId, 1);
          broadcast(data.roomId, { type: 'gameStarted', round: 1 });
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Jogadores insuficientes para iniciar o jogo.' }));
        }
        break;

      case 'makePrediction':
        const player = rooms[data.roomId].players.find(p => p.id === data.playerId);
        player.prediction = data.prediction;
        break;

      case 'playCard':
        const currentPlayer = rooms[data.roomId].players.find(p => p.id === data.playerId);
        currentPlayer.currentCard = data.card;
        broadcast(data.roomId, { type: 'cardPlayed', playerId: data.playerId, card: data.card });

        const allCardsPlayed = rooms[data.roomId].players.every(p => p.currentCard);
        if (allCardsPlayed) {
          checkRoundResults(data.roomId);
        }
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensagem desconhecido' }));
        break;
    }
  });

  ws.on('close', () => {
    console.log('Jogador desconectado');
  });
});

console.log('Servidor WebSocket rodando na porta 8080');
