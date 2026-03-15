# RPG Web Arena ⚔️

Um jogo de RPG simples para navegador (Vanilla JS + HTML/CSS) alimentado por uma API REST robusta construída em Node.js e PostgreSQL. 
Este projeto foi idealizado para simular a criação de conta, gestão de personagens, inventário, lojas mecânicas de nivelamento e batalhas em turnos. Formato comumente utilizado em projetos finais (TCC).

---

## 🛠️ Tecnologias Utilizadas

### Backend
*   **Node.js & Express:** Servidor e roteamento da API.
*   **PostgreSQL (`pg`):** Banco de dados relacional (garante a persistência de personagens, contas, e progresso de servidor).
*   **Bcrypt (`bcrypt`):** Criptografia segura das senhas dos usuários.
*   **JSON Web Token (`jsonwebtoken`):** Autenticação e proteção das rotas privadas (impedindo manipulação de dados de outros jogadores).
*   **Dotenv:** Gerenciamento de variáveis de ambiente.

### Frontend
*   **HTML5, CSS3, JavaScript (Vanilla):** Sem frameworks pesados! Comunicação direta via `Fetch API` manipulando o DOM e trabalhando com LocalStorage para salvar a sessão do jogador ao logar.
*   Arquitetura de **Múltiplas Páginas** separando as responsabilidades (Visuais e Contexto).

---

## 🚀 Como Configurar e Rodar o Projeto

1. **Pré-requisitos:**  
   Você precisará ter o [Node.js](https://nodejs.org/) e o [PostgreSQL](https://www.postgresql.org/) instalados na sua máquina.

2. **Instalação das Dependências:**  
   No terminal raiz do projeto, execute o comando:
   ```bash
   npm install
   ```

3. **Configuração do Banco de Dados:**  
   * Crie um banco de dados no seu Postgres chamado `rpg_game`.
   * Execute os scripts `database.sql` e depois o `database-update.sql` contidos neste repositório para criar as tabelas `users`, `characters`, `inventory` e `active_battles`.

4. **Configuração das Variáveis de Ambiente:**  
   Abra o arquivo `.env` e configure com seu usuário e senha do banco de dados local:
   ```env
   PORT=3000
   DB_USER=postgres
   DB_PASSWORD=sua_senha_do_postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=rpg_game
   JWT_SECRET=super_secret_jwt_key
   ```

5. **Iniciar o Servidor:**
   ```bash
   npm run dev    # ou npm start
   ```
   *O backend subirá na porta 3000.*  
   *Acesse o jogo pelo navegador em: `http://localhost:3000/`*

---

## 🗂️ Estritetura e Rotas da API Rest (Documentação)

A maior parte dos Endpoints exigem que você esteja autenticado, significando que o Header da requisição possui um Token JWT: `Authorization: Bearer <TOKEN>`.

### 🛡️ Autenticação (Usuários) - `/api/auth`
*   `POST /register` - Cria uma nova conta exigindo *nome, apelido, email, senha (+8 caract.), idade, gênero, e país.*
*   `POST /login` - Recebe `email` e `password`. Se validado, retorna um Token JWT.
*   `GET /profile` - *(Privado)* Retorna todas as informações da conta do jogador logado atualmente.
*   `PUT /profile` - *(Privado)* Atualiza dados da conta atual (Apenas: Nome, Idade, Gênero e País).

### 🧙 Personagem - `/api/character`
*   `POST /create` - *(Privado)* Cria um personagem para o usuário atual dado o `name` e `characterClass`. (Classes: *Guerreiro, Arqueiro ou Mago*).
*   `GET /` - *(Privado)* Retorna a ficha completa do personagem, incluindo nível, ouro, exp, HP base e HP atual, e atributos somados.

### ⚔️ Batalha em Turnos - `/api/battle`
*   `POST /start` - *(Privado)* Aleatoriza um monstro da lista base, salva o status dele na tabela de batalhas ativas e devolve as info do embate.
*   `POST /action` - *(Privado)* Rota do turno. Espera o objeto `{ "action": "X" }`.
    *   `"attack"`: Dano = (Seu Ataque Base + Ataque da Espada se equipada) - Defesa do Monstro. Monstro ataca na volta.
    *   `"defend"`: Dobra a defesa e aguarda o monstro atacar.
    *   `"potion"`: Checa inventário, gasta `1` poção se houver e curar `50 HP`.
    *   `"flee"`: Foge da batalha e limpa o registro dinâmico no banco.

### 🏪 Loja - `/api/shop`
*   `GET /items` - *(Privado)* Retorna uma lista em JSON com os produtos virtuais para a compra (poções e equipamentos).
*   `POST /buy` - *(Privado)* Pede um `{ "itemId": "id" }`. Valida se o personagem possui *Ouro* (> 0), subtrai, e envia para a tabela do seu inventário.

### 🎒 Inventário - `/api/inventory`
*   `GET /` - *(Privado)* Lista tudo o que o personagem possui guardado, as quantidades, e quais itens estão "Equipados".
*   `POST /equip` - *(Privado)* Recebe `{ "inventoryId": 1, "equip": true/false }`. Se for uma arma/escudo, desequipa a anterior e equipa a nova ativando os buffs nos status.
*   `POST /use` - *(Privado)* Consome itens permitidos fora da batalha e atualiza seu HP. Se chegar a 0 em quantidade deleta a linha.

---

## 🎨 Lógica Base das Classes

| Classe     | Vida | Ataque Base | Defesa Base | Velocidade |
|------------|------|-------------|-------------|------------|
| **Guerreiro**  | 120  | 10          | 15          | 5          |
| **Arqueiro**   | 90   | 12          | 8           | 15         |
| **Mago**       | 80   | 18          | 5           | 8          |

*As dinâmicas também possuem evolução progressiva de **LEVELS** (Sistema implementado em `gameLogic.js`).*

---
**Desenvolvido com IA e paixão!** 🚀
