import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const JSONFormatter = () => {
  const [input, setInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
      const storedDarkMode = localStorage.getItem('darkMode');
      if (storedDarkMode !== null) {
        setDarkMode(storedDarkMode === 'true');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode);
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Функция форматирования JSON; можно передать текст напрямую
  const formatJSON = (textInput) => {
    const jsonText = textInput !== undefined ? textInput : input;
    if (!jsonText.trim()) {
      setError('Пожалуйста, введите JSON для форматирования');
      setParsedData(null);
      return;
    }
    try {
      const parsedJSON = JSON.parse(jsonText);
      setParsedData(parsedJSON);
      setError('');
      const initialExpandedNodes = new Set();
      expandInitialNodes(parsedJSON, '', initialExpandedNodes, 0, 2);
      setExpandedNodes(initialExpandedNodes);
      setShowResult(true);
    } catch (err) {
      setError(`Ошибка: ${err.message}`);
      setParsedData(null);
    }
  };

  // Раскрытие узлов до 2-го уровня
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

  // Переключение раскрытия узла
  const toggleNode = (path) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(path)) {
      newExpandedNodes.delete(path);
    } else {
      newExpandedNodes.add(path);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // Функция для чтения из буфера обмена; после вставки сразу форматируем
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      formatJSON(text);
    } catch (err) {
      console.error('Ошибка чтения из буфера обмена:', err);
    }
  };

  const clearAll = () => {
    setInput('');
    setParsedData(null);
    setError('');
    setShowResult(false);
  };

  // Функция возврата к форме ввода
  const goBack = () => {
    setShowResult(false);
  };

  // Рендеринг узла JSON
  const renderJSONNode = (data, path = '', depth = 0) => {
    if (data === null) {
      return <span className="json-null ml-2">null</span>;
    }
    if (typeof data !== 'object') {
      const valueClass = 
        typeof data === 'string' ? 'json-string' :
        typeof data === 'number' ? 'json-number' :
        typeof data === 'boolean' ? 'json-boolean' : '';
      return <span className={`${valueClass} ml-2`}>
        {typeof data === 'string' ? `"${data}"` : String(data)}
      </span>;
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
          {hasChildren ? (isExpanded ? <span>&#9660;</span> : <span>&#9654;</span>) : <span className="w-4" />}
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
                  {renderJSONNode(item, `${path}[${index}]`, depth + 1)}
                </div>
              ))
            ) : (
              Object.keys(data).map((key) => (
                <div key={key} className="flex flex-col">
                  {typeof data[key] === 'object' && data[key] !== null ? (
                    renderJSONNode(data[key], path ? `${path}.${key}` : key, depth + 1)
                  ) : (
                    <div className="flex items-center" style={{ paddingLeft: `${(depth + 1) * 1.5}rem` }}>
                      <span className="json-key">{key}</span>
                      {renderJSONNode(data[key])}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
      {/* Плавающий переключатель темы */}
      <button 
        onClick={toggleDarkMode} 
        className={`fixed top-4 right-4 p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        aria-label={darkMode ? "Включить светлую тему" : "Включить темную тему"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      <main className="flex-grow container mx-auto p-6 max-w-6xl">
        {showResult ? (
          // Отображение результата на всю страницу после форматирования
          <div>
            <div className="flex justify-end mb-4">
              <button 
                onClick={goBack} 
                className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
              >
                Вернуться к вводу
              </button>
            </div>
            <div 
              className="p-4 rounded border overflow-auto font-mono bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Отформатированный JSON"
            >
              {renderJSONNode(parsedData)}
            </div>
          </div>
        ) : (
          // Форма ввода (одна колонка)
          <div className="flex flex-col">
            <div className="flex justify-end items-center mb-2">
              <button 
                onClick={pasteFromClipboard}
                className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Вставить из буфера
              </button>
              <button 
                onClick={clearAll} 
                className={`px-3 py-1 rounded text-sm ml-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Очистить
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') formatJSON();
              }}
              className={`p-4 rounded border h-96 font-mono ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              placeholder="Вставьте или введите JSON здесь..."
              aria-label="Поле ввода JSON"
            />
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-600 rounded" role="alert">
            {error}
          </div>
        )}
      </main>
    </div>
  );
};

export default JSONFormatter;