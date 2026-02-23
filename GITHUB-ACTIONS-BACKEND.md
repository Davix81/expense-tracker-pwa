# ⚙️ GitHub Actions como Backend (Experimental)

## Concepto

Usar GitHub Actions con `workflow_dispatch` para escribir datos sin exponer token.

## Arquitectura

```
Frontend → Trigger GitHub Action → Action escribe en repo
```

## Ventajas

✅ Sin backend adicional
✅ Token seguro en GitHub Actions
✅ Gratis

## Desventajas

❌ No es tiempo real (delay de ~30 segundos)
❌ Limitado por rate limits de GitHub Actions
❌ Complejo de implementar
❌ No es ideal para producción

## Implementación Básica

### 1. Crear Workflow

`.github/workflows/save-expenses.yml`:

```yaml
name: Save Expenses

on:
  workflow_dispatch:
    inputs:
      data:
        description: 'Encrypted expenses data'
        required: true
        type: string

jobs:
  save:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout expenses-data
        uses: actions/checkout@v4
        with:
          repository: Davix81/expenses-data
          token: ${{ secrets.EXPENSES_DATA_TOKEN }}
          
      - name: Save data
        run: |
          echo "${{ inputs.data }}" > data/expenses.json
          
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/expenses.json
          git commit -m "Update expenses via Actions"
          git push
```

### 2. Modificar Frontend

Llamar al workflow en lugar de GitHub API directamente:

```typescript
async saveExpenses(expenses: Expense[]): Promise<void> {
  const encrypted = await this.encrypt(expenses);
  
  // Trigger workflow
  await fetch('https://api.github.com/repos/Davix81/expense-tracker-pwa/actions/workflows/save-expenses.yml/dispatches', {
    method: 'POST',
    headers: {
      'Authorization': `token ${PUBLIC_TRIGGER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: 'master',
      inputs: {
        data: encrypted
      }
    })
  });
  
  // Esperar a que se complete (polling)
  await this.waitForSave();
}
```

### 3. Problemas

- Necesitas un token para trigger el workflow (mismo problema)
- Delay significativo
- Experiencia de usuario pobre

## Conclusión

Esta solución es muy compleja y no resuelve el problema fundamental del token.

**Recomendación:** Usa backend proxy (Vercel) en su lugar.
