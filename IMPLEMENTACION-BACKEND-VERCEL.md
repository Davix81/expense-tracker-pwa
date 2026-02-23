# 🚀 Implementación: Backend Proxy con Vercel

## Arquitectura de la Solución

```
┌──────────────────┐
│  Frontend PWA    │
│  (GitHub Pages)  │
└────────┬─────────┘
         │ HTTPS
         ▼
┌──────────────────┐
│  Vercel API      │
│  (Serverless)    │
│  - GET /expenses │
│  - PUT /expenses │
│  - GET /settings │
│  - PUT /settings │
└────────┬─────────┘
         │ Token seguro
         ▼
┌──────────────────┐
│  GitHub API      │
│  expenses-data   │
└──────────────────┘
```

## Paso 1: Crear Proyecto Backend

### Estructura del Proyecto

```
expense-tracker-api/
├── api/
│   ├── expenses.js
│   └── settings.js
├── lib/
│   └── github.js
├── vercel.json
├── package.json
└── .gitignore
```

### Archivos a Crear

#### 1. `package.json`

```json
{
  "name": "expense-tracker-api",
  "version": "1.0.0",
  "description": "Backend API for Expense Tracker PWA",
  "main": "index.js",
  "scripts": {
    "dev": "vercel dev"
  },
  "dependencies": {
    "@octokit/rest": "^20.0.2"
  },
  "devDependencies": {
    "vercel": "^33.0.0"
  }
}
```

#### 2. `vercel.json`

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "https://davix81.github.io" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    }
  ]
}
```

#### 3. `lib/github.js`

```javascript
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const OWNER = 'Davix81';
const REPO = 'expenses-data';
const BRANCH = 'main';

async function getFile(path) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: path,
      ref: BRANCH
    });
    
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return {
      content: JSON.parse(content),
      sha: data.sha
    };
  } catch (error) {
    if (error.status === 404) {
      return { content: null, sha: null };
    }
    throw error;
  }
}

async function updateFile(path, content, sha, message) {
  const contentBase64 = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  
  const params = {
    owner: OWNER,
    repo: REPO,
    path: path,
    message: message,
    content: contentBase64,
    branch: BRANCH
  };
  
  if (sha) {
    params.sha = sha;
  }
  
  const { data } = await octokit.repos.createOrUpdateFileContents(params);
  return data;
}

module.exports = { getFile, updateFile };
```

#### 4. `api/expenses.js`

```javascript
const { getFile, updateFile } = require('../lib/github');

const FILE_PATH = 'data/expenses.json';

module.exports = async (req, res) => {
  // Verificar autenticación básica
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Leer expenses
      const { content } = await getFile(FILE_PATH);
      return res.status(200).json(content || []);
      
    } else if (req.method === 'PUT') {
      // Actualizar expenses
      const expenses = req.body;
      const { sha } = await getFile(FILE_PATH);
      
      await updateFile(
        FILE_PATH,
        expenses,
        sha,
        'Update expenses via API'
      );
      
      return res.status(200).json({ success: true });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
```

#### 5. `api/settings.js`

```javascript
const { getFile, updateFile } = require('../lib/github');

const FILE_PATH = 'data/settings.json';

module.exports = async (req, res) => {
  // Verificar autenticación básica
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Leer settings
      const { content } = await getFile(FILE_PATH);
      return res.status(200).json(content || {});
      
    } else if (req.method === 'PUT') {
      // Actualizar settings
      const settings = req.body;
      const { sha } = await getFile(FILE_PATH);
      
      await updateFile(
        FILE_PATH,
        settings,
        sha,
        'Update settings via API'
      );
      
      return res.status(200).json({ success: true });
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
```

#### 6. `.gitignore`

```
node_modules
.vercel
.env
.env.local
```

## Paso 2: Deploy en Vercel

### 2.1 Crear Cuenta en Vercel

1. Ve a https://vercel.com
2. Regístrate con tu cuenta de GitHub
3. Es gratis para proyectos personales

### 2.2 Crear Repositorio para el Backend

```bash
# Crear nuevo repositorio
mkdir expense-tracker-api
cd expense-tracker-api
git init

# Copiar los archivos creados arriba
# ...

git add .
git commit -m "Initial commit: Backend API"

# Crear repositorio en GitHub y push
git remote add origin https://github.com/Davix81/expense-tracker-api.git
git push -u origin main
```

### 2.3 Importar en Vercel

1. En Vercel, click "Add New Project"
2. Importa el repositorio `expense-tracker-api`
3. Vercel detectará automáticamente que es un proyecto de Serverless Functions
4. Click "Deploy"

### 2.4 Configurar Variables de Entorno

En Vercel, ve a Settings → Environment Variables y agrega:

- `GITHUB_TOKEN`: Tu Personal Access Token (con scope `repo`)
- `API_SECRET`: Un secreto aleatorio para autenticar las peticiones (ej: `my-secret-key-123`)

```bash
# Generar un API_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Paso 3: Actualizar el Frontend

### 3.1 Crear Nuevo Servicio API

Crear `src/app/services/api-storage.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../models/expense.model';
import { Settings } from '../models/settings.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiStorageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly apiSecret = environment.apiSecret;

  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.apiSecret}`,
      'Content-Type': 'application/json'
    });
  }

  readExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(
      `${this.apiUrl}/expenses`,
      { headers: this.buildHeaders() }
    );
  }

  writeExpenses(expenses: Expense[]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.apiUrl}/expenses`,
      expenses,
      { headers: this.buildHeaders() }
    );
  }

  readSettings(): Observable<Settings> {
    return this.http.get<Settings>(
      `${this.apiUrl}/settings`,
      { headers: this.buildHeaders() }
    );
  }

  writeSettings(settings: Settings): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.apiUrl}/settings`,
      settings,
      { headers: this.buildHeaders() }
    );
  }
}
```

### 3.2 Actualizar Environment

`src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  auth: {
    username: 'admin',
    password: '123'
  },
  apiUrl: 'https://expense-tracker-api.vercel.app/api',
  apiSecret: '__API_SECRET__' // Se inyectará en build time
};
```

### 3.3 Actualizar Workflow

Modificar `.github/workflows/deploy.yml` para inyectar el API_SECRET:

```yaml
- name: Inject API Secret into Build
  env:
    API_SECRET: ${{ secrets.API_SECRET }}
  run: |
    node -e "
    const fs = require('fs');
    const path = 'dist/expense-tracker-pwa/browser';
    const files = fs.readdirSync(path).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      const filePath = path + '/' + file;
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/__API_SECRET__/g, process.env.API_SECRET);
      fs.writeFileSync(filePath, content);
    });
    "
```

### 3.4 Agregar API_SECRET a GitHub Secrets

1. Ve a tu repositorio → Settings → Secrets
2. Agrega `API_SECRET` con el mismo valor que configuraste en Vercel

## Paso 4: Actualizar Componentes

Reemplazar `GitHubStorageService` con `ApiStorageService` en todos los componentes.

## Ventajas de Esta Solución

✅ **Token nunca se expone** - Solo existe en Vercel
✅ **Autenticación adicional** - API_SECRET protege los endpoints
✅ **Gratis** - Vercel es gratis para proyectos personales
✅ **Escalable** - Puedes agregar más funcionalidades
✅ **Logs** - Vercel proporciona logs de todas las peticiones
✅ **HTTPS automático** - Vercel proporciona certificados SSL

## Costos

- Vercel Free Tier: 100GB bandwidth/mes, 100 horas serverless/mes
- Suficiente para uso personal

## Próximos Pasos

1. ¿Quieres que cree los archivos del backend?
2. ¿Prefieres otra plataforma (Netlify, Cloudflare Workers)?
3. ¿Necesitas ayuda con el deploy en Vercel?
