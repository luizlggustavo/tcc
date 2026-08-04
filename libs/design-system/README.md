# Design System TCC

Design system CSS/SCSS desacoplado do frontend Angular.

## Uso

Importe a entrada global no `styles.scss` do app consumidor:

```scss
@use '../../../libs/design-system/src/styles/design-system';
```

Os componentes sao usados com classes HTML nativas prefixadas por `ds-*`, por exemplo:

```html
<button class="ds-botao ds-botao--primario">Iniciar estudo</button>
```

## Regra de arquitetura

Arquivos `.component.scss` nao devem declarar seletores `.ds-*`. Ajustes locais de tela devem ficar fora do contrato do design system.

## Contrato atualmente utilizado

As variantes mantidas no design system possuem uso ativo no frontend. Em SP-019 foram removidos os itens sem referências: `ds-card__cabecalho`, `ds-card__rodape`, `ds-card__descricao`, `ds-chip--alerta`, `ds-chip--neutro` e `ds-ranking`. Antes da remoção, as referências foram verificadas no repositório e nos testes do frontend.
