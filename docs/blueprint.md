# **App Name**: IFCoins Digital

## Core Features:

- Login por função: Implementação de um sistema de login baseado em função (administrador, professor/funcionário, aluno) utilizando Firebase Authentication e redirecionamento para o painel específico.
- Recompensa com IFCoins: Permitir que professores/funcionários recompensem alunos com IFCoins, individualmente ou por turma, exigindo justificativa e limitando a 10 IFCoins por hora por aluno. Inclui histórico de recompensas.
- Loja de Cartas: Implementar uma loja onde os alunos podem comprar cartas digitais individuais ou pacotes de cartas aleatórias usando IFCoins. Pacotes tem disponibilidade limitada por mês e cartas são categorizadas por raridade (Comum, Raro, Lendário, Mítico).
- Coleção de Cartas: Permitir que os alunos visualizem sua coleção pessoal de cartas, com nome, imagem, raridade e quantidade. As cartas podem ser filtradas e ordenadas.
- Sistema de Trocas: Implementar um sistema onde os alunos podem propor trocas de cartas por cartas, cartas por IFCoins ou uma combinação. As trocas devem ser aceitas ou recusadas e o histórico de trocas deve ser armazenado.
- Sistema de Eventos: Permitir que administradores criem eventos especiais, liguem cartas especiais (lendárias ou míticas) a esses eventos, definam datas de início e fim e apliquem um multiplicador de moedas durante o evento.
- Pré-registro de Alunos: Permitir que os administradores pré-registrem alunos usando RA (Registro Acadêmico) e listas de e-mail. Os alunos recebem um e-mail para definir sua senha e ativar sua conta.
- Multiplicadores de Bônus: Permitir que os administradores ativem eventos de bônus, onde os IFCoins recebidos pelos alunos são multiplicados. É possível definir um horário de início e término para o multiplicador.
- Rankings e Leaderboards: Exibir uma lista dos melhores alunos com base no saldo de moedas e os melhores colecionadores (alunos com mais cartas ou cartas raras).
- Notificações e Alertas: Notificar os alunos quando recebem moedas, compram uma carta ou pacote ou recebem uma proposta de troca. Notificar professores e administradores quando as ações exigirem sua atenção.

## Style Guidelines:

- Cor primária: Azul institucional `#004A94`
- Cor secundária: Cinza claro `#F0F0F0` (fundos, áreas neutras)
- Accent: Verde `#90EE90` (para CTAs, destaques importantes)
- Cor do texto: Cinza escuro `#333333`
- Fontes: Fontes sans-serif limpas e legíveis (por exemplo, Inter, Roboto)
- Layout responsivo (mobile-first).
- Navegação na barra lateral com: Home, Loja, Coleção, Trocas, Eventos, Rankings, Painel de administração (somente para administradores), Painel do professor (somente para funcionários)
- Barra superior: Mostra o nome do usuário conectado, a função e a opção de logout.
- Cartas exibidas com animação de flip ou destaque ao passar o mouse.
- Transições suaves entre as páginas (por exemplo, fade in/out).
- Tags de status claras nas cartas (Comum, Raro, Lendário, Mítico).
- Manipulação amigável de erros (por exemplo, "IFCoins insuficientes" com sugestões).
- Design acessível (contraste de cores, tamanho da fonte, botões responsivos).
- Ao comprar um pacote: efeito de abertura animado (como abrir uma caixa de saque).
- Ao ganhar IFCoins: efeito de confete (pequeno, limpo).
- Ao concluir uma negociação: popup modal de sucesso.

## Original User Request:
I want to create a responsive gamified educational web system called IFCoins, intended for students and staff at a school (IFPR). The system should be a website with mobile compatibility. It uses Firebase Authentication, Firebase Realtime Database, a React frontend, and a Node.js backend, following REST principles.

🧭 Purpose of the System
The platform allows teachers and staff to reward students with virtual coins (IFCoins) for good behavior, timely homework submission, participation in school activities, etc. Students can use these coins to purchase collectible digital cards or card packs, and trade cards or sell them for coins. There are also limited-time cards linked to real-world school events.

📁 Folder Structure
bash
Copiar
Editar
/ifcoins-app
├── /client (React Frontend)
│   ├── /pages
│   ├── /components
│   ├── /styles
│   └── App.jsx
├── /server (Node.js Backend)
│   ├── /routes
│   ├── /controllers
│   ├── /services
│   └── server.js
└── /firebase
    ├── auth.js
    ├── database.js
    └── rules.json
🧑‍🤝‍🧑 User Roles
Administrator

Registers students (via student ID and email)

Uploads and registers collectible cards (rarity, quantity, image, availability period)

Creates and manages events (name, time period, linked cards)

Configures coin reward multipliers for events

Teacher/Staff

Rewards students or entire classes with IFCoins (with justification)

Limited to 10 coins/hour per student

Can view history of their own rewards

Student

Views coin balance

Purchases cards or packs

Views personal card collection

Proposes and accepts trades with other students

📲 Key Screens

Screen	Description
Login	Firebase login, redirects based on role
Student Dashboard	View balance, quick access to shop, collection, events
Shop	Buy cards or packs using IFCoins
Collection	Student's acquired cards
Trading	Propose/accept trades (cards and/or IFCoins)
Teacher Panel	Give coins, view reward history
Admin Panel	Register students, manage cards/events
Events	View ongoing/past events and special cards
Rankings	Top students (most coins, most complete collection)
🧠 Business Rules
Teachers can only give 10 IFCoins/hour per student

Rewarding requires a short justification

Packs are limited per month and can contain:

60% Common, 30% Rare, 9% Legendary, 1% Mythic

Trades can include multiple cards and/or IFCoins

Admins can define bonus multipliers (e.g., double coins during school events)

Students receive a password setup email after pre-registration by an Admin

🖼️ Visual Style
Clean, school-like, institutional interface

Sidebar with navigation icons and labels

Cards displayed as flip-style collectible cards with rarity highlights

Notifications (e.g., "You received a rare card!") when buying or opening a pack

✅ MVP Core Features
Role-based login and dashboard

Admin-student registration

Coin rewarding by staff

Card shop with purchases

Student card collection viewer

Admin card registration panel

Basic trading system

📊 Firebase Realtime Database Schema (JSON format)
json
Copiar
Editar
{
  "users": {
    "uid1": {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student", 
      "ra": "2023001",
      "class": "2A",
      "coins": 50,
      "collection": {
        "card001": 1,
        "card005": 2
      },
      "trades": {
        "received": {
          "tradeID123": true
        },
        "sent": {
          "tradeID456": true
        }
      }
    }
  },
  "cards": {
    "card001": {
      "name": "Solar Panel Power",
      "rarity": "common",
      "imageUrl": "https://link.to/image.png",
      "available": true,
      "copiesAvailable": null,
      "eventId": null
    },
    "card002": {
      "name": "Rare Tree Spirit",
      "rarity": "legendary",
      "imageUrl": "https://link.to/image.png",
      "available": true,
      "copiesAvailable": 20,
      "eventId": "event01"
    }
  },
  "packs": {
    "monthlyPackApril2025": {
      "name": "April Surprise Pack",
      "available": true,
      "limitPerStudent": 1,
      "cardProbabilities": {
        "common": 60,
        "rare": 30,
        "legendary": 9,
        "mythic": 1
      }
    }
  },
  "events": {
    "event01": {
      "name": "Environment Week",
      "startDate": "2025-06-01",
      "endDate": "2025-06-07",
      "bonusMultiplier": 2,
      "cards": ["card002"]
    }
  },
  "trades": {
    "tradeID123": {
      "from": "uid1",
      "to": "uid2",
      "offered": {
        "cards": {
          "card005": 1
        },
        "coins": 10
      },
      "requested": {
        "cards": {
          "card003": 1
        },
        "coins": 0
      },
      "status": "pending"
    }
  },
  "rewards": {
    "log001": {
      "teacherId": "uidT001",
      "studentId": "uid1",
      "coins": 5,
      "timestamp": 1714330000000,
      "reason": "Helped clean the lab"
    }
  },
  "multipliers": {
    "current": {
      "active": true,
      "multiplier": 2,
      "start": "2025-06-01T00:00:00Z",
      "end": "2025-06-07T23:59:59Z"
    }
  }
}


All texts, labens and interfaces will be in Portugueses Brazillian
  