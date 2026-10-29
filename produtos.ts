import { Produto } from "./types";

// Dados iniciais
export const produtosIniciais: Produto[] = [
  { id: 1, nome: "Notebook Pro 14", preco: 5499.9, estoque: 10, categoria: "Informática" },
  { id: 2, nome: "Mouse Sem Fio", preco: 89.9, estoque: 50, categoria: "Informática" },
  { id: 3, nome: "Teclado Mecânico", preco: 349.0, estoque: 25, categoria: "Informática" },
  { id: 4, nome: "Camiseta Algodão", preco: 59.9, estoque: 100, categoria: "Vestuário" },
  { id: 5, nome: "Tênis Corrida", preco: 399.9, estoque: 15, categoria: "Calçados" },
  { id: 6, nome: "Garrafa Térmica", preco: 79.5, estoque: 40, categoria: "Casa" },
];

export class ProdutoService {
  private produtos: Produto[];

  constructor(iniciais: Produto[] = []) {
    // Copiamos os dados iniciais para que alterações não afetem o array original.
    this.produtos = iniciais.map((p) => ({ ...p }));
  }

  // Regras de negócio do produto. Usada tanto no cadastro quanto na atualização.
  private validar(p: Omit<Produto, "id">): void {
    if (typeof p.nome !== "string" || p.nome.trim() === "") {
      throw new Error("O nome do produto deve ser preenchido.");
    }
    if (typeof p.preco !== "number" || !Number.isFinite(p.preco) || p.preco <= 0) {
      throw new Error("O preço deve ser maior que zero.");
    }
    if (!Number.isInteger(p.estoque) || p.estoque < 0) {
      throw new Error("O estoque deve ser um número inteiro não negativo.");
    }
    if (typeof p.categoria !== "string" || p.categoria.trim() === "") {
      throw new Error("A categoria deve ser preenchida.");
    }
  }

  cadastrar(produto: Produto): Produto {
    if (!Number.isInteger(produto.id) || produto.id <= 0) {
      throw new Error("O id do produto deve ser um inteiro positivo.");
    }
    if (this.produtos.some((p) => p.id === produto.id)) {
      throw new Error(`Já existe um produto com o id ${produto.id}.`);
    }
    this.validar(produto);
    const novo = { ...produto, nome: produto.nome.trim(), categoria: produto.categoria.trim() };
    this.produtos.push(novo);
    return { ...novo };
  }

  // Os métodos de consulta devolvem cópias ({ ...p }): quem chama não consegue
  // alterar o estoque ou o preço sem passar pelas validações desta classe.
  listar(): Produto[] {
    return this.produtos.map((p) => ({ ...p }));
  }

  buscarPorId(id: number): Produto | undefined {
    const p = this.produtos.find((x) => x.id === id);
    return p ? { ...p } : undefined;
  }

  buscarPorNome(termo: string): Produto[] {
    // Busca parcial e sem diferenciar maiúsculas/minúsculas.
    const t = termo.trim().toLowerCase();
    return this.produtos.filter((p) => p.nome.toLowerCase().includes(t)).map((p) => ({ ...p }));
  }

  filtrarPorCategoria(categoria: string): Produto[] {
    const c = categoria.trim().toLowerCase();
    return this.produtos.filter((p) => p.categoria.toLowerCase() === c).map((p) => ({ ...p }));
  }

  atualizar(id: number, dados: Partial<Omit<Produto, "id">>): Produto {
    const atual = this.produtos.find((p) => p.id === id);
    if (!atual) throw new Error(`Produto ${id} não encontrado.`);
    // Mescla os dados novos e valida o resultado completo ANTES de gravar,
    // para uma atualização inválida não alterar o produto.
    const atualizado = { ...atual, ...dados };
    this.validar(atualizado);
    atual.nome = atualizado.nome.trim();
    atual.preco = atualizado.preco;
    atual.estoque = atualizado.estoque;
    atual.categoria = atualizado.categoria.trim();
    return { ...atual };
  }

  remover(id: number): void {
    const i = this.produtos.findIndex((p) => p.id === id);
    if (i === -1) throw new Error(`Produto ${id} não encontrado.`);
    this.produtos.splice(i, 1);
  }

  /** Usado pelo módulo de pedidos, depois de validar todos os itens. */
  baixarEstoque(id: number, quantidade: number): void {
    const p = this.produtos.find((x) => x.id === id);
    if (!p) throw new Error(`Produto ${id} não encontrado.`);
    if (quantidade > p.estoque) throw new Error(`Estoque insuficiente para ${p.nome}.`);
    p.estoque -= quantidade;
  }
}
