// Leitura e gravação no localStorage, sem quebrar se ele estiver indisponível ou cheio.

export const CHAVES = {
  missas: 'slides-para-missa:missas',
  bibliotecaUsuario: 'slides-para-missa:biblioteca',
} as const;

export function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

/** Devolve false se não conseguiu gravar (ex.: espaço do navegador cheio). */
export function gravar(chave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}
