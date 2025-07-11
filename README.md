Trumbowyg Advanced Plugins
A collection of advanced plugins for the Trumbowyg WYSIWYG editor, implementing IntelliSense-like features and a powerful spell checker.

✅ General Info

Trumbowyg Version: Tested up to v2.31.0.

Backend: Examples are provided in PHP.

Dependency: Requires Bootstrap 5 for modal windows and styling.

🔌 1. IntelliSense Plugin
This plugin enhances the editor by simulating an IntelliSense-like feature. It allows a suggestion box to be triggered by a specific character (e.g., /), fetching dynamic content from a backend endpoint and inserting it directly into the editor. It's perfect for creating templates, canned responses, or dynamic snippets.

Backend Requirements
The backend must be able to receive a search term and return a JSON response in the following format:

[
  {
    "id": 123,
    "title": "Report Model 1",
    "content": "This is the full content of the first model..."
  },
  {
    "id": 456,
    "title": "Report Model 2",
    "content": "<h1>A Title</h1><p>This is the second model, which can include <strong>HTML</strong> content.</p>"
  }
]

id: A unique identifier for the item.

title: The text that will be displayed in the suggestion list.

content: The actual content (can be plain text or HTML) that will be inserted into the editor when the item is selected.

🔡 2. Spell Checker Plugin
This plugin integrates a robust spell checker into Trumbowyg, highlighting misspelled words and offering correction suggestions.

Backend Requirements
The backend is built using PHP and the Enchant 2 library.

The Enchant library must be installed on your server.

A dictionary for the desired language (e.g., pt_BR, en_US) must be correctly configured in Enchant.

The php-enchant extension must be enabled in your php.ini.

An example PHP API file (spell_api.php) is included in this repository to demonstrate the implementation.

API JSON Response Examples
The backend API has two main actions:

A) action=check
Receives a block of text and returns an array of misspelled words.

Example JSON Response:

[
  "mispelled"
]

B) action=suggest
Receives a single word and returns an array of correction suggestions.

Example JSON Response for the word mispelled:

[
  "misspelled",
  "misspell",
  "dispelled"
]

Plugins Avançados para Trumbowyg
Uma coleção de plugins avançados para o editor WYSIWYG Trumbowyg, implementando funcionalidades do tipo IntelliSense e um poderoso corretor ortográfico.

✅ Informações Gerais

Versão do Trumbowyg: Testado até a v2.31.0.

Backend: Os exemplos são fornecidos em PHP.

Dependência: Requer Bootstrap 5 para as janelas modais e estilização.

🔌 1. Plugin IntelliSense
Este plugin aprimora o editor simulando um recurso do tipo IntelliSense. Ele permite que uma caixa de sugestões seja acionada por um caractere específico (ex: /), buscando conteúdo dinâmico de um endpoint de backend e inserindo-o diretamente no editor. É perfeito para criar modelos, respostas prontas ou snippets dinâmicos.

Requisitos do Backend
O backend deve ser capaz de receber um termo de busca e retornar uma resposta JSON no seguinte formato:

[
  {
    "id": 123,
    "title": "Modelo de Laudo 1",
    "content": "Este é o conteúdo completo do primeiro modelo..."
  },
  {
    "id": 456,
    "title": "Modelo de Laudo 2",
    "content": "<h1>Um Título</h1><p>Este é o segundo modelo, que pode incluir conteúdo em <strong>HTML</strong>.</p>"
  }
]

id: Um identificador único para o item.

title: O texto que será exibido na lista de sugestões.

content: O conteúdo real (pode ser texto puro ou HTML) que será inserido no editor quando o item for selecionado.

🔡 2. Plugin Corretor Ortográfico (Spell Checker)
Este plugin integra um robusto corretor ortográfico ao Trumbowyg, destacando palavras com erros de ortografia e oferecendo sugestões de correção.

Requisitos do Backend
O backend é construído usando PHP e a biblioteca Enchant 2.

A biblioteca Enchant deve estar instalada no seu servidor.

Um dicionário para o idioma desejado (ex: pt_BR, en_US) deve estar devidamente configurado no Enchant.

A extensão php-enchant deve estar habilitada no seu php.ini.

Um arquivo de exemplo da API em PHP (spell_api.php) está incluído neste repositório para demonstrar a implementação.

Exemplos de Resposta JSON da API
A API do backend possui duas ações principais:

A) action=check
Recebe um bloco de texto e retorna um array com as palavras escritas de forma incorreta.

Exemplo de Resposta JSON:

[
  "testo"
]

B) action=suggest
Recebe uma única palavra e retorna um array com sugestões de correção.

Exemplo de Resposta JSON para a palavra testo:

[
  "texto",
  "testo",
  "testos"
]
