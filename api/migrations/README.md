# Migrações (cópia para deploy)

Fonte de verdade: `DB/migrations/` na raiz do monorepo.

Ao adicionar uma migração nova em `DB/migrations/`, copie o arquivo para esta pasta antes do deploy da API (o Dockerfile copia `api/migrations` para a imagem).

```powershell
Copy-Item ..\DB\migrations\*.sql .\migrations\ -Force
```
