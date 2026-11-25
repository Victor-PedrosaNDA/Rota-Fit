/** Converte qualquer erro em mensagem amigável em português */
export function friendlyError(err: unknown): string {
  if (!err) return 'Erro desconhecido.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch'))
      return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
    if (msg.includes('jwt') || msg.includes('token') || msg.includes('auth'))
      return 'Sua sessão expirou. Faça login novamente.';
    if (msg.includes('row-level security') || msg.includes('permission'))
      return 'Você não tem permissão para realizar esta ação.';
    return err.message;
  }
  return 'Algo deu errado. Tente novamente.';
}
