<?php
/**
 * Trumbowyg - Spellchecker Plugin
 *
 * A plugin for Trumbowyg Editor that uses Bootstrap 5, Enchant 2, and PHP for text checking.
 * The dictionary must be properly configured in Enchant 2 and the PHP extension must be active on the server.
 * Trumbowyg is a program of <alex-d.github.io/Trumbowyg>
 *
 * @author  Lucas Guimarães <https://github.com/guimaraeslucas/>
 *
 * Copyright 2025, Lucas Guimarães e G3Pix Ltda <https://g3pix.com.br>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */


/**
 * SpellChecker Class
 * A standalone PHP class for spell checking and word suggestion
 * using the PHP Enchant extension. 
 *
 * Requirements:
 * - PHP
 * - PHP Enchant extension installed and enabled.
 * - Dictionary for the desired language (e.g., en_US) installed on the server for Hunspell/Enchant.
 */
class SpellChecker
{
    /**
     * @var resource The Enchant broker resource. 
     */
    private $broker;

    /**
     * @var resource The Enchant dictionary resource. 
     */
    private $dictionary;

    /**
     * Class constructor.
     * Initializes the Enchant broker and dictionary.
     *
     * @param string $language The language code for the dictionary (e.g., 'pt_BR', 'en_US'). 
     * @throws \Exception If the Enchant extension is not available or the dictionary is not found. 
     */
    public function __construct(string $language = 'pt_BR')
    {
        // Check if the Enchant extension is available
        if (!function_exists('enchant_broker_init')) {
            throw new \Exception("PHP Enchant extension not installed or enabled.");
        }

        $this->broker = enchant_broker_init();

        // Check if the dictionary for the specified language is available
        if (!enchant_broker_dict_exists($this->broker, $language)) {
            throw new \Exception("Dictionary/Dicionário '{$language}' Enchant/Hunspell not found.");
        }

        $this->dictionary = enchant_broker_request_dict($this->broker, $language);
    }

    /**
     * Checks a text and returns an array of misspelled words.
     *
     * / @param string $text The text to be checked. O texto a ser verificado.
     * @return array An array containing the misspelled words. 
     */
    public function check(string $text): array
    {
        if (empty($text)) {
            return [];
        }

        //  Remove punctuation (keeping hyphens) and line breaks, then splits into unique words.
        //  The 'u' (Unicode) flag is important to correctly handle accented characters.
        $cleanText = preg_replace('/[^\p{L}\p{N}\s-]/u', ' ', $text);
        $words = array_unique(preg_split('/[\s,]+/', $cleanText, -1, PREG_SPLIT_NO_EMPTY));
        
        $errors = [];
        foreach ($words as $word) {
            // Ignore words that are too short or are just numbers.
            // mb_strlen is used to count multibyte characters correctly.
            if (mb_strlen($word) > 2 && !is_numeric($word)) {
                if (!enchant_dict_check($this->dictionary, $word)) {
                    $errors[] = $word;
                }
            }
        }

        return $errors;
    }

    /**
     * Receives a word and returns an array of suggestions.
     *
     * @param string $word The word to get suggestions for. 
     * @return array An array of suggested words. 
     */
    public function suggest(string $word): array
    {
        if (empty($word)) {
            return [];
        }

        return enchant_dict_suggest($this->dictionary, $word);
    }

    /**
     * Class destructor.
     * Frees the Enchant broker resources to prevent memory leaks.
     */
    public function __destruct()
    {
        if (is_resource($this->broker)) {
            //enchant_broker_free($this->broker); 
            unset($this->broker);
        }
    }
}


// -------------------------------------------------------------------
// USAGE EXAMPLE
// -------------------------------------------------------------------

// This would be your "entry point", like an "spell_api.php" file.
// It decides which class method to call based on a GET parameter.

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    $spellchecker = new SpellChecker('pt_BR');
    $response = [];

    switch ($action) {
        case 'check':
            // Gets the text from the $_POST variable
            $text_to_check = $_POST['text'] ?? '';
            $response = $spellchecker->check($text_to_check);
            break;

        case 'suggest':
            // Gets the word from the $_GET variable
            $word_to_suggest = $_GET['word'] ?? '';
            $response = $spellchecker->suggest($word_to_suggest);
            break;

        default:
            // Sets an error status in the HTTP header if the action is invalid
            http_response_code(400); // Bad Request
            $response = ['error' => 'Ação inválida. Use "check" ou "suggest".'];
            break;
    }

    // Prints the response in JSON format
    echo json_encode($response);

} catch (\Exception $e) {
    // Catches exceptions (e.g., Enchant not installed) and returns a 500 error
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Erro no servidor: ' . $e->getMessage()]);
}

/*
HOW TO TEST THIS EXAMPLE:

1. Save this code as a PHP file (e.g., `spell_api.php`).
2. Use a tool like Postman or cURL to make the requests.

To check a text (CHECK method):
Use the POST method for the URL: http://localhost/spell_api.php?action=check

Request body (form-data or x-www-form-urlencoded):
Key: text
Value: "Thise is a twxt with an intentional error."

To get suggestions (SUGGEST method):
Use the GET method for the URL: http://localhost/spell_api.php?action=suggest&word=twxt
*/

