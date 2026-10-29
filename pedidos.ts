import { ItemPedido, Pedido } from "./types";
import { CarrinhoService } from "./carrinho";
import { ClienteService } from "./clientes";
import { ProdutoService } from "./produtos";

// Arredonda para 2 casas decimais (evita erros de ponto flutuante em dinheiro).
const arredondar = (n: number): number => Math.round(n * 100) / 100;

export class PedidoService {
  private pedidos: Pedido[] = [];
  private proximoId = 1; // contador sequencial: garante ids de pedido únicos

  constructor(
    private produtos: ProdutoService,
    private clientes: ClienteService,
    private carrinhos: CarrinhoService
  ) {}

  finalizarCompra(clienteId: number): Pedido {
    // Ordem das etapas, pensada para manter os dados consistentes:
    // 1) validar tudo; 2) só então baixar o estoque; 3) registrar o pedido.
    // Assim, se qualquer item falhar, o estoque não fica "pela metade".
    // 1) Validações (nada é alterado até aqui)
    if (!this.clientes.buscarPorId(clienteId)) {
      throw new Error(`Cliente ${clienteId} não encontrado.`);
    }
    const carrinho = this.carrinhos.resumo(clienteId);
    if (carrinho.itens.length === 0) {
      throw new Error("O carrinho está vazio.");
    }

    const itens: ItemPedido[] = carrinho.itens.map((item) => {
      const produto = this.produtos.buscarPorId(item.produtoId);
      if (!produto) throw new Error(`Produto ${item.produtoId} não existe mais.`);
      if (item.quantidade > produto.estoque) {
        throw new Error(
          `Estoque insuficiente para "${produto.nome}": pedido ${item.quantidade}, disponível ${produto.estoque}.`
        );
      }
      // Copiamos nome e preço atuais para o pedido: se o produto for reajustado
      // ou removido depois, o histórico do pedido continua correto.
      return {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: item.quantidade,
        precoUnitario: produto.preco,
        subtotal: arredondar(produto.preco * item.quantidade),
      };
    });

    // 2) Só depois de validar TODOS os itens, atualiza o estoque
    for (const item of itens) {
      this.produtos.baixarEstoque(item.produtoId, item.quantidade);
    }

    // 3) Registra o pedido e esvazia o carrinho
    const pedido: Pedido = {
      id: this.proximoId++,
      clienteId,
      itens,
      total: arredondar(itens.reduce((s, i) => s + i.subtotal, 0)),
      data: new Date(),
    };
    this.pedidos.push(pedido);
    this.carrinhos.limpar(clienteId);
    return pedido;
  }

  listar(): Pedido[] {
    return [...this.pedidos]; // devolve uma cópia do array para não expor o original
  }

  listarPorCliente(clienteId: number): Pedido[] {
    if (!this.clientes.buscarPorId(clienteId)) {
      throw new Error(`Cliente ${clienteId} não encontrado.`);
    }
    return this.pedidos.filter((p) => p.clienteId === clienteId);
  }
}
