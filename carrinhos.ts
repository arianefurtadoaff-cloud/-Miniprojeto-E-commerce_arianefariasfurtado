import { Carrinho, ItemCarrinho, ResumoCarrinho } from "./types";
import { ClienteService } from "./clientes";
import { ProdutoService } from "./produtos";

// Arredonda para 2 casas decimais: evita erros de ponto flutuante em somas de
// dinheiro (ex.: 0.1 + 0.2 = 0.30000000000000004).
const arredondar = (n: number): number => Math.round(n * 100) / 100;

export class CarrinhoService {
  // Um carrinho por cliente, criado só quando o cliente adiciona o primeiro item.
  private carrinhos: Carrinho[] = [];

  constructor(
    private produtos: ProdutoService,
    private clientes: ClienteService
  ) {}

  private itensDe(clienteId: number): ItemCarrinho[] {
    if (!this.clientes.buscarPorId(clienteId)) {
      throw new Error(`Cliente ${clienteId} não encontrado.`);
    }
    let carrinho = this.carrinhos.find((c) => c.clienteId === clienteId);
    if (!carrinho) {
      carrinho = { clienteId, itens: [] };
      this.carrinhos.push(carrinho);
    }
    return carrinho.itens;
  }

  // Quantidade válida = inteiro positivo (não aceita 0, negativos nem 1.5).
  private validarQuantidade(q: number): void {
    if (!Number.isInteger(q) || q <= 0) {
      throw new Error("A quantidade deve ser um número inteiro maior que zero.");
    }
  }

  // Compara a quantidade TOTAL desejada do produto (e não só a que está sendo
  // acrescentada) com o estoque, para o carrinho nunca pedir mais do que existe.
  private validarEstoque(produtoId: number, quantidadeTotal: number): void {
    const produto = this.produtos.buscarPorId(produtoId);
    if (!produto) throw new Error(`Produto ${produtoId} não existe.`);
    if (quantidadeTotal > produto.estoque) {
      throw new Error(
        `Quantidade solicitada (${quantidadeTotal}) maior que o estoque de "${produto.nome}" (${produto.estoque}).`
      );
    }
  }

  adicionarItem(clienteId: number, produtoId: number, quantidade: number): void {
    const itens = this.itensDe(clienteId);
    this.validarQuantidade(quantidade);
    const existente = itens.find((i) => i.produtoId === produtoId);
    // Se o produto já está no carrinho, a nova quantidade é somada à anterior.
    const total = (existente?.quantidade ?? 0) + quantidade;
    this.validarEstoque(produtoId, total);
    if (existente) existente.quantidade = total;
    else itens.push({ produtoId, quantidade });
  }

  alterarQuantidade(clienteId: number, produtoId: number, novaQuantidade: number): void {
    const itens = this.itensDe(clienteId);
    this.validarQuantidade(novaQuantidade);
    const item = itens.find((i) => i.produtoId === produtoId);
    if (!item) throw new Error(`Produto ${produtoId} não está no carrinho.`);
    this.validarEstoque(produtoId, novaQuantidade);
    item.quantidade = novaQuantidade;
  }

  removerItem(clienteId: number, produtoId: number): void {
    const itens = this.itensDe(clienteId);
    const i = itens.findIndex((x) => x.produtoId === produtoId);
    if (i === -1) throw new Error(`Produto ${produtoId} não está no carrinho.`);
    itens.splice(i, 1);
  }

  resumo(clienteId: number): ResumoCarrinho {
    // Preço e nome são lidos do catálogo neste momento, então o carrinho sempre
    // reflete o preço atual (o preço só é "congelado" quando o pedido é finalizado).
    const itens = this.itensDe(clienteId).map((item) => {
      const p = this.produtos.buscarPorId(item.produtoId);
      if (!p) throw new Error(`Produto ${item.produtoId} não existe mais.`);
      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        nome: p.nome,
        precoUnitario: p.preco,
        subtotal: arredondar(p.preco * item.quantidade),
      };
    });
    const total = arredondar(itens.reduce((s, i) => s + i.subtotal, 0));
    return { clienteId, itens, total };
  }

  limpar(clienteId: number): void {
    this.itensDe(clienteId).length = 0; // esvazia o array mantendo a mesma referência
  }
}
