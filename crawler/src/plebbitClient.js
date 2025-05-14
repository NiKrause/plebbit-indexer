import Plebbit from '@plebbit/plebbit-js';

export async function getPlebbitClient() {
  const wsUrl = process.env.PLEBBIT_WS_URL || 'ws://localhost:9138';
  console.log("plebbitClient wsUrl", wsUrl);
  const plebbit = await Plebbit({ plebbitRpcClientsOptions: [wsUrl] });
  plebbit.on('error', (err) => {
    console.error('Plebbit error event:', err);
  });
  return plebbit;
}