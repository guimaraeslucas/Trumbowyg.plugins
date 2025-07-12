## 🔡 Spell Checker Plugin

This plugin integrates a robust spell checker into Trumbowyg, highlighting misspelled words and offering correction suggestions.

### Backend Requirements

The backend is built using **PHP** and the **Enchant 2** library.

  * The Enchant library must be installed on your server.
  * A dictionary for the desired language (e.g., `pt_BR`, `en_US`) must be correctly configured in Enchant.
  * The `php-enchant` extension must be enabled in your `php.ini`.

An example PHP API file (`spell_api.php`) is included in this repository to demonstrate the implementation.

### API JSON Response Examples

The backend API has two main actions:

#### A) `action=check`

Receives a block of text and returns an array of misspelled words.

**Example JSON Response:**

```json
[
  "mispelled"
]
```

#### B) `action=suggest`

Receives a single word and returns an array of correction suggestions.

**Example JSON Response for the word `mispelled`:**

```json
[
  "misspelled",
  "misspell",
  "dispelled"
]
```
