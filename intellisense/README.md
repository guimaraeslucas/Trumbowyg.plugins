## 🔌 1. IntelliSense Plugin

This plugin enhances the editor by simulating an IntelliSense-like feature. It allows a suggestion box to be triggered by a specific character (e.g., `/`), fetching dynamic content from a backend endpoint and inserting it directly into the editor. It's perfect for creating templates, canned responses, or dynamic snippets.

### Backend Requirements

The backend must be able to receive a search term and return a JSON response in the following format:

```json
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
````

  * `id`: A unique identifier for the item.
  * `title`: The text that will be displayed in the suggestion list.
  * `content`: The actual content (can be plain text or HTML) that will be inserted into the editor when the item is selected.

-----
