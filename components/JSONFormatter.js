import React, { useState, useEffect } from 'react';
import { Moon, Sun, Copy } from 'lucide-react';

const JSONFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [highlightedOutput, setHighlightedOutput] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Effect to check system preference for dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
      
      // Store dark mode preference in localStorage
      const storedDarkMode = localStorage.getItem('darkMode');
      if (storedDarkMode !== null) {
        setDarkMode(storedDarkMode === 'true');
      }
    }
  }, []);

  // Update localStorage when dark mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode);
    }
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Create syntax-highlighted HTML from JSON
  const highlightJSON = (json) => {
    if (!json) return '';
    
    // Replace with HTML for syntax highlighting
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
          // Remove quotes and colon from the key
          match = match.replace(/"|:$/g, '');
          // Add a specific styling for keys
          return `<span class="${cls}">"${match}"</span><span class="json-punctuation">:</span>`;
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    })
    // Add syntax highlighting for brackets and commas
    .replace(/[[\]{}]/g, match => `<span class="json-bracket">${match}</span>`)
    .replace(/,/g, '<span class="json-punctuation">,</span>');
  };

  // Format JSON
  const formatJSON = () => {
    if (!input.trim()) {
      setError('Пожалуйста, введите JSON для форматирования');
      setOutput('');
      setHighlightedOutput('');
      return;
    }

    try {
      const parsedJSON = JSON.parse(input);
      const formattedJSON = JSON.stringify(parsedJSON, null, 2);
      setOutput(formattedJSON);
      setHighlightedOutput(highlightJSON(formattedJSON));
      setError('');
    } catch (err) {
      setError(`Ошибка: ${err.message}`);
      setOutput('');
      setHighlightedOutput('');
    }
  };

  // Format JSON on pressing Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      formatJSON();
    }
  };

  // Copy formatted JSON to clipboard
  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  // Add a sample JSON for demonstration
  const addSampleJSON = () => {
    const sampleJSON = `{"name":"John Doe","age":30,"isActive":true,"address":{"street":"123 Main St","city":"New York","zipCode":"10001"},"phoneNumbers":[{"type":"home","number":"212-555-1234"},{"type":"work","number":"646-555-4567"}],"children":null}`;
    setInput(sampleJSON);
  };

  // Clear both input and output
  const clearAll = () => {
    setInput('');
    setOutput('');
    setHighlightedOutput('');
    setError('');
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <header className="py-4 px-6 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold">JSON Formatter</h1>
        <button 
          onClick={toggleDarkMode} 
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          aria-label={darkMode ? "Включить светлую тему" : "Включить темную тему"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="flex-grow container mx-auto p-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold">Введите JSON:</label>
              <div className="flex space-x-2">
                <button 
                  onClick={addSampleJSON} 
                  className={`px-3 py-1 rounded text-sm ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Пример
                </button>
                <button 
                  onClick={clearAll} 
                  className={`px-3 py-1 rounded text-sm ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Очистить
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`p-4 rounded border h-96 font-mono ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
              placeholder="Введите сырой JSON здесь..."
              aria-label="Поле ввода JSON"
            />
            <div className="mt-2 text-sm text-gray-500">
              Подсказка: Используйте Ctrl+Enter для быстрого форматирования
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold">Отформатированный JSON:</label>
              {output && (
                <button 
                  onClick={copyToClipboard} 
                  className={`flex items-center px-3 py-1 rounded text-sm ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  aria-label="Копировать отформатированный JSON"
                >
                  <Copy size={16} className="mr-1" />
                  {copySuccess ? "Скопировано!" : "Копировать"}
                </button>
              )}
            </div>
            <div 
              className={`p-4 rounded border h-96 overflow-auto font-mono ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
              aria-label="Отформатированный JSON"
              dangerouslySetInnerHTML={{ __html: highlightedOutput }}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-600 rounded" role="alert">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button 
            onClick={formatJSON} 
            className={`px-6 py-3 rounded font-semibold ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            aria-label="Форматировать JSON"
          >
            Форматировать JSON
          </button>
        </div>
      </main>

      <footer className={`py-4 px-6 text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <p className="text-sm">
          JSON Formatter - простое приложение для форматирования JSON
        </p>
      </footer>
    </div>
  );
};

export default JSONFormatter;