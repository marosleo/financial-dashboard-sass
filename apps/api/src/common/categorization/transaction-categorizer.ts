type CategorySource = "PROVIDER" | "HEURISTIC";

type CategorizationInput = {
  type: "INCOME" | "EXPENSE";
  providerCategory: string | null;
  merchantName: string | null;
  description: string;
};

export type AutomaticCategory = {
  name: string;
  source: CategorySource;
  confidence: number;
};

const categoryPatterns = [
  {
    name: "Alimentação",
    pattern:
      /aliment|food|restaurant|grocery|mercado|supermerc|padaria|acougue|ifood|rappi|delivery/,
  },
  {
    name: "Transporte",
    pattern:
      /transport|mobility|uber|99app|99 taxi|taxi|combust|gas station|posto|estacion|pedagio|metro|onibus|rodovi/,
  },
  {
    name: "Moradia",
    pattern:
      /housing|home|rent|moradia|aluguel|condominio|energia|electric|agua|saneamento|gas residencial/,
  },
  {
    name: "Saúde",
    pattern:
      /health|medical|saude|farmacia|drogaria|hospital|clinica|medic|odont|laboratorio/,
  },
  {
    name: "Educação",
    pattern:
      /education|educacao|escola|faculdade|universidade|curso|udemy|alura|livraria/,
  },
  {
    name: "Lazer",
    pattern:
      /entertainment|recreation|lazer|cinema|netflix|spotify|streaming|prime video|disney|hbo|steam|playstation|xbox/,
  },
  {
    name: "Compras",
    pattern:
      /shopping|retail|compra|amazon|mercado livre|shopee|magalu|magazine luiza|loja|vestuario|clothing/,
  },
  {
    name: "Serviços",
    pattern:
      /services?|servico|internet|telefone|celular|claro|vivo|telefonica|contabilidade|software|subscription|assinatura/,
  },
  {
    name: "Impostos e taxas",
    pattern:
      /tax|fee|imposto|tarifa|anuidade|juros|interest|multa|iof|ipva|iptu/,
  },
  {
    name: "Transferências",
    pattern: /transfer|pix|ted|doc |pagamento de boleto|bank slip/,
  },
] as const;

export function inferTransactionCategory(
  input: CategorizationInput,
): AutomaticCategory {
  const providerCategory = input.providerCategory?.trim();
  if (providerCategory) {
    return {
      name: matchCategory(providerCategory) ?? providerCategory,
      source: "PROVIDER",
      confidence: 0.7,
    };
  }

  if (input.type === "INCOME") {
    return { name: "Receitas", source: "HEURISTIC", confidence: 0.9 };
  }

  const transactionText = [input.merchantName, input.description]
    .filter(Boolean)
    .join(" ");
  const inferred = matchCategory(transactionText);

  return inferred
    ? { name: inferred, source: "HEURISTIC", confidence: 0.8 }
    : { name: "Outros", source: "HEURISTIC", confidence: 0.5 };
}

function matchCategory(value: string) {
  const normalized = normalize(value);
  return categoryPatterns.find(({ pattern }) => pattern.test(normalized))?.name;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
