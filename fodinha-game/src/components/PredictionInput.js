import React, { useState } from 'react';

function PredictionInput({ roomId, playerId }) {
  const [prediction, setPrediction] = useState(0);

  const submitPrediction = () => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'makePrediction', roomId, playerId, prediction }));
    };
  };

  return (
    <div>
      <h4>Quantas mãos você fará?</h4>
      <input
        type="number"
        value={prediction}
        onChange={(e) => setPrediction(e.target.value)}
      />
      <button onClick={submitPrediction}>Enviar</button>
    </div>
  );
}

export default PredictionInput;
