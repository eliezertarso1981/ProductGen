export type AuthTestimonial = {
  frase: string;
  autor: string;
};

export const AUTH_TESTIMONIALS: AuthTestimonial[] = [
  {
    frase: "As pessoas não compram o que você faz; elas compram o porquê você faz.",
    autor: "Simon Sinek",
  },
  {
    frase: "A única maneira de vencer é aprender mais rápido que os outros.",
    autor: "Eric Ries",
  },
  {
    frase: "Apaixone-se pelo problema, não pela solução.",
    autor: "Uri Levine",
  },
  {
    frase: "Os clientes não se importam com sua solução. Eles se importam com os próprios problemas.",
    autor: "Dave McClure",
  },
  {
    frase: "Se você não sente vergonha da primeira versão do seu produto, lançou tarde demais.",
    autor: "Reid Hoffman",
  },
  {
    frase: "Torne cada detalhe perfeito e limite a quantidade de detalhes a serem perfeitos.",
    autor: "Jack Dorsey",
  },
  {
    frase: "Inovação é dizer não para mil coisas.",
    autor: "Steve Jobs",
  },
  {
    frase: "Construa algo que 100 pessoas amem, não algo que 1 milhão apenas ache legal.",
    autor: "Brian Chesky",
  },
  {
    frase: "Seus clientes mais insatisfeitos são sua maior fonte de aprendizado.",
    autor: "Bill Gates",
  },
  {
    frase: "Valor é criado na mente do usuário, não na fábrica.",
    autor: "Marty Cagan",
  },
  {
    frase: "O trabalho do gerente de produto é descobrir um produto valioso, utilizável e viável.",
    autor: "Marty Cagan",
  },
  {
    frase: "O maior risco é construir algo que ninguém quer.",
    autor: "Marc Andreessen",
  },
  {
    frase: "Foco é saber dizer não.",
    autor: "Steve Jobs",
  },
  {
    frase: "Gestão de produtos é sobre empatia.",
    autor: "Gibson Biddle",
  },
  {
    frase: "O papel de um grande gerente de produto é ser a voz do cliente.",
    autor: "Ben Horowitz",
  },
  {
    frase: "Velocidade e qualidade não são ideias conflitantes.",
    autor: "Elon Musk",
  },
  {
    frase: "Comece pelo cliente e trabalhe de trás para frente.",
    autor: "Jeff Bezos",
  },
  {
    frase: "Grandes times de produto são obcecados pelos resultados do cliente.",
    autor: "Melissa Perri",
  },
  {
    frase: "Os melhores produtos são construídos por times que entendem profundamente o cliente.",
    autor: "Ken Norton",
  },
  {
    frase: "Produto não é apenas o que você constrói. Produto é a experiência inteira.",
    autor: "Julie Zhuo",
  },
  {
    frase: "Nada é tão inútil quanto fazer com eficiência algo que nem deveria ser feito.",
    autor: "Peter Drucker",
  },
  {
    frase: "Qualidade significa fazer certo quando ninguém está olhando.",
    autor: "Henry Ford",
  },
  {
    frase: "Simplicidade é a sofisticação máxima.",
    autor: "Leonardo da Vinci",
  },
  {
    frase: "As pessoas ignoram design que ignora as pessoas.",
    autor: "Frank Chimero",
  },
  {
    frase: "Você precisa começar pela experiência do cliente e voltar para a tecnologia.",
    autor: "Steve Jobs",
  },
  {
    frase: "Não encontre clientes para seus produtos. Encontre produtos para seus clientes.",
    autor: "Seth Godin",
  },
  {
    frase: "Um produto excelente resolve um problema real de forma simples.",
    autor: "Jason Fried",
  },
  {
    frase: "Estratégia é escolher o que não fazer.",
    autor: "Michael Porter",
  },
  {
    frase: "Medição é a primeira etapa que leva ao controle e, eventualmente, à melhoria.",
    autor: "H. James Harrington",
  },
  {
    frase: "O segredo para avançar é começar.",
    autor: "Mark Twain",
  },
  {
    frase:
      "A perfeição é alcançada não quando não há mais nada para adicionar, mas quando não há mais nada para remover.",
    autor: "Antoine de Saint-Exupéry",
  },
  {
    frase: "Quem para de melhorar, para de ser bom.",
    autor: "Philip Kotler",
  },
  {
    frase: "O cliente raramente compra o que a empresa acha que vende.",
    autor: "Peter Drucker",
  },
  {
    frase: "Grandes produtos surgem de times pequenos e focados.",
    autor: "Tony Fadell",
  },
  {
    frase: "O sucesso normalmente vem para quem está ocupado demais para procurar por ele.",
    autor: "Henry David Thoreau",
  },
  {
    frase: "Teste cedo. Falhe rápido. Aprenda sempre.",
    autor: "Tom Kelley",
  },
  {
    frase: "A melhor maneira de prever o futuro é criá-lo.",
    autor: "Peter Drucker",
  },
  {
    frase:
      "Clientes não esperam que você seja perfeito. Eles esperam que você resolva quando algo der errado.",
    autor: "Donald Porter",
  },
  {
    frase: "Sem dados, você é apenas mais uma pessoa com opinião.",
    autor: "W. Edwards Deming",
  },
  {
    frase: "Produtos vencedores nascem da combinação entre visão, execução e disciplina.",
    autor: "John Doerr",
  },
];

export function pickRandomTestimonial(): AuthTestimonial {
  const index = Math.floor(Math.random() * AUTH_TESTIMONIALS.length);
  return AUTH_TESTIMONIALS[index]!;
}

export function getAuthorInitials(autor: string): string {
  const words = autor.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  const first = words[0]![0] ?? "";
  const second = words[1]![0] ?? "";
  return `${first}${second}`.toUpperCase();
}
