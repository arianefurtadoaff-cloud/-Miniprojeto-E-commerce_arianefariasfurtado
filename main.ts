import { CarrinhoService } from "./carrinho";
import { ClienteService, clientesIniciais } from "./clientes";
import { PedidoService } from "./pedidos";
import { ProdutoService, produtosIniciais } from "./produtos";
import {
  exibirRelatorioClientes,
  exibirRelatorioEstoque,
  exibirRelatorioVendas,
} from "./relatorios";
import { Pedido } from "./types";

const brl = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const titulo = (t: string): void => console.log(`\n=== ${t} ===`);

/** Executa uma operação que deve falhar e mostra a mensagem de erro. */
function esperarErro(descricao: string, fn: () => unknown): void {
  try {
    fn();
    console.log(`✘ [FALHA NO TESTE] "${descricao}" deveria ter dado erro.`);
  } catch (e) {
    console.log(`✔ ${descricao} -> erro esperado: ${(e as Error).message}`);
  }
}

function mostrarPedido(p: Pedido): void {
  console.log(`Pedido #${p.id} | cliente ${p.clienteId} | ${p.data.toLocaleString("pt-BR")}`);
  p.itens.forEach((i) =>
    console.log(`  - ${i.nome}: ${i.quantidade} x ${brl(i.precoUnitario)} = ${brl(i.subtotal)}`)
  );
  console.log(`  Total: ${brl(p.total)}`);
}

// ---------- Inicialização ----------
const produtos = new ProdutoService(produtosIniciais);
const clientes = new ClienteService(clientesIniciais);
const carrinhos = new CarrinhoService(produtos, clientes);
const pedidos = new PedidoService(produtos, clientes, carrinhos);

// ---------- Produtos ----------
titulo("PRODUTOS: cadastro, busca e filtro");
produtos.cadastrar({ id: 7, nome: "Fone Bluetooth", preco: 199.9, estoque: 30, categoria: "Informática" });
console.table(produtos.listar());
console.log("Busca por id 2:", produtos.buscarPorId(2));
console.log("Busca por nome 'mouse':", produtos.buscarPorNome("mouse"));
console.log("Categoria Informática:", produtos.filtrarPorCategoria("informática").map((p) => p.nome));
console.log("Atualização:", produtos.atualizar(7, { preco: 179.9, estoque: 35 }));
produtos.remover(7);
console.log("Produto 7 removido. Existe?", produtos.buscarPorId(7) !== undefined);

// ---------- Clientes ----------
titulo("CLIENTES");
clientes.cadastrar({ id: 4, nome: "Diego Rocha", email: "diego@email.com" });
console.table(clientes.listar());
console.log("Busca por nome 'ana':", clientes.buscarPorNome("ana"));

// ---------- Fluxo completo de compra ----------
titulo("FLUXO COMPLETO DE COMPRA (cliente 1)");
const estoqueAntes = {
  notebook: produtos.buscarPorId(1)!.estoque,
  mouse: produtos.buscarPorId(2)!.estoque,
  camiseta: produtos.buscarPorId(4)!.estoque,
};
carrinhos.adicionarItem(1, 1, 1); // notebook
carrinhos.adicionarItem(1, 2, 2); // mouse
carrinhos.adicionarItem(1, 4, 3); // camiseta
carrinhos.alterarQuantidade(1, 2, 3); // mouse: 2 -> 3
carrinhos.removerItem(1, 4); // remove camiseta
carrinhos.adicionarItem(1, 4, 2); // readiciona 2 camisetas

const resumo = carrinhos.resumo(1);
console.table(resumo.itens);
console.log("Total do carrinho:", brl(resumo.total));
// Conferência manual: 5499.90 + 3*89.90 + 2*59.90 = 5889.40
console.log("Total esperado   :", brl(5499.9 + 3 * 89.9 + 2 * 59.9));

const pedido = pedidos.finalizarCompra(1);
mostrarPedido(pedido);

titulo("ESTOQUE APÓS A COMPRA");
console.log(
  `Notebook: ${estoqueAntes.notebook} -> ${produtos.buscarPorId(1)!.estoque} (esperado ${estoqueAntes.notebook - 1})`
);
console.log(
  `Mouse   : ${estoqueAntes.mouse} -> ${produtos.buscarPorId(2)!.estoque} (esperado ${estoqueAntes.mouse - 3})`
);
console.log(
  `Camiseta: ${estoqueAntes.camiseta} -> ${produtos.buscarPorId(4)!.estoque} (esperado ${estoqueAntes.camiseta - 2})`
);
console.log("Carrinho esvaziado?", carrinhos.resumo(1).itens.length === 0);

// Pedido de outro cliente + consultas
carrinhos.adicionarItem(2, 5, 1);
pedidos.finalizarCompra(2);

titulo("CONSULTA DE PEDIDOS");
console.log("Todos os pedidos:", pedidos.listar().map((p) => `#${p.id} (cliente ${p.clienteId}, ${brl(p.total)})`));
console.log("Pedidos do cliente 1:", pedidos.listarPorCliente(1).map((p) => `#${p.id}`));

// Preço histórico preservado após reajuste
produtos.atualizar(1, { preco: 6000 });
console.log("Preço do notebook no pedido #1 após reajuste:", brl(pedidos.listar()[0].itens[0].precoUnitario));

// ---------- Relatórios ----------
titulo("RELATÓRIOS");
exibirRelatorioVendas(pedidos);
console.log();
exibirRelatorioEstoque(produtos, 10);
console.log();
exibirRelatorioClientes(clientes, pedidos);

// ---------- Situações inválidas ----------
titulo("SITUAÇÕES INVÁLIDAS");
esperarErro("Cadastrar produto com preço negativo", () =>
  produtos.cadastrar({ id: 8, nome: "Teste", preco: -10, estoque: 5, categoria: "X" })
);
esperarErro("Cadastrar produto com id duplicado", () =>
  produtos.cadastrar({ id: 1, nome: "Duplicado", preco: 10, estoque: 5, categoria: "X" })
);
esperarErro("Cadastrar produto com nome vazio", () =>
  produtos.cadastrar({ id: 9, nome: "   ", preco: 10, estoque: 5, categoria: "X" })
);
esperarErro("Cadastrar produto com estoque negativo", () =>
  produtos.cadastrar({ id: 10, nome: "Y", preco: 10, estoque: -1, categoria: "X" })
);
esperarErro("Adicionar quantidade acima do estoque", () => carrinhos.adicionarItem(3, 5, 999));
esperarErro("Adicionar quantidade zero", () => carrinhos.adicionarItem(3, 2, 0));
esperarErro("Adicionar produto inexistente", () => carrinhos.adicionarItem(3, 999, 1));
esperarErro("Finalizar compra de cliente inexistente", () => pedidos.finalizarCompra(999));
esperarErro("Finalizar compra com carrinho vazio", () => pedidos.finalizarCompra(3));

// Atomicidade: estoque do produto muda depois de entrar no carrinho
carrinhos.adicionarItem(3, 2, 2); // mouse (item válido)
carrinhos.adicionarItem(3, 5, 10); // tênis (estoque atual: 14)
produtos.atualizar(5, { estoque: 1 }); // agora o tênis não atende
const estoqueMouse = produtos.buscarPorId(2)!.estoque;
esperarErro("Finalizar com um item sem estoque suficiente", () => pedidos.finalizarCompra(3));
console.log(
  "Estoque do mouse intacto após falha?",
  produtos.buscarPorId(2)!.estoque === estoqueMouse
);
