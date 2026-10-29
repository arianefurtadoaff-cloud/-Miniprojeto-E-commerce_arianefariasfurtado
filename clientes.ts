import { Cliente } from "./types";

// Dados iniciais
export const clientesIniciais: Cliente[] = [
  { id: 1, nome: "Ana Souza", email: "ana@email.com" },
  { id: 2, nome: "Bruno Lima", email: "bruno@email.com" },
  { id: 3, nome: "Carla Mendes", email: "carla@email.com" },
];

export class ClienteService {
  private clientes: Cliente[];

  constructor(iniciais: Cliente[] = []) {
    this.clientes = iniciais.map((c) => ({ ...c }));
  }

  cadastrar(cliente: Cliente): Cliente {
    if (!Number.isInteger(cliente.id) || cliente.id <= 0) {
      throw new Error("O id do cliente deve ser um inteiro positivo.");
    }
    if (this.clientes.some((c) => c.id === cliente.id)) {
      throw new Error(`Já existe um cliente com o id ${cliente.id}.`);
    }
    if (typeof cliente.nome !== "string" || cliente.nome.trim() === "") {
      throw new Error("O nome do cliente deve ser preenchido.");
    }
    // Formato simples de e-mail: algo@dominio.ext
    if (typeof cliente.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
      throw new Error("E-mail inválido.");
    }
    // E-mail guardado em minúsculas, para "Ana@x.com" e "ana@x.com" contarem como o mesmo.
    const email = cliente.email.trim().toLowerCase();
    if (this.clientes.some((c) => c.email.toLowerCase() === email)) {
      throw new Error(`Já existe um cliente com o e-mail ${email}.`);
    }
    const novo = { id: cliente.id, nome: cliente.nome.trim(), email };
    this.clientes.push(novo);
    return { ...novo };
  }

  listar(): Cliente[] {
    return this.clientes.map((c) => ({ ...c }));
  }

  buscarPorId(id: number): Cliente | undefined {
    const c = this.clientes.find((x) => x.id === id);
    return c ? { ...c } : undefined;
  }

  buscarPorNome(termo: string): Cliente[] {
    const t = termo.trim().toLowerCase();
    return this.clientes.filter((c) => c.nome.toLowerCase().includes(t)).map((c) => ({ ...c }));
  }
}
