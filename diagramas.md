# Diagramas — RPG TCC

> Visualize este arquivo no VS Code com a extensão **Markdown Preview Mermaid Support**  
> ou acesse [mermaid.live](https://mermaid.live) e cole o código de cada diagrama.

---

## Diagrama de Casos de Uso

```mermaid
flowchart LR
    Jogador(["👤 Jogador"])
    Sistema(["⚙️ Sistema"])

    subgraph Autenticação
        UC1("Registrar Conta")
        UC2("Fazer Login")
        UC3("Fazer Logout")
    end

    subgraph Personagem
        UC4("Criar Personagem")
        UC5("Visualizar Status")
        UC6("Distribuir Pontos de Atributo")
        UC7("Descansar na Estalagem")
    end

    subgraph Combate
        UC8("Iniciar Batalha")
        UC9("Escolher Ação de Combate")
        UC10("Fugir da Batalha")
        UC11("Receber Recompensa")
    end

    subgraph Missões
        UC12("Visualizar Missões Diárias")
        UC13("Progredir em Missão")
        UC14("Resgatar Recompensa de Missão")
    end

    subgraph Inventário
        UC15("Visualizar Inventário")
        UC16("Equipar / Desequipar Item")
        UC17("Usar Poção")
    end

    subgraph Loja
        UC18("Visualizar Itens à Venda")
        UC19("Comprar Item")
        UC20("Vender Item")
    end

    subgraph Exploração
        UC21("Visualizar Mapa")
        UC22("Ver Detalhes de Região")
    end

    subgraph Social
        UC23("Visualizar Ranking")
        UC24("Ver Conquistas")
    end

    subgraph Configurações
        UC25("Editar Perfil")
        UC26("Reiniciar Tutorial")
    end

    Sistema --> UC13
    Sistema --> UC11

    Jogador --> UC1
    Jogador --> UC2
    Jogador --> UC3
    Jogador --> UC4
    Jogador --> UC5
    Jogador --> UC6
    Jogador --> UC7
    Jogador --> UC8
    Jogador --> UC9
    Jogador --> UC10
    Jogador --> UC12
    Jogador --> UC14
    Jogador --> UC15
    Jogador --> UC16
    Jogador --> UC17
    Jogador --> UC18
    Jogador --> UC19
    Jogador --> UC20
    Jogador --> UC21
    Jogador --> UC22
    Jogador --> UC23
    Jogador --> UC24
    Jogador --> UC25
    Jogador --> UC26

    UC8 -->|"«include»"| UC9
    UC11 -->|"«include»"| UC13
    UC19 -->|"«extend»"| UC15
```

---

## Diagrama de Classes

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nomeCompleto
        +string apelido
        +string email
        +string senhaCriptografada
        +int idade
        +string genero
        +string pais
        +datetime criadoEm
        +registrar()
        +entrar()
        +sair()
        +atualizarPerfil()
    }

    class Personagem {
        +int id
        +int idUsuario
        +string nome
        +string classe
        +string genero
        +int nivel
        +int experiencia
        +int ouro
        +int vidaAtual
        +int vidaBase
        +int ataqueBase
        +int defesaBase
        +int velocidadeBase
        +int pontosAtributo
        +distribuirPontos()
        +subirNivel()
        +descansarEstalagem()
        +verStatus()
    }

    class ItemInventario {
        +int id
        +int idPersonagem
        +string nomeItem
        +string tipoItem
        +int quantidade
        +bool estaEquipado
        +int bonusAtributo
        +string slotEquipamento
        +equipar()
        +desequipar()
        +usar()
    }

    class BatalhaAtiva {
        +int id
        +int idPersonagem
        +string nomeMonstro
        +int vidaMonstro
        +int vidaMaxMonstro
        +int ataqueMonstro
        +int defesaMonstro
        +string estado
        +atacar()
        +fugir()
        +resolverRodada()
    }

    class Conquista {
        +int id
        +string chave
        +string nome
        +string descricao
        +string icone
    }

    class ConquistaPersonagem {
        +int id
        +int idPersonagem
        +int idConquista
        +datetime desbloqueadaEm
        +desbloquear()
    }

    class MissaoDiaria {
        +string chave
        +string tipo
        +int nivelMinimo
        +int nivelMaximo
        +int meta
        +string nomeBoss
        +int recompensaOuro
        +int recompensaXP
        +string titulo
        +string descricao
    }

    class MissaoDiariaPersonagem {
        +int id
        +int idPersonagem
        +string chaveMissao
        +date dataMissao
        +int progresso
        +bool concluida
        +bool resgatada
        +atualizarProgresso()
        +resgatar()
    }

    class ItemLoja {
        +int id
        +string nome
        +string tipo
        +string slotEquipamento
        +int bonusAtributo
        +int preco
        +int estoque
        +string temporada
    }

    class LogicaJogo {
        +sortearMissoesDiarias(idPersonagem, nivel)
        +buscarMissaoPorChave(chave)
        +calcularRodadaBatalha()
        +verificarSubidaNivel()
        +verificarConquistas()
        +gerarMonstro(nivel)
    }

    Usuario "1" --> "0..1" Personagem : possui
    Personagem "1" --> "0..*" ItemInventario : carrega
    Personagem "1" --> "0..1" BatalhaAtiva : participa
    Personagem "1" --> "0..*" ConquistaPersonagem : desbloqueia
    Personagem "1" --> "0..*" MissaoDiariaPersonagem : recebe
    Conquista "1" --> "0..*" ConquistaPersonagem : referenciada
    MissaoDiaria "1" --> "0..*" MissaoDiariaPersonagem : define
    LogicaJogo ..> Personagem : operaSobre
    LogicaJogo ..> BatalhaAtiva : gerencia
    LogicaJogo ..> MissaoDiaria : seleciona
    ItemLoja ..> ItemInventario : origina
```
