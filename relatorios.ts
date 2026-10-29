import { ClienteService } from "./clientes";
import { PedidoService } from "./pedidos";
import { ProdutoService } from "./produtos";
import { Pedido, ResumoVendas, VendaPorProduto } from "./types";

const brl = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const arredondar = (n: number): number => Math.round(n * 100) / 100;

/** Consolida uma lista de pedidos em totais e ranking de produtos. */
export function consolidarVendas(pedidos: Pedido[]): ResumoVendas {
  const porProduto = new Map<number, VendaPorProduto>();
  let itensVendidos = 0;
  let faturamento = 0;

  for (const pedido of pedidos) {
    faturamento += pedido.total;
    for (const item of pedido.itens) {
      itensVendidos += item.quantidade;
      const atual = porProduto.get(item.produtoId) ?? {
        produtoId: item.produtoId,
        nome: item.nome,
        quantidade: 0,
        receita: 0,
      };
      atual.quantidade += item.quantidade;
      atual.receita = arredondar(atual.receita + item.subtotal);
      porProduto.set(item.produtoId, atual);
    }
  }

  return {
    totalPedidos: pedidos.length,
    itensVendidos,
    faturamento: arredondar(faturamento),
    // Evita divisão por zero quando ainda não há pedidos.
    ticketMedio: pedidos.length > 0 ? arredondar(faturamento / pedidos.length) : 0,
    ranking: [...porProduto.values()].sort((a, b) => b.quantidade - a.quantidade),
  };
}

/** Relatório de vendas: totais e produtos mais vendidos. */
export function exibirRelatorioVendas(pedidos: PedidoService): void {
  const r = consolidarVendas(pedidos.listar());
  console.log("--- Relatório de vendas ---");
  console.log(`Pedidos realizados : ${r.totalPedidos}`);
  console.log(`Itens vendidos     : ${r.itensVendidos}`);
  console.log(`Faturamento total  : ${brl(r.faturamento)}`);
  console.log(`Ticket médio       : ${brl(r.ticketMedio)}`);
  console.log("Produtos mais vendidos:");
  r.ranking.forEach((v, i) =>
    console.log(`  ${i + 1}. ${v.nome} - ${v.quantidade} un. (${brl(v.receita)})`)
  );
}

/** Relatório de estoque: valor total em estoque e produtos com estoque baixo. */
export function exibirRelatorioEstoque(produtos: ProdutoService, limiteBaixo = 10): void {
  const lista = produtos.listar();
  const valorTotal = arredondar(lista.reduce((s, p) => s + p.preco * p.estoque, 0));
  const unidades = lista.reduce((s, p) => s + p.estoque, 0);
  console.log("--- Relatório de estoque ---");
  console.log(`Produtos cadastrados : ${lista.length}`);
  console.log(`Unidades em estoque  : ${unidades}`);
  console.log(`Valor em estoque     : ${brl(valorTotal)}`);
  const baixos = lista.filter((p) => p.estoque <= limiteBaixo);
  console.log(`Estoque baixo (<= ${limiteBaixo}):`);
  if (baixos.length === 0) console.log("  nenhum");
  baixos.forEach((p) => console.log(`  - ${p.nome}: ${p.estoque} un.`));
}

/** Relatório de clientes: quantidade de pedidos e total gasto por cliente. */
export function exibirRelatorioClientes(clientes: ClienteService, pedidos: PedidoService): void {
  console.log("--- Relatório por cliente ---");
  for (const c of clientes.listar()) {
    const dele = pedidos.listarPorCliente(c.id);
    const gasto = arredondar(dele.reduce((s, p) => s + p.total, 0));
    console.log(`  ${c.nome}: ${dele.length} pedido(s), total gasto ${brl(gasto)}`);
  }
}
