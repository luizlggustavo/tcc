const fs = require('node:fs');
const path = require('node:path');

const raiz = process.cwd();
const diretorioFrontend = path.join(raiz, 'apps/frontend/src/app');
const seletorDesignSystem = /\.ds-[a-z0-9_-]/i;
const arquivosComViolacao = [];

function listarArquivosScss(diretorio) {
  if (!fs.existsSync(diretorio)) {
    return [];
  }

  return fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(diretorio, entrada.name);

    if (entrada.isDirectory()) {
      return listarArquivosScss(caminho);
    }

    return entrada.isFile() && entrada.name.endsWith('.component.scss')
      ? [caminho]
      : [];
  });
}

for (const arquivo of listarArquivosScss(diretorioFrontend)) {
  const conteudo = fs.readFileSync(arquivo, 'utf8');

  if (seletorDesignSystem.test(conteudo)) {
    arquivosComViolacao.push(path.relative(raiz, arquivo));
  }
}

if (arquivosComViolacao.length > 0) {
  console.error('Seletores .ds-* nao podem ser declarados em .component.scss:');
  for (const arquivo of arquivosComViolacao) {
    console.error(`- ${arquivo}`);
  }
  process.exit(1);
}

console.log('Design system validado: nenhum .component.scss declara .ds-.');
