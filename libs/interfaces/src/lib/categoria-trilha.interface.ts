export interface ICategoriaTrilha {
  id: string;
  nome: string;
  descricao?: string | null;
}

export interface ICriarCategoriaTrilha {
  nome: string;
  descricao?: string | null;
}

export interface IAtualizarCategoriaTrilha {
  nome?: string;
  descricao?: string | null;
}
