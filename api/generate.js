// Função serverless da Vercel.
// Guarda a chave da OpenRouter no servidor (variável de ambiente OPENROUTER_API_KEY)
// para que ela NUNCA apareça no navegador / no código do frontend.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' })
  }

  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    return res.status(500).json({
      error:
        'Chave da OpenRouter não configurada. Defina OPENROUTER_API_KEY nas variáveis de ambiente da Vercel.',
    })
  }

  try {
    const {
      model,
      system,
      user,
      temperature = 0.9,
      max_tokens = 6000,
    } = req.body || {}

    if (!model || !user) {
      return res
        .status(400)
        .json({ error: 'Faltam parâmetros: "model" e "user" são obrigatórios.' })
    }

    const messages = []
    if (system) messages.push({ role: 'system', content: system })
    messages.push({ role: 'user', content: user })

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://escrivaninha.vercel.app',
        'X-Title': 'Escrivaninha',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
    })

    const data = await r.json()

    if (!r.ok) {
      return res.status(r.status).json({
        error: data?.error?.message || 'Erro ao chamar a OpenRouter.',
        detail: data,
      })
    }

    const text = data?.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ text, usage: data?.usage || null })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
