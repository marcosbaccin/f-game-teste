// Importa a biblioteca WebSocket
const WebSocket = require('ws');

// Cria o servidor WebSocket
const wss = new WebSocket.Server({ port: 8080 });

// Variável para armazenar as salas de jogo
let rooms = {};

// Função para enviar mensagem a todos os jogadores de uma sala
function broadcast(roomId, message) {
  rooms[roomId].players.forEach(player => {
    player.ws.send(JSON.stringify(message));
  });
}

// Evento ao receber conexão de um novo jogador
wss.on('connection', (ws) => {
  console.log('Novo jogador conectado!');

  // Evento para receber mensagens do jogador
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'createRoom':
        const roomId = Math.random().toString(36).substring(2, 9);
        rooms[roomId] = {
          players: [{ id: data.playerId, ws: ws }],
          gameState: {
            lives: 3, // Exemplo de inicialização do estado do jogo
          },
        };
        ws.send(JSON.stringify({ type: 'roomCreated', roomId }));
        console.log(`Sala criada: ${roomId}`);
        break;

      case 'joinRoom':
        if (rooms[data.roomId]) {
          rooms[data.roomId].players.push({ id: data.playerId, ws: ws });
          ws.send(JSON.stringify({ type: 'joinedRoom', roomId: data.roomId }));
          broadcast(data.roomId, { type: 'newPlayer', playerId: data.playerId });
          console.log(`Jogador ${data.playerId} entrou na sala: ${data.roomId}`);
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Sala não encontrada' }));
        }
        break;

      case 'startGame':
        if (rooms[data.roomId]) {
          broadcast(data.roomId, { type: 'gameStarted' });
          console.log(`Jogo iniciado na sala: ${data.roomId}`);
        }
        break;

      case 'playCard':
        // Logica para jogar uma carta e enviar o estado da rodada
        broadcast(data.roomId, { type: 'cardPlayed', playerId: data.playerId, card: data.card });
        console.log(`Jogador ${data.playerId} jogou ${data.card}`);
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Tipo de mensagem desconhecido' }));
        break;
    }
  });

  // Evento de desconexão do jogador
  ws.on('close', () => {
    console.log('Jogador desconectado');
    // Aqui poderíamos remover o jogador da sala ou terminar o jogo, se necessário
  });
});

console.log('Servidor WebSocket rodando na porta 8080');
