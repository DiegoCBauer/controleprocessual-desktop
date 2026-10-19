# Controle Processual — aplicativo desktop

Aplicativo Windows que abre o [Controle Processual](https://cpclezarkuchler.vercel.app/) em janela própria, sem o navegador.
Ele carrega a versão online do sistema, então tudo que for publicado no Vercel aparece no aplicativo na hora.
Login, usuários e dados continuam os mesmos (Supabase).

## Instalar
Baixe o instalador mais recente em **Releases** (`ControleProcessual-Setup-x.y.z.exe`) e execute.
O Windows pode mostrar "O Windows protegeu o computador" porque o instalador não tem assinatura digital:
clique em **Mais informações → Executar assim mesmo**.

O aplicativo se atualiza sozinho quando uma nova versão é publicada aqui.

## Desenvolvimento
```bash
npm install
npm start          # roda o aplicativo
npm run icon       # regera os ícones
npm run dist       # gera o instalador em dist/
```

## Publicar nova versão do aplicativo
Só é necessário quando mudar o próprio aplicativo (não o sistema web):
1. Aumente `version` no `package.json`.
2. `npm run dist`
3. `gh release create vX.Y.Z dist/ControleProcessual-Setup-X.Y.Z.exe dist/ControleProcessual-Setup-X.Y.Z.exe.blockmap dist/latest.yml`
