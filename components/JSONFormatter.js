import React, { useState, useEffect } from 'react';
import { Moon, Sun, Copy, ChevronDown, ChevronRight } from 'lucide-react';

const JSONFormatter = () => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

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

  // Format JSON
  const formatJSON = () => {
    if (!input.trim()) {
      setError('Пожалуйста, введите JSON для форматирования');
      setParsedData(null);
      return;
    }

    try {
      const parsedJSON = JSON.parse(input);
      setParsedData(parsedJSON);
      setError('');
      
      // Initialize expanded nodes for the first two levels
      const initialExpandedNodes = new Set();
      expandInitialNodes(parsedJSON, '', initialExpandedNodes, 0, 2);
      setExpandedNodes(initialExpandedNodes);
    } catch (err) {
      setError(`Ошибка: ${err.message}`);
      setParsedData(null);
    }
  };

  // Recursively expand nodes up to the specified level
  const expandInitialNodes = (data, path, expandedSet, currentLevel, maxLevel) => {
    if (currentLevel >= maxLevel) return;
    
    if (typeof data === 'object' && data !== null) {
      expandedSet.add(path);
      
      Object.keys(data).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        expandInitialNodes(data[key], newPath, expandedSet, currentLevel + 1, maxLevel);
      });
    }
  };

  // Toggle node expansion
  const toggleNode = (path) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(path)) {
      newExpandedNodes.delete(path);
    } else {
      newExpandedNodes.add(path);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // Format JSON on pressing Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      formatJSON();
    }
  };

  // Copy formatted JSON to clipboard
  const copyToClipboard = () => {
    if (parsedData) {
      navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2))
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
    setParsedData(null);
    setError('');
  };

  // Render a JSON node
  const renderJSONNode = (data, path = '', depth = 0) => {
    if (data === null) {
      return <span className="json-null ml-2">null</span>;
    }
    
    if (typeof data !== 'object') {
      const valueClass = 
        typeof data === 'string' ? 'json-string' :
        typeof data === 'number' ? 'json-number' :
        typeof data === 'boolean' ? 'json-boolean' : '';
      
      return <span className={`${valueClass} ml-2`}>{
        typeof data === 'string' ? `"${data}"` : 
        String(data)
      }</span>;
    }
    
    const isArray = Array.isArray(data);
    const items = isArray ? data : Object.keys(data);
    const isExpanded = expandedNodes.has(path);
    const hasChildren = items.length > 0;
    const childrenCount = items.length;
    
    const paddingLeft = `${depth * 1.5}rem`;
    
    return (
      <div className="flex flex-col">
        <div 
          className="flex items-center cursor-pointer"
          style={{ paddingLeft }}
          onClick={() => hasChildren && toggleNode(path)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <span className="w-4" />
          )}
          
          {path ? (
            <span className="json-key">{path.split('.').pop()}</span>
          ) : (
            <span className={isArray ? "json-bracket" : "json-key"}>
              {isArray ? `ARRAY [${childrenCount}]` : `OBJECT {${childrenCount}}`}
            </span>
          )}
          
          {!isExpanded && hasChildren && (
            <span className="text-gray-500 ml-2">
              {isArray ? `[${childrenCount}]` : `{${childrenCount}}`}
            </span>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {isArray ? (
              items.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center">
                    {renderJSONNode(item, `${path}[${index}]`, depth + 1)}
                  </div>
                </div>
              ))
            ) : (
              Object.keys(data).map((key) => (
                <div key={key} className="flex flex-col">
                  <div className="flex items-center">
                    {typeof data[key] === 'object' && data[key] !== null ? (
                      renderJSONNode(
                        data[key], 
                        path ? `${path}.${key}` : key, 
                        depth + 1
                      )
                    ) : (
                      <div className="flex items-center" style={{ paddingLeft: `${(depth + 1) * 1.5}rem` }}>
                        <span className="json-key">{key}</span>
                        {renderJSONNode(data[key])}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
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
              <label className="font-semibold">Иерархический просмотр JSON:</label>
              {parsedData && (
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
            
            <div className="mb-3">
              <button 
                onClick={formatJSON} 
                className={`px-4 py-2 rounded font-semibold ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                aria-label="Форматировать JSON"
              >
                Форматировать JSON
              </button>
            </div>
            
            <div 
              className={`p-4 rounded border h-96 overflow-auto font-mono ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
              aria-label="Отформатированный JSON"
            >
              {parsedData ? (
                renderJSONNode(parsedData)
              ) : (
                <div className="text-gray-400 italic">
                  Здесь будет отображаться структурированный JSON
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-600 rounded" role="alert">
            {error}
          </div>
        )}
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