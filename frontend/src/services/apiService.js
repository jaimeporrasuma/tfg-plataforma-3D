export const generarMaqueta3D = async (query, user, referenceImageBase64 = null) => {
  const payload = { 
    prompt: query, 
    uid: user.uid 
  };
  
  if (referenceImageBase64) {
    payload.referenceImage = referenceImageBase64;
  }

  const res = await fetch('/api/generar-maqueta-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Error desconocido del servidor.');
  }

  if (!data.model3DUrl) {
    throw new Error('Fallo al generar el modelo 3D. Puede que el servidor GPU esté desconectado o saturado.');
  }

  return data;
};
